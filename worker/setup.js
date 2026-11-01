import {commerce,commerceTriggers} from './commerce-schema.generated.js';
import initialCatalog from '../public/data/catalog.json' with {type:'json'};
import {base,integrity,stockTrigger} from './schema.generated.js';
// Cache only completed checks. In-flight D1 work belongs to its originating request;
// another request must never wait on it after a navigation or cancellation.
const initialized=new WeakSet();
const requiredMigrations=['001','002','003','catalog-v1','004-storefront','005-commerce','006-payment-settings'];
async function schemaComplete(db){
 try{
  const rows=await db.prepare('SELECT id FROM homey_schema').all();
  const applied=new Set(rows.results.map(row=>row.id));
  return requiredMigrations.every(id=>applied.has(id));
 }catch(error){
  if(/no such table:\s*(?:main\.)?homey_schema\b/i.test(error.message))return false;
  throw error;
 }
}
async function migrate(db,id,sql){
 if(await db.prepare('SELECT id FROM homey_schema WHERE id=?').bind(id).first())return;
 try{await db.batch([db.prepare('INSERT INTO homey_schema(id) VALUES(?)').bind(id),...sql.map(s=>db.prepare(s))]);}
 catch(error){if(!await db.prepare('SELECT id FROM homey_schema WHERE id=?').bind(id).first())throw error;}
}
async function initialize(db){
 await db.prepare('CREATE TABLE IF NOT EXISTS homey_schema (id TEXT PRIMARY KEY)').run();
 await migrate(db,'001',base);
 await migrate(db,'002',[integrity]);
 const columns=await db.prepare('PRAGMA table_info(products)').all();
 const names=new Set(columns.results.map(c=>c.name));
 await migrate(db,'003',[
  ...(!names.has('revision')?['ALTER TABLE products ADD COLUMN revision INTEGER NOT NULL DEFAULT 0']:[]),
  ...(!names.has('last_write')?['ALTER TABLE products ADD COLUMN last_write TEXT']:[]),stockTrigger
 ]);
 if(!await db.prepare("SELECT id FROM homey_schema WHERE id='catalog-v1'").first()){
  const statements=[];
  for(const p of initialCatalog.products){
   statements.push(db.prepare('INSERT OR IGNORE INTO products(id,data) VALUES(?,?)').bind(p.id,JSON.stringify(p)));
   for(const v of p.variants)statements.push(db.prepare('INSERT OR IGNORE INTO variants(id,product_id,stock) VALUES(?,?,?)').bind(v.id,p.id,v.stock));
  }
  for(const c of initialCatalog.categories)statements.push(db.prepare('INSERT OR IGNORE INTO categories(id,data) VALUES(?,?)').bind(c.id,JSON.stringify(c)));
  statements.push(db.prepare("INSERT OR IGNORE INTO settings(id,data) VALUES('store',?)").bind(JSON.stringify(initialCatalog.settings)));
  // Batches stay small for Workers/D1. The completion marker is written last; interrupted imports resume safely.
  for(let offset=0;offset<statements.length;offset+=40)await db.batch(statements.slice(offset,offset+40));
  await db.prepare("INSERT OR IGNORE INTO homey_schema(id) VALUES('catalog-v1')").run();
 }
 // Upgrade the owner's earlier demo installation without changing prices, stock or order history.
 if(!await db.prepare("SELECT id FROM homey_schema WHERE id='004-storefront'").first()){
  const row=await db.prepare("SELECT data FROM settings WHERE id='store'").first();
  const settings=row?JSON.parse(row.data):null;
  const changes=[];
  if(settings?.demoMode===true){
   delete settings.demoMode;delete settings.sampleContact;
   settings.checkoutEnabled=true;settings.announcement='';
   if(settings.email==='hello@example.com')settings.email='';
   for(const key of ['terms','privacy','shipping','returns'])if(/sample|preview|demo/i.test(settings[key]||''))settings[key]=initialCatalog.settings[key];
   changes.push(db.prepare("UPDATE settings SET data=? WHERE id='store'").bind(JSON.stringify(settings)));
   const products=await db.prepare('SELECT id,data FROM products').all();
   for(const row of products.results){const p=JSON.parse(row.data);if(!p.sample)continue;delete p.sample;
    const replacement=initialCatalog.products.find(x=>x.id===p.id);
    if(replacement){p.description=replacement.description;p.care=replacement.care;}
    for(const variant of p.variants)for(const field of ['size','color','type'])variant[field]=variant[field].replace(/ \(sample\)/gi,'');
    changes.push(db.prepare('UPDATE products SET data=?,revision=revision+1 WHERE id=?').bind(JSON.stringify(p),row.id));
   }
  }
  try{await db.batch([db.prepare("INSERT INTO homey_schema(id) VALUES('004-storefront')"),...changes]);}
  catch(error){if(!await db.prepare("SELECT id FROM homey_schema WHERE id='004-storefront'").first())throw error;}
 }

 // Orders and private evidence share one durable ledger. Apply once without rewriting existing orders.
 const orderColumns=await db.prepare('PRAGMA table_info(orders)').all();
 const orderNames=new Set(orderColumns.results.map(c=>c.name));
 await migrate(db,'005-commerce',[
  ...(!orderNames.has('payment_status')?["ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'awaiting_payment'"]:[]),
  ...(!orderNames.has('paid_at')?["ALTER TABLE orders ADD COLUMN paid_at TEXT"]:[]),
  ...commerce,...commerceTriggers,
  `INSERT INTO inventory_movements(variant_id,product_id,product_name,variant_label,quantity,stock_after,reason,note)
   SELECT v.id,v.product_id,COALESCE(json_extract(p.data,'$.name'),v.product_id),v.id,v.stock,v.stock,'opening_balance','Opening balance at ledger activation'
   FROM variants v JOIN products p ON p.id=v.product_id WHERE v.stock>0`
 ]);
 if(!await db.prepare("SELECT id FROM homey_schema WHERE id='006-payment-settings'").first()){
  const row=await db.prepare("SELECT data FROM settings WHERE id='store'").first();const s=JSON.parse(row.data);
  s.paymentMethod='easypaisa_manual';s.easypaisaAccountName??='';s.easypaisaAccountNumber??='';
  s.paymentInstructions??='Transfer the exact order total to the EasyPaisa account shown here. Include your order number where possible, then submit the transaction reference and a clear screenshot.';
  if(/collected on delivery|cash on delivery/i.test(s.terms||''))s.terms=s.terms.replace(/Payment is collected on delivery\./ig,'Payment is made in advance by EasyPaisa transfer. Payment evidence is reviewed manually before dispatch.').replace(/cash on delivery/ig,'EasyPaisa transfer');
  if(!/payment screenshots/i.test(s.privacy||''))s.privacy+='\n\nPayment screenshots are stored privately for manual payment review and are accessible to the store team. Order references let customers return to submit evidence later.';
  try{await db.batch([db.prepare("INSERT INTO homey_schema(id) VALUES('006-payment-settings')"),db.prepare("UPDATE settings SET data=? WHERE id='store'").bind(JSON.stringify(s))]);}catch(error){if(!await db.prepare("SELECT id FROM homey_schema WHERE id='006-payment-settings'").first())throw error;}
 }
}
export async function ensureDatabase(env){
 const db=env.DB;
 if(!db||initialized.has(db))return;
 // An existing store needs a single read, not DDL and migration probes on every cold isolate.
 if(!await schemaComplete(db))await initialize(db);
 initialized.add(db);
}
