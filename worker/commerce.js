import {assert,HttpError} from './domain.js';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const referenceOK=id=>typeof id==='string'&&/^HM-[a-f0-9-]{36}$/.test(id);
const byteLimit=env=>env.PAYMENTS?5*1024*1024:1024*1024;
export function proofStorage(env){return {provider:env.PAYMENTS?'private-r2':'private-d1',maxBytes:byteLimit(env)};}
export async function readBytes(request,limit){
 assert(Number(request.headers.get('Content-Length')||0)<=limit,'File is too large.',413);
 const reader=request.body?.getReader();assert(reader,'No file was supplied.');
 const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new HttpError(413,'File is too large.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return bytes;
}
export function imageType(bytes,mime){
 assert(['image/jpeg','image/png','image/webp'].includes(mime),'Use a JPEG, PNG or WebP screenshot.');
 const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10;
 const webp=new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
 assert(mime==='image/jpeg'?jpeg:mime==='image/png'?png:webp,'This file does not match its declared image type.');
 return {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[mime];
}
async function orderRow(env,id){assert(referenceOK(id),'Enter your complete order reference.');const row=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(id).first();assert(row,'Order not found. Check your order reference.',404);return row;}
export async function publicCommerce(request,env,path){
 if(request.method==='GET'&&/^\/api\/orders\/[^/]+\/payment$/.test(path)){
  assert(env.DB,'Order lookup is temporarily unavailable.',503);const row=await orderRow(env,path.split('/')[3]);const data=JSON.parse(row.data);
  const settingsRow=await env.DB.prepare("SELECT data FROM settings WHERE id='store'").first();const settings=JSON.parse(settingsRow.data);return json({id:row.id,total:data.total,currency:data.currency,status:row.status,paymentStatus:row.payment_status,canSubmit:row.status!=='cancelled'&&['awaiting_payment','rejected'].includes(row.payment_status),storage:proofStorage(env),paymentAccount:{easypaisaAccountName:settings.easypaisaAccountName||'',easypaisaAccountNumber:settings.easypaisaAccountNumber||'',paymentInstructions:settings.paymentInstructions||''}});
 }
 if(path!=='/api/payment-evidence'||request.method!=='POST')return null;
 assert(env.DB,'Payment submission is temporarily unavailable.',503);
 const contentType=request.headers.get('Content-Type')||'';assert(contentType.startsWith('multipart/form-data;'),'Upload the transaction reference and screenshot.');
 const bytes=await readBytes(request,byteLimit(env)+65536);
 const form=await new Response(bytes,{headers:{'Content-Type':contentType}}).formData();
 const orderId=form.get('orderId'),transactionRef=String(form.get('transactionReference')||'').trim().toUpperCase();
 assert(/^[A-Z0-9][A-Z0-9 ._-]{3,99}$/.test(transactionRef),'Enter the transaction reference from your EasyPaisa transfer.');
 const row=await orderRow(env,orderId);assert(row.status!=='cancelled'&&['awaiting_payment','rejected'].includes(row.payment_status),'This order is not currently accepting payment evidence.',409);
 const count=await env.DB.prepare('SELECT count(*) n FROM payment_submissions WHERE order_id=?').bind(orderId).first();assert(count.n<5,'Please contact the store before submitting more evidence.',429);
 const file=form.get('screenshot');assert(file&&typeof file.arrayBuffer==='function'&&file.size>0,'Attach a payment screenshot.');assert(file.size<=byteLimit(env),`Use an image smaller than ${env.PAYMENTS?'5 MB':'1 MB'}.`,413);
 const imageBytes=new Uint8Array(await file.arrayBuffer()),ext=imageType(imageBytes,file.type);const id=crypto.randomUUID();
 const storage=env.PAYMENTS?'r2':'d1',key=storage==='r2'?`payment-evidence/${orderId}/${id}.${ext}`:null;
 if(storage==='r2')await env.PAYMENTS.put(key,imageBytes,{httpMetadata:{contentType:file.type}});
 try{
  const statements=[env.DB.prepare('INSERT INTO payment_submissions(id,order_id,transaction_ref,storage,object_key,mime_type,byte_size) VALUES(?,?,?,?,?,?,?)').bind(id,orderId,transactionRef,storage,key,file.type,file.size)];
  if(storage==='d1')for(let offset=0,part=0;offset<imageBytes.byteLength;offset+=32768,part++)statements.push(env.DB.prepare('INSERT INTO payment_files(id,part,bytes) VALUES(?,?,?)').bind(id,part,imageBytes.slice(offset,offset+32768).buffer));
  await env.DB.batch(statements);
 }catch(error){if(key)await env.PAYMENTS.delete(key);console.error('Payment evidence write failed',error.message);throw new HttpError(409,'Evidence is already pending, or this transaction has already been used. Check the order status before trying again.');}
 return json({id,orderId,paymentStatus:'pending_review'},201);
}
function dateRange(search){const clauses=[],args=[];for(const [key,operator] of [['from','>='],['to','<']]){const value=search.get(key);if(!value)continue;assert(/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value)),'Use a valid date range.');const date=new Date(value+'T00:00:00+05:00');if(key==='to')date.setTime(date.getTime()+86400000);clauses.push(`datetime(created_at) ${operator} datetime(?)`);args.push(date.toISOString());}return {clauses,args};}
const csvCell=value=>{if(value==null)return '';let text=String(value);if(typeof value==='string'&&/^[=+\-@\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
function csv(headers,rows,name){return new Response('\ufeff'+[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${name}"`,'Cache-Control':'no-store'}});}
export async function commerceAdmin(request,env,path){
 const search=new URL(request.url).searchParams;
 if(path==='/api/admin/reports/sales'&&request.method==='GET'){
  const {clauses,args}=dateRange(search);const state=search.get('payment'),status=search.get('status');let q=search.get('q')?.trim().slice(0,100);while(q&&new TextEncoder().encode(q).length>46)q=q.slice(0,-1);
  if(state){assert(['awaiting_payment','pending_review','paid','rejected'].includes(state),'Invalid payment filter.');clauses.push('payment_status=?');args.push(state);}
  if(status){assert(['new','confirmed','dispatched','delivered','cancelled'].includes(status),'Invalid order filter.');clauses.push('status=?');args.push(status);}
  if(q){clauses.push("(id LIKE ? OR json_extract(data,'$.customer.name') LIKE ? OR json_extract(data,'$.customer.phone') LIKE ?)");args.push(...Array(3).fill('%'+q+'%'));}
  const where=clauses.length?'WHERE '+clauses.join(' AND '):'';
  const summary=await env.DB.prepare(`SELECT count(*) orders,COALESCE(sum(json_extract(data,'$.total')),0) booked,COALESCE(sum(CASE WHEN payment_status='paid' THEN json_extract(data,'$.total') ELSE 0 END),0) paid,COALESCE(sum(CASE WHEN payment_status<>'paid' AND status<>'cancelled' THEN json_extract(data,'$.total') ELSE 0 END),0) outstanding,COALESCE(sum(CASE WHEN payment_status='paid' THEN (SELECT sum(json_extract(value,'$.qty')) FROM json_each(orders.data,'$.items')) ELSE 0 END),0) unitsSold FROM orders ${where}`).bind(...args).first();
  const exporting=search.get('format')==='csv';assert(!exporting||summary.orders<=10000,'Filter the export to 10,000 orders or fewer.');
  const page=Math.max(1,Math.min(50000,Number(search.get('page'))||1)),limit=exporting?10000:50;
  const result=await env.DB.prepare(`SELECT *, (SELECT count(*) FROM payment_submissions WHERE order_id=orders.id) evidence_count,(SELECT id FROM payment_submissions WHERE order_id=orders.id ORDER BY CASE WHEN status='approved' THEN 0 ELSE 1 END,submitted_at DESC,rowid DESC LIMIT 1) evidence_id,(SELECT transaction_ref FROM payment_submissions WHERE order_id=orders.id ORDER BY CASE WHEN status='approved' THEN 0 ELSE 1 END,submitted_at DESC,rowid DESC LIMIT 1) transaction_ref FROM orders ${where} ORDER BY created_at DESC,rowid DESC LIMIT ? OFFSET ?`).bind(...args,limit,exporting?0:(page-1)*limit).all();
  const rows=result.results.map(r=>({...JSON.parse(r.data),status:r.status,paymentStatus:r.payment_status,createdAt:r.created_at,paidAt:r.paid_at,evidenceCount:r.evidence_count,evidenceId:r.evidence_id,transactionReference:r.transaction_ref}));
  if(exporting)return csv(['Order reference','Created (UTC)','Customer','Phone','City','Method','Order status','Payment status','Subtotal','Delivery','Total','Paid (UTC)','Transaction reference','Evidence ID'],rows.map(r=>[r.id,r.createdAt,r.customer.name,r.customer.phone,r.customer.city,r.payment,r.status,r.paymentStatus,r.subtotal,r.shipping,r.total,r.paidAt,r.transactionReference,r.evidenceId]),'homey-sales-ledger.csv');
  return json({rows,summary,page,pages:Math.ceil(summary.orders/limit)});
 }
 if(path==='/api/admin/reports/inventory'&&request.method==='GET'){
  const {clauses,args}=dateRange(search);const product=search.get('product'),reason=search.get('reason');if(product){clauses.push('product_id=?');args.push(product);}if(reason){assert(['opening_balance','opening_stock','stock_adjustment','restock','adjustment','order_reserved','order_cancelled','variant_removed'].includes(reason),'Invalid movement filter.');clauses.push('reason=?');args.push(reason);}
  const where=clauses.length?'WHERE '+clauses.join(' AND '):'';
  const summary=await env.DB.prepare(`SELECT count(*) movements,COALESCE(sum(CASE WHEN quantity>0 THEN quantity ELSE 0 END),0) unitsIn,COALESCE(sum(CASE WHEN quantity<0 THEN -quantity ELSE 0 END),0) unitsOut FROM inventory_movements ${where}`).bind(...args).first();
  const exporting=search.get('format')==='csv';assert(!exporting||summary.movements<=10000,'Filter the export to 10,000 movements or fewer.');const page=Math.max(1,Math.min(50000,Number(search.get('page'))||1)),limit=exporting?10000:50;
  const result=await env.DB.prepare(`SELECT * FROM inventory_movements ${where} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`).bind(...args,limit,exporting?0:(page-1)*limit).all();
  const stock=await env.DB.prepare('SELECT COALESCE(sum(stock),0) currentStock FROM variants'+(product?' WHERE product_id=?':'')).bind(...(product?[product]:[])).first();
  if(exporting)return csv(['Movement','Created (UTC)','Product','Product ID','Variant','Variant ID','Quantity change','Stock after movement','Reason','Order reference','Note'],result.results.map(r=>[r.id,r.created_at,r.product_name,r.product_id,r.variant_label,r.variant_id,r.quantity,r.stock_after,r.reason,r.order_id,r.note]),'homey-inventory-ledger.csv');
  return json({rows:result.results,summary:{...summary,...stock},page,pages:Math.ceil(summary.movements/limit)});
 }
 if(/^\/api\/admin\/payment-evidence\/[^/]+$/.test(path)&&request.method==='GET'){
  const id=path.split('/').pop();const proof=await env.DB.prepare('SELECT * FROM payment_submissions WHERE id=?').bind(id).first();assert(proof,'Evidence not found.',404);let bytes;
  if(proof.storage==='r2'){assert(env.PAYMENTS,'Private evidence storage is not connected.',503);const object=await env.PAYMENTS.get(proof.object_key);assert(object,'Evidence file not found.',404);bytes=object.body;}
  else{const files=await env.DB.prepare('SELECT bytes FROM payment_files WHERE id=? ORDER BY part').bind(id).all();assert(files.results.length,'Evidence file not found.',404);bytes=new Uint8Array(proof.byte_size);let offset=0;for(const file of files.results){const chunk=file.bytes instanceof ArrayBuffer?new Uint8Array(file.bytes):Array.isArray(file.bytes)?new Uint8Array(file.bytes):file.bytes;bytes.set(chunk,offset);offset+=chunk.byteLength;}assert(offset===proof.byte_size,'Evidence file is incomplete.',500);}
  return new Response(bytes,{headers:{'Content-Type':proof.mime_type,'Content-Disposition':`inline; filename="payment-${id}.${{'image/png':'png','image/webp':'webp','image/jpeg':'jpg'}[proof.mime_type]}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"}});
 }
 if(/^\/api\/admin\/payments\/[^/]+$/.test(path)&&request.method==='PUT'){
  const payload=await request.json();assert(['approved','rejected'].includes(payload.status),'Approve or reject this evidence.');assert(typeof(payload.note??'')==='string'&&(payload.note??'').length<=1000,'Review note is too long.');if(payload.status==='rejected')assert(payload.note?.trim(),'Explain why the payment evidence was rejected.');
  const id=path.split('/').pop();const proof=await env.DB.prepare('SELECT * FROM payment_submissions WHERE id=?').bind(id).first();assert(proof&&proof.status==='pending','Evidence is no longer awaiting review.',409);
  try{const r=await env.DB.prepare("UPDATE payment_submissions SET status=?,review_note=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").bind(payload.status,payload.note||'',id).run();assert((r.meta?.changes??r.changes)>0,'Evidence was already reviewed.',409);}catch(error){throw new HttpError(409,'This payment can no longer be reviewed. Reload the order.');}
  return json({ok:true});
 }
 if(path==='/api/admin/stock-adjustments'&&request.method==='POST'){
  const b=await request.json();assert(typeof b.variantId==='string'&&Number.isInteger(b.quantity)&&b.quantity!==0&&Math.abs(b.quantity)<=1000000,'Enter a valid variant and non-zero whole-number quantity.');assert(typeof b.note==='string'&&b.note.trim()&&b.note.length<=500,'Describe why you are changing stock.');
  const row=await env.DB.prepare('SELECT id FROM variants WHERE id=?').bind(b.variantId).first();assert(row,'Variant not found.',404);
  try{await env.DB.batch([env.DB.prepare('INSERT OR REPLACE INTO inventory_context(id,reason,note) VALUES(1,?,?)').bind(b.quantity>0?'restock':'adjustment',b.note),env.DB.prepare('UPDATE variants SET stock=stock+? WHERE id=?').bind(b.quantity,b.variantId),env.DB.prepare('DELETE FROM inventory_context WHERE id=1')]);}catch{throw new HttpError(409,'This adjustment would make stock negative. Reload the current inventory.');}
  return json({ok:true,variant:await env.DB.prepare('SELECT id,stock FROM variants WHERE id=?').bind(b.variantId).first()});
 }
 if(/^\/api\/admin\/orders\/[^/]+$/.test(path)){
  const id=path.split('/').pop(),row=await orderRow(env,id);
  if(request.method==='GET'){const evidence=await env.DB.prepare('SELECT id,transaction_ref,mime_type,byte_size,status,review_note,submitted_at,reviewed_at FROM payment_submissions WHERE order_id=? ORDER BY submitted_at DESC,rowid DESC').bind(id).all();return json({...JSON.parse(row.data),status:row.status,paymentStatus:row.payment_status,createdAt:row.created_at,paidAt:row.paid_at,evidence:evidence.results});}
  if(request.method==='PUT'){const b=await request.json();assert(['new','confirmed','dispatched','delivered','cancelled'].includes(b.status),'Invalid order status.');assert(row.status!=='cancelled'||b.status==='cancelled','Cancelled orders cannot be reopened.');if(['confirmed','dispatched','delivered'].includes(b.status))assert(row.payment_status==='paid','Approve the payment before confirming or dispatching the order.');if(b.status==='cancelled')assert(row.payment_status!=='paid','A paid order needs a separate refund review before cancellation.');
   try{await env.DB.prepare('UPDATE orders SET status=? WHERE id=?').bind(b.status,id).run();}catch{throw new HttpError(409,'This order changed while you were editing. Reload its details.');}return json({ok:true});}
 }
 return null;
}
