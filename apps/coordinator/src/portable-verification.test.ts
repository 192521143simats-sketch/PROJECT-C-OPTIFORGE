import {describe,it,expect} from "vitest";
import {createHash} from "node:crypto";
import {setImmediate as yieldToIO} from "node:timers/promises";
import {verifyPortableResult,ResultVerificationError} from "./portable-verification.js";

describe("independent portable result verification",()=>{
  it("independently verifies a hand-derived rectangular product with signed entries",async()=>{
    expect(await verifyPortableResult({operation:"matrix_multiply",left:[[1,2,3],[-1,0,2]],right:[[4,5],[6,-1],[2,3]]},{operation:"matrix_multiply",matrix:[[22,12],[0,1]]})).toMatchObject({matrix:[[22,12],[0,1]],verification:{status:"VERIFIED"}});
  });
  it("independently verifies the known three-step unsigned benchmark state",async()=>{
    expect(await verifyPortableResult({operation:"portable_benchmark",seed:0,iterations:3},{operation:"portable_benchmark",seed:0,iterations:3,checksum:3519870697})).toMatchObject({checksum:3519870697,verification:{status:"VERIFIED"}});
  });
  it.each([
    {operation:"matrix_multiply",matrix:[[21,12],[0,1]]},
    {operation:"matrix_multiply",matrix:[[22,12]]},
    {operation:"matrix_multiply",matrix:[[22,12],[0,1]],verification:{status:"VERIFIED"}},
    {operation:"matrix_multiply",matrix:[[22.5,12],[0,1]]},
    {operation:"matrix_multiply",matrix:[[32_000_001,12],[0,1]]}
  ])("rejects forged or malformed matrix answers",async answer=>{
    await expect(verifyPortableResult({operation:"matrix_multiply",left:[[1,2,3],[-1,0,2]],right:[[4,5],[6,-1],[2,3]]},answer)).rejects.toBeInstanceOf(ResultVerificationError);
  });
  it.each([
    {operation:"portable_benchmark",seed:0,iterations:3,checksum:3519870698},
    {operation:"portable_benchmark",seed:1,iterations:3,checksum:3519870697},
    {operation:"portable_benchmark",seed:0,iterations:2,checksum:3519870697},
    {operation:"portable_benchmark",seed:0,iterations:3,checksum:3519870697,score:999},
    {operation:"portable_benchmark",seed:0,iterations:3,checksum:4294967296}
  ])("rejects forged or malformed benchmark answers",async answer=>{
    await expect(verifyPortableResult({operation:"portable_benchmark",seed:0,iterations:3},answer)).rejects.toBeInstanceOf(ResultVerificationError);
  });
  it("yields during benchmark verification and honors cancellation",async()=>{
    const controller=new AbortController();
    const pending=verifyPortableResult({operation:"portable_benchmark",seed:0,iterations:1_000_000},{operation:"portable_benchmark",seed:0,iterations:1_000_000,checksum:0},controller.signal).catch(error=>error);
    await yieldToIO();controller.abort();expect((await pending).message).toContain("cancelled");
  });
  it("verifies exact matrix sums at the maximum inner dimension and entry bounds",async()=>{
    const payload={operation:"matrix_multiply",left:[Array(32).fill(1000)],right:Array.from({length:32},()=>[-1000])};
    expect(await verifyPortableResult(payload,{operation:"matrix_multiply",matrix:[[-32_000_000]]})).toMatchObject({matrix:[[-32_000_000]],verification:{status:"VERIFIED"}});
  });
  it("cancels matrix verification between bounded rows",async()=>{
    const controller=new AbortController();
    const payload={operation:"matrix_multiply",left:Array.from({length:32},()=>[1]),right:[[1]]};
    const pending=verifyPortableResult(payload,{operation:"matrix_multiply",matrix:Array.from({length:32},()=>[1])},controller.signal).catch(error=>error);
    await yieldToIO();controller.abort();expect((await pending).message).toContain("cancelled");
  });
  it("rejects a foreign answer operation before starting expensive recomputation",async()=>{
    const controller=new AbortController();controller.abort();
    await expect(verifyPortableResult({operation:"portable_benchmark",seed:0,iterations:1_000_000},{operation:"sha256",digest:"0".repeat(64),inputBytes:0},controller.signal)).rejects.toThrow("schema");
  });
  it("checks known SHA-256 vectors and UTF-8 byte lengths",async()=>{
    const verified=await verifyPortableResult({operation:"sha256",input:"abc"},{inputBytes:3,digest:"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",operation:"sha256"});
    expect(verified.verification.status).toBe("VERIFIED");
    const payload={operation:"sha256" as const,input:"café 🔧"};
    const answer={operation:"sha256",inputBytes:10,digest:createHash("sha256").update(Buffer.from(payload.input,"utf8")).digest("hex")};
    expect((await verifyPortableResult(payload,answer))).toMatchObject({operation:"sha256",inputBytes:10});
  });
  it.each([[2,1],[3,2],[4,2],[100,25],[1000,168],[2_000_000,148933]])("verifies the inclusive prime count for %i",async(limit,count)=>{
    expect(await verifyPortableResult({operation:"prime_count",limit},{operation:"prime_count",limit,count})).toMatchObject({count,verification:{status:"VERIFIED"}});
  });
  it("verifies binary-digest hash-chain semantics against a known first digest",async()=>{
    const payload={operation:"sha256_chain" as const,input:"abc",iterations:2};
    const expected=createHash("sha256").update(Buffer.from("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad","hex")).digest("hex");
    expect(await verifyPortableResult(payload,{operation:"sha256_chain",iterations:2,digest:expected})).toMatchObject({digest:expected,iterations:2});
  });
  it.each([
    {operation:"sha256",digest:"0".repeat(64),inputBytes:3},
    {operation:"sha256",digest:"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",inputBytes:1},
    {operation:"sha256",digest:"not-a-digest",inputBytes:3},
    {operation:"sha256",digest:"0".repeat(64),inputBytes:3,verification:{status:"VERIFIED"}},
    {operation:"prime_count",limit:3,count:2},null
  ])("rejects wrong values, foreign operations and forged metadata",async result=>{
    await expect(verifyPortableResult({operation:"sha256",input:"abc"},result)).rejects.toBeInstanceOf(ResultVerificationError);
  });
  it("rejects a prime answer for a different input",async()=>{
    await expect(verifyPortableResult({operation:"prime_count",limit:100},{operation:"prime_count",limit:99,count:25})).rejects.toThrow("differs");
  });
  it("rejects a hash-chain answer with the wrong iteration count",async()=>{
    await expect(verifyPortableResult({operation:"sha256_chain",input:"abc",iterations:2},{operation:"sha256_chain",iterations:1,digest:"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"})).rejects.toThrow("differs");
  });
  it("does not block I/O throughout expensive recomputation",async()=>{
    let settled=false;
    const pending=verifyPortableResult({operation:"sha256_chain",input:"abc",iterations:10000},{operation:"sha256_chain",iterations:10000,digest:"0".repeat(64)}).catch(()=>{}).finally(()=>{settled=true;});
    await yieldToIO();expect(settled).toBe(false);await pending;
  });
  it("honors cancellation between bounded chunks",async()=>{
    const controller=new AbortController();
    const pending=verifyPortableResult({operation:"sha256_chain",input:"abc",iterations:10_000_000},{operation:"sha256_chain",iterations:10_000_000,digest:"0".repeat(64)},controller.signal);
    await yieldToIO();controller.abort();await expect(pending).rejects.toThrow("cancelled");
  });
  it("rejects out-of-contract input before expensive verification",async()=>{
    await expect(verifyPortableResult({operation:"prime_count",limit:2_000_001},{operation:"prime_count",limit:2_000_001,count:0})).rejects.toThrow("schema");
  });
});
