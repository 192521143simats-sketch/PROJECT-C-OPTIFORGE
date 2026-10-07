import {expect,it} from "vitest";

it("computes real SHA-256 without secure-context Web Crypto",async()=>{
  const sent:unknown[]=[];
  const browserWorker={postMessage:(message:unknown)=>sent.push(message),onmessage:null as null|((event:{data:unknown})=>Promise<void>)};
  const previous=(globalThis as any).self;
  (globalThis as any).self=browserWorker;
  try{
    await import("./browser-worker.js");
    await browserWorker.onmessage!({data:{taskId:"test",attempt:1,payload:{operation:"sha256",input:"abc"}}});
    expect(sent).toMatchObject([{type:"completed",result:{digest:"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",inputBytes:3}}]);
  }finally{(globalThis as any).self=previous;}
});
