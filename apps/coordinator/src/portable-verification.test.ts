import {describe,it,expect} from "vitest";
import {createHash} from "node:crypto";
import {setImmediate as yieldToIO} from "node:timers/promises";
import {verifyPortableResult,ResultVerificationError} from "./portable-verification.js";

describe("independent portable result verification",()=>{
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
