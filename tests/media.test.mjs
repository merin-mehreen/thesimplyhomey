import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import {setup,request,auth} from './helpers.mjs';

const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6l8AAAAASUVORK5CYII=','base64'));
function bucket(){
 const objects=new Map();
 return {
  objects,
  async put(key,bytes,options){objects.set(key,{bytes:new Uint8Array(bytes),httpMetadata:options.httpMetadata});},
  async get(key){const object=objects.get(key);return object?{body:object.bytes,httpMetadata:object.httpMetadata}:null;},
  async list({prefix,limit}){return {objects:[...objects.keys()].filter(key=>key.startsWith(prefix)).slice(0,limit).map(key=>({key}))};}
 };
}
function upload(env,cookie,{bytes=png,type='image/png',headers={}}={}){
 return worker.fetch(new Request('https://homey.test/api/admin/media',{
  method:'POST',headers:{Origin:'https://homey.test','Content-Type':type,...(cookie?{Cookie:cookie}:{}),...headers},body:bytes
 }),env);
}

test('missing MEDIA disables product uploads while payment screenshots retain private database storage',async()=>{
 const {env}=setup(),cookie=await auth(env);
 const status=await(await request(env,'/api/admin/status','GET',null,cookie)).json();
 assert.equal(status.media,false);
 assert.equal(status.paymentEvidence.provider,'private-d1');
 assert.equal((await upload(env,cookie)).status,503);
 assert.deepEqual(await(await request(env,'/api/admin/media','GET',null,cookie)).json(),[]);
});

test('a MEDIA binding enables upload, listing and storefront image delivery',async()=>{
 const {env}=setup();env.MEDIA=bucket();
 const cookie=await auth(env);
 const status=await(await request(env,'/api/admin/status','GET',null,cookie)).json();
 assert.equal(status.media,true);
 assert.equal(status.paymentEvidence.provider,'private-d1');
 const uploaded=await upload(env,cookie);
 assert.equal(uploaded.status,200);
 const {url}=await uploaded.json();
 assert.match(url,/^\/media\/uploads\/[a-f0-9-]+\.png$/);
 assert.equal(env.MEDIA.objects.size,1);
 assert.deepEqual(await(await request(env,'/api/admin/media','GET',null,cookie)).json(),[url]);
 const image=await request(env,url);
 assert.equal(image.status,200);
 assert.equal(image.headers.get('content-type'),'image/png');
 assert.match(image.headers.get('cache-control'),/immutable/);
 assert.deepEqual(new Uint8Array(await image.arrayBuffer()),png);
});

test('product media writes require authentication and reject invalid images and oversized files',async()=>{
 const {env}=setup();env.MEDIA=bucket();
 assert.equal((await upload(env)).status,401);
 const cookie=await auth(env);
 assert.equal((await upload(env,cookie,{type:'image/svg+xml'})).status,400);
 assert.equal((await upload(env,cookie,{bytes:new TextEncoder().encode('not an image')})).status,400);
 assert.equal((await upload(env,cookie,{headers:{'Content-Length':'10000001'}})).status,413);
 assert.equal(env.MEDIA.objects.size,0);
});

test('public media URLs cannot expose payment evidence or arbitrary bucket objects',async()=>{
 const {env}=setup();env.MEDIA=bucket();
 await env.MEDIA.put('payment-evidence/private/receipt.png',png,{httpMetadata:{contentType:'image/png'}});
 assert.equal((await request(env,'/media/payment-evidence/private/receipt.png')).status,404);
 assert.equal((await request(env,'/media/private.png')).status,404);
 assert.equal((await request(env,'/api/admin/media')).status,401);
});
