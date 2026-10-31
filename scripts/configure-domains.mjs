import {readFile,writeFile} from 'node:fs/promises';
export const siteDomains={test:'home.economicsystems.cc',production:'thesimplyhomey.com'};
export function routesFor(target){
 if(!['test','production','both'].includes(target))throw new Error('Choose test, production or both.');
 const names=target==='both'?Object.values(siteDomains):[siteDomains[target]];
 return names.map(pattern=>({pattern,custom_domain:true}));
}
if(process.argv[1]?.endsWith('configure-domains.mjs')){
 const target=process.argv[2];
 if(!target){console.error('Usage: node scripts/configure-domains.mjs test|production|both');process.exitCode=1;}
 else{const config=JSON.parse(await readFile('wrangler.jsonc','utf8'));const managed=new Set(Object.values(siteDomains));
 // Preserve other existing routes; only these two explicitly managed hostnames are replaced.
 const existingRoutes=config.routes||(config.route?[config.route]:[]);delete config.route;
 config.routes=[...existingRoutes.filter(route=>!managed.has(typeof route==='string'?route:route.pattern)),...routesFor(target)];
 await writeFile('wrangler.jsonc',JSON.stringify(config,null,2)+'\n');
 console.log('Configured Custom Domains: '+routesFor(target).map(r=>r.pattern).join(', '));
 console.log('No DNS or account settings were changed. Commit this config and deploy when ready. Both zones must be active in your Cloudflare account.');
 }
}
