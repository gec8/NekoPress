export async function withTimeout<T>(operation:PromiseLike<T>,timeoutMs=2500):Promise<T|null>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  const timeout=new Promise<null>(resolve=>{timer=setTimeout(()=>resolve(null),timeoutMs)});
  try{return await Promise.race([Promise.resolve(operation).catch(()=>null),timeout])}
  finally{if(timer)clearTimeout(timer)}
}
