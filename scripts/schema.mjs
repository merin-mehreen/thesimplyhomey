import {readFile,writeFile} from 'node:fs/promises';
const base=(await readFile('migrations/0001_store.sql','utf8')).split(';').map(s=>s.trim()).filter(Boolean);
const integrity=await readFile('migrations/0002_order_integrity.sql','utf8');
const edits=await readFile('migrations/0003_edit_conflicts.sql','utf8');
const trigger=edits.slice(edits.indexOf('CREATE TRIGGER'));
await writeFile('worker/schema.generated.js',`// Generated from migrations by scripts/schema.mjs.\nexport const base = ${JSON.stringify(base,null,2)};\nexport const integrity = ${JSON.stringify(integrity)};\nexport const stockTrigger = ${JSON.stringify(trigger)};\n`);

const commerce=(await readFile('migrations/0004_commerce.sql','utf8')).split(';').map(s=>s.trim()).filter(s=>s&&!s.startsWith('ALTER TABLE orders'));
const commerceTriggers=(await readFile('migrations/0005_commerce_triggers.sql','utf8')).split(/(?=CREATE TRIGGER)/).map(s=>s.trim()).filter(Boolean);
await writeFile('worker/commerce-schema.generated.js',`// Generated from commerce migrations.\nexport const commerce = ${JSON.stringify(commerce,null,2)};\nexport const commerceTriggers = ${JSON.stringify(commerceTriggers,null,2)};\n`);
