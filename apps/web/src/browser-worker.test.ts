import {expect,it,vi} from "vitest";

async function browserAnswer(payload:unknown){
  const sent:unknown[]=[];
  const worker={postMessage:(message:unknown)=>sent.push(message),onmessage:null as null|((event:{data:unknown})=>Promise<void>)};
  const previous=(globalThis as any).self;
  (globalThis as any).self=worker;
  try{
    vi.resetModules();await import("./browser-worker.js");
    await worker.onmessage!({data:{taskId:"portable-test",attempt:1,payload}});
    return sent;
  }finally{(globalThis as any).self=previous;}
}

it("computes the same hand-derived signed rectangular matrix in a Web Worker",async()=>{
  expect(await browserAnswer({operation:"matrix_multiply",left:[[1,2,3],[-1,0,2]],right:[[4,5],[6,-1],[2,3]]})).toMatchObject([{type:"completed",result:{operation:"matrix_multiply",matrix:[[22,12],[0,1]]}}]);
});
it("computes the same unsigned benchmark checksum in a Web Worker",async()=>{
  expect(await browserAnswer({operation:"portable_benchmark",seed:0,iterations:3})).toMatchObject([{type:"completed",result:{operation:"portable_benchmark",seed:0,iterations:3,checksum:3519870697}}]);
});
it.each([
  {operation:"matrix_multiply",left:[[1001]],right:[[1]]},
  {operation:"matrix_multiply",left:[[1,2]],right:[[1]]},
  {operation:"portable_benchmark",seed:0,iterations:1_000_001},
  {operation:"portable_benchmark",seed:0,iterations:1,code:"untrusted"}
])("rejects malformed or excessive portable inputs in a Web Worker",async payload=>{
  expect(await browserAnswer(payload)).toMatchObject([{type:"failed",taskId:"portable-test",attempt:1,error:expect.any(String)}]);
});

it("computes real SHA-256 without secure-context Web Crypto",async()=>{
  const sent:unknown[]=[];
  const browserWorker={postMessage:(message:unknown)=>sent.push(message),onmessage:null as null|((event:{data:unknown})=>Promise<void>)};
  const previous=(globalThis as any).self;
  (globalThis as any).self=browserWorker;
  try{
    vi.resetModules();
    await import("./browser-worker.js");
    await browserWorker.onmessage!({data:{taskId:"test",attempt:1,payload:{operation:"sha256",input:"abc"}}});
    expect(sent).toMatchObject([{type:"completed",result:{digest:"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",inputBytes:3}}]);
  }finally{(globalThis as any).self=previous;}
});
