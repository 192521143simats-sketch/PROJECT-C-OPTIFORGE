import {createHash} from "node:crypto";
import {describe,expect,it} from "vitest";
import {execute} from "./executor.js";

describe("allow-listed worker executor",()=>{
  it("executes a bounded SHA-256 chain deterministically",async()=>{const completed=await execute({operation:"sha256_chain",input:"failure-recovery",iterations:3});let expected=Buffer.from("failure-recovery");for(let i=0;i<3;i++)expected=createHash("sha256").update(expected).digest();expect(completed.result).toEqual({operation:"sha256_chain",iterations:3,digest:expected.toString("hex")});expect(completed.executionTimeMs).toBeGreaterThanOrEqual(0);});
});
