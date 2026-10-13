import {describe,expect,it} from "vitest";
import * as scheduler from "./scheduler.js";

describe("attributable worker reliability",()=>{
  it("keeps cold-start metrics unknown and ignores in-flight attempts",()=>{
    expect(scheduler.deriveReliability?.([])).toMatchObject({sampleCount:0,score:null,successRate:null,averageExecutionTimeMs:null});
    expect(scheduler.deriveReliability?.([{status:"RUNNING"}])).toMatchObject({assigned:1,sampleCount:0,score:null});
  });
  it("excludes user pause, leave and coordinator failure from worker penalties",()=>{
    const metrics=scheduler.deriveReliability?.([{status:"COMPLETED",executionTimeMs:20},{status:"FAILED",failureReason:"USER_PAUSED"},{status:"FAILED",failureReason:"USER_LEFT"},{status:"FAILED",failureReason:"SERVER_FAILURE"},{status:"CANCELLED"}]);
    expect(metrics).toMatchObject({assigned:5,completed:1,failed:0,excluded:4,sampleCount:1,score:100,successRate:1,averageExecutionTimeMs:20});
  });
  it("counts attributable failure categories and derives bounded observed reliability",()=>{
    expect(scheduler.deriveReliability?.([{status:"COMPLETED",executionTimeMs:10},{status:"COMPLETED",executionTimeMs:30},{status:"FAILED",failureReason:"TIMEOUT"},{status:"FAILED",failureReason:"NETWORK_FAILURE"},{status:"FAILED",failureReason:"INVALID_RESULT"},{status:"FAILED",failureReason:"TASK_FAILURE"}])).toMatchObject({assigned:6,completed:2,failed:4,timeouts:1,disconnects:1,invalidResults:1,sampleCount:6,score:33.333,successRate:1/3,averageExecutionTimeMs:20});
  });
});
