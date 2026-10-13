import {createHash} from "node:crypto";
import {describe,expect,it} from "vitest";
import {execute} from "./executor.js";

describe("allow-listed worker executor",()=>{
  it("multiplies rectangular signed integer matrices exactly",async()=>{
    const completed=await execute({operation:"matrix_multiply",left:[[1,2,3],[-1,0,2]],right:[[4,5],[6,-1],[2,3]]});
    expect(completed.result).toEqual({operation:"matrix_multiply",matrix:[[22,12],[0,1]]});
  });
  it("produces the deterministic integer benchmark state, without an opaque score",async()=>{
    const completed=await execute({operation:"portable_benchmark",seed:0,iterations:3});
    expect(completed.result).toEqual({operation:"portable_benchmark",seed:0,iterations:3,checksum:3519870697});
  });
  it("uses unsigned overflow for the maximum benchmark seed",async()=>{
    expect((await execute({operation:"portable_benchmark",seed:4294967295,iterations:1})).result).toEqual({operation:"portable_benchmark",seed:4294967295,iterations:1,checksum:1012239698});
  });
  it("preserves exact matrix sums at the maximum dimensions and signed input bounds",async()=>{
    const completed=await execute({operation:"matrix_multiply",left:[Array(32).fill(1000)],right:Array.from({length:32},()=>[-1000])});
    expect(completed.result).toEqual({operation:"matrix_multiply",matrix:[[-32_000_000]]});
  });
  it("executes a bounded SHA-256 chain deterministically",async()=>{const completed=await execute({operation:"sha256_chain",input:"failure-recovery",iterations:3});let expected=Buffer.from("failure-recovery");for(let i=0;i<3;i++)expected=createHash("sha256").update(expected).digest();expect(completed.result).toEqual({operation:"sha256_chain",iterations:3,digest:expected.toString("hex")});expect(completed.executionTimeMs).toBeGreaterThanOrEqual(0);});
  it("runs the allow-listed C IR optimizer",async()=>{const completed=await execute({operation:"c_optimize_ir",function:{name:"main",returnType:"int",parameters:[],instructions:[{op:"const",dest:"%t0",value:2},{op:"const",dest:"%t1",value:3},{op:"binary",dest:"%t2",operator:"+",left:"%t0",right:"%t1"},{op:"return",value:"%t2"}]}});expect(completed.result).toMatchObject({operation:"c_optimize_ir",report:{constantFolds:1},function:{instructions:expect.arrayContaining([expect.objectContaining({op:"const",value:5})])}});});
});
