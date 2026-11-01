import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{catalogResponse} from '../worker/index.js';
import {ensureDatabase} from '../worker/setup.js';
import {withTimeout} from '../worker/timeout.js';
import {loadCatalog} from '../public/catalog-loader.js';
import {seed,setup,request} from './helpers.mjs';

test('an existing store starts with a read-only schema check and one catalogue batch',async()=>{
 const {env}=setup(false);
 await ensureDatabase(env);
 const queries=[];let batches=0;
 const original=env.DB;
 const checked={...env,DB:{
  prepare(sql){queries.push(sql);assert.match(sql,/^SELECT\b/i);return original.prepare(sql);},
  async batch(statements){batches++;return original.batch(statements);}
 }};
 const response=await request(checked,'/api/catalog');
 assert.equal(response.status,200);
 assert.equal((await response.json()).products.length,29);
 assert.equal(queries[0],'SELECT id FROM homey_schema');
 assert.equal(queries.length,5);
 assert.equal(batches,1);
 assert.match(response.headers.get('server-timing'),/db_setup;dur=.*catalog;dur=/);
});

test('a cancelled navigation cannot make a second request inherit unfinished D1 work',async()=>{
 const {env}=setup(false);
 await ensureDatabase(env);
 let cancelFirst,started;
 const gate=new Promise((_,reject)=>{cancelFirst=reject;});
 const entered=new Promise(resolve=>{started=resolve;});
 let calls=0;
 const original=env.DB;
 const wrap=statement=>({
  bind(...args){return wrap(statement.bind(...args));},
  ...Object.fromEntries(['first','all','run'].map(method=>[method,async(...args)=>{
   calls++;
   if(calls===1){started();await gate;}
   return statement[method](...args);
  }]))
 });
 const isolated={DB:{...original,prepare:sql=>wrap(original.prepare(sql))}};
 const first=ensureDatabase(isolated).catch(error=>error);
 await entered;
 try{
  await withTimeout(()=>ensureDatabase(isolated),200);
  assert.equal(calls,2,'the second request must perform its own completed-schema read');
 }finally{cancelFirst(new Error('Navigation cancelled'));await first;}
 await ensureDatabase(isolated);
 assert.equal(calls,2,'only completed checks may be reused');
});

test('a stalled catalogue returns a bounded error and a later request can recover',async()=>{
 const {env}=setup(false);
 await ensureDatabase(env);
 const original=env.DB;
 let first=true,cancel;
 const stalled=new Promise((_,reject)=>{cancel=reject;});
 const checked={...env,DB:{...original,prepare(sql){
  if(first){first=false;return {all:()=>stalled};}
  return original.prepare(sql);
 }}};
 const req=new Request('https://thesimplyhomey.com/api/catalog');
 const failed=await catalogResponse(req,checked,20);
 assert.equal(failed.status,503);
 assert.equal((await failed.json()).code,'C01');
 assert.equal(failed.headers.get('cache-control'),'no-store');
 assert.equal(failed.headers.get('retry-after'),'3');
 const recovered=await withTimeout(()=>catalogResponse(req,checked,200),500);
 assert.equal(recovered.status,200);
 assert.equal((await recovered.json()).products.length,29);
 cancel(new Error('Original request cancelled'));
});

test('database errors fail promptly without exposing internal SQL',async()=>{
 const response=await catalogResponse(new Request('https://thesimplyhomey.com/api/catalog'),{
  DB:{prepare(){throw new Error('internal database detail');}}
 },100);
 assert.equal(response.status,503);
 const data=await response.json();
 assert.equal(data.code,'C02');
 assert.doesNotMatch(data.error,/internal database detail/);
});

test('release status remains readable when the database is stalled',async()=>{
 const response=await request({DB:{prepare(){throw new Error('Status must not query D1');}}},'/api/status');
 assert.equal(response.status,200);
 assert.equal((await response.json()).release,'homey-catalog-reliability-v2');
});

test('public browsing does not depend on admin secrets',async()=>{
 const {env}=setup(false);
 const response=await request({...env,ADMIN_PASSWORD:'',SESSION_SECRET:''},'/api/catalog');
 assert.equal(response.status,200);
 assert.equal((await response.json()).products.length,29);
});

test('the browser aborts a stalled fetch and retries with an independent request',async()=>{
 const signals=[];
 const data=await loadCatalog({timeoutMs:15,retryDelayMs:0,fetchImpl:async(url,options)=>{
  assert.equal(url,'/api/catalog');
  assert.equal(options.cache,'no-store');
  signals.push(options.signal);
  if(signals.length===1)return new Promise(()=>{});
  return Response.json(seed);
 }});
 assert.equal(data.settings.currency,'PKR');
 assert.equal(signals.length,2);
 assert.equal(signals[0].aborted,true);
 assert.equal(signals[1].aborted,false);
});

test('the browser deadline also covers a response body that never finishes',async()=>{
 let signal;
 await assert.rejects(loadCatalog({attempts:1,timeoutMs:15,fetchImpl:async(_,options)=>{
  signal=options.signal;
  return {ok:true,json:()=>new Promise(()=>{})};
 }}),{code:'TIMEOUT'});
 assert.equal(signal.aborted,true);
});

test('a persistent browser stall stops after two attempts instead of loading forever',async()=>{
 const signals=[];
 await assert.rejects(loadCatalog({timeoutMs:15,retryDelayMs:0,fetchImpl:async(_,options)=>{
  signals.push(options.signal);return new Promise(()=>{});
 }}),{code:'TIMEOUT'});
 assert.equal(signals.length,2);
 assert.ok(signals.every(signal=>signal.aborted));
});

test('the browser retries a temporary service error but does not retry a rejected request',async()=>{
 let calls=0;
 const data=await loadCatalog({retryDelayMs:0,fetchImpl:async()=>{
  calls++;return calls===1?Response.json({code:'C01'},{status:503}):Response.json(seed);
 }});
 assert.equal(calls,2);
 assert.equal(data.settings.currency,'PKR');
 calls=0;
 await assert.rejects(loadCatalog({retryDelayMs:0,fetchImpl:async()=>{
  calls++;return new Response('Forbidden',{status:403});
 }}),{code:'HTTP_403'});
 assert.equal(calls,1);
});
