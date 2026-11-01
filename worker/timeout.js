export class TimeoutError extends Error {
 constructor(){super('The operation exceeded its response deadline.');this.name='TimeoutError';}
}

export async function withTimeout(operation,milliseconds){
 let timer;
 try{
  return await Promise.race([
   Promise.resolve().then(operation),
   new Promise((_,reject)=>{timer=setTimeout(()=>reject(new TimeoutError()),milliseconds);})
  ]);
 }finally{clearTimeout(timer);}
}
