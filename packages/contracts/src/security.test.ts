import {describe,expect,it} from "vitest";
import {workPayloadSchema} from "./index.js";

describe("worker execution boundary",()=>{
  it("rejects arbitrary commands and unknown operations",()=>{
    expect(workPayloadSchema.safeParse({operation:"shell",command:"whoami"}).success).toBe(false);
  });
  it("enforces submitted-source size limits",()=>{
    expect(workPayloadSchema.safeParse({operation:"python_compile",source:"x".repeat(1_000_001)}).success).toBe(false);
  });
  it("rejects unbounded synthetic workloads",()=>{
    expect(workPayloadSchema.safeParse({operation:"prime_count",limit:2_000_001}).success).toBe(false);
    expect(workPayloadSchema.safeParse({operation:"sha256_chain",input:"x",iterations:10_000_001}).success).toBe(false);
  });
});
