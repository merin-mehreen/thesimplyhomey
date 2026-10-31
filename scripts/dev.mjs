import {spawn} from 'node:child_process';
const args=process.argv.slice(2);const at=args.indexOf('--port');const port=at>=0?args[at+1]:process.env.PORT||'3000';
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','dev','--ip','0.0.0.0','--port',port],{stdio:'inherit'});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code??1));
