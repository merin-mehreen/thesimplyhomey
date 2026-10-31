import {readFile,writeFile} from 'node:fs/promises';
const config=JSON.parse(await readFile('wrangler.jsonc','utf8'));
config.r2_buckets??=[{binding:'MEDIA'}];
await writeFile('wrangler.jsonc',JSON.stringify(config,null,2)+'\n');
console.log('R2 upload binding added. Enable R2 in your account, then commit this configuration and redeploy. Wrangler will provision the bucket.');
