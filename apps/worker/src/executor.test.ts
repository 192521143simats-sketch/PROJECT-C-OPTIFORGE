import {createHash} from "node:crypto";
import {describe,expect,it} from "vitest";
import {execute} from "./executor.js";

describe("allow-listed worker executor",()=>{
  it("executes a bounded SHA-256 chain deterministically",async()=>{const completed=await execute({operation:"sha256_chain",input:"failure-recovery",iterations:3});let expected=Buffer.from("failure-recovery");for(let i=0;i<3;i++)expected=createHash("sha256").update(expected).digest();expect(completed.result).toEqual({operation:"sha256_chain",iterations:3,digest:expected.toString("hex")});expect(completed.executionTimeMs).toBeGreaterThanOrEqual(0);});
  it("runs the allow-listed C IR optimizer",async()=>{const completed=await execute({operation:"c_optimize_ir",function:{name:"main",returnType:"int",parameters:[],instructions:[{op:"const",dest:"%t0",value:2},{op:"const",dest:"%t1",value:3},{op:"binary",dest:"%t2",operator:"+",left:"%t0",right:"%t1"},{op:"return",value:"%t2"}]}});expect(completed.result).toMatchObject({operation:"c_optimize_ir",report:{constantFolds:1},function:{instructions:expect.arrayContaining([expect.objectContaining({op:"const",value:5})])}});});
});
