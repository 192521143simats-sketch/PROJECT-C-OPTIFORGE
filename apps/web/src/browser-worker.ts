import {optimizeCIR,type IRFunction} from "@c-optiforge/compiler-c/browser";

type Task={taskId:string;attempt:number;payload:any};
const hex=(bytes:ArrayBuffer)=>[...new Uint8Array(bytes)].map(value=>value.toString(16).padStart(2,"0")).join("");

self.onmessage=async(event:MessageEvent<Task>)=>{
  const{taskId,attempt,payload}=event.data,started=performance.now();
  try{
    let result:unknown;
    if(payload.operation==="sha256")result={operation:"sha256",digest:hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(payload.input))),inputBytes:new TextEncoder().encode(payload.input).byteLength};
    else if(payload.operation==="sha256_chain"){let value:ArrayBuffer=new TextEncoder().encode(payload.input).buffer;for(let index=0;index<payload.iterations;index++)value=await crypto.subtle.digest("SHA-256",value);result={operation:"sha256_chain",iterations:payload.iterations,digest:hex(value)};}
    else if(payload.operation==="prime_count"){const composite=new Uint8Array(payload.limit+1);let count=0;for(let number=2;number<=payload.limit;number++)if(!composite[number]){count++;if(number*number<=payload.limit)for(let multiple=number*number;multiple<=payload.limit;multiple+=number)composite[multiple]=1;}result={operation:"prime_count",limit:payload.limit,count};}
    else if(payload.operation==="c_optimize_ir"){const optimized=optimizeCIR({kind:"COptiForgeCIR",version:1,functions:[payload.function as IRFunction]});result={operation:"c_optimize_ir",function:optimized.ir.functions[0],report:optimized.report};}
    else throw new Error("This task requires a native worker capability.");
    self.postMessage({type:"completed",taskId,attempt,result,executionTimeMs:performance.now()-started});
  }catch(cause){self.postMessage({type:"failed",taskId,attempt,error:cause instanceof Error?cause.message:"Browser task failed"});}
};
