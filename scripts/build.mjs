import './schema.mjs';
import { cp, mkdir, rm } from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true,filter:p=>!p.startsWith('public/Images')});
await cp('Images','dist/Images',{recursive:true});console.log('Storefront and catalogue packaged in dist/');
