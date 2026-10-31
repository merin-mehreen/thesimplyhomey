import {readFile,writeFile} from 'node:fs/promises';
const config=JSON.parse(await readFile('wrangler.jsonc','utf8'));
config.r2_buckets??=[];for(const binding of ['MEDIA','PAYMENTS'])if(!config.r2_buckets.some(b=>b.binding===binding))config.r2_buckets.push({binding});
await writeFile('wrangler.jsonc',JSON.stringify(config,null,2)+'\n');
console.log('R2 catalogue and private payment-evidence bindings added. Enable R2 in your account, then commit this configuration and redeploy. Wrangler will provision separate buckets. Keep the PAYMENTS bucket private.');
