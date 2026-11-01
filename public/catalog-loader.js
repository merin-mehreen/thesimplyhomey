class CatalogError extends Error {
 constructor(message,{retryable=true,code='NETWORK'}={}){
  super(message);this.name='CatalogError';this.retryable=retryable;this.code=code;
 }
}

async function attempt(fetchImpl,timeoutMs){
 const controller=new AbortController();
 let timer;
 try{
  return await Promise.race([
   (async()=>{
    const response=await fetchImpl('/api/catalog',{signal:controller.signal,cache:'no-store'});
    if(!response.ok)throw new CatalogError('The collection is temporarily unavailable.',{
     retryable:response.status>=500||response.status===429,code:'HTTP_'+response.status
    });
    const data=await response.json();
    if(!data||!Array.isArray(data.products)||!Array.isArray(data.categories)||!data.settings||typeof data.settings!=='object'||Array.isArray(data.settings)){
     throw new CatalogError('The collection could not be read.',{code:'INVALID_CATALOG'});
    }
    return data;
   })(),
   new Promise((_,reject)=>{
    timer=setTimeout(()=>{
     reject(new CatalogError('The collection is taking longer than usual.',{code:'TIMEOUT'}));
     controller.abort();
    },timeoutMs);
   })
  ]);
 }finally{clearTimeout(timer);}
}

export async function loadCatalog({fetchImpl=globalThis.fetch,timeoutMs=10000,attempts=2,retryDelayMs=300}={}){
 for(let index=0;index<attempts;index++){
  try{return await attempt(fetchImpl,timeoutMs);}
  catch(error){
   if(error.retryable===false||index===attempts-1)throw error;
   await new Promise(resolve=>setTimeout(resolve,retryDelayMs));
  }
 }
}
