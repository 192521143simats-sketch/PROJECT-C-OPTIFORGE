import {describe,expect,it} from "vitest";
import * as contracts from "./index.js";

describe("network and contribution policy contracts",()=>{
  it("rejects unknown policy keys and unapproved workload operations",()=>{
    expect(contracts.networkPolicySchema?.safeParse({arbitraryShell:true}).success).toBe(false);
    expect(contracts.networkPolicySchema?.safeParse({allowedOperations:["shell"]}).success).toBe(false);
    expect(contracts.networkPolicySchema?.safeParse({allowedWorkerTypes:["BROWSER"],allowedOperations:["sha256"],minReliability:.8,maxTaskDurationMs:1000}).success).toBe(true);
  });
  it("bounds policy values and rejects unknown worker and task kinds",()=>{
    for(const invalid of [{maxCpuPercent:101},{minBatteryPercent:-1},{minReliability:1.01},{maxMemoryBytes:0},{maxTaskDurationMs:0},{allowedWorkerTypes:["FAKE"]},{allowedTaskKinds:["SHELL"]}])expect(contracts.networkPolicySchema?.safeParse(invalid).success).toBe(false);
    expect(contracts.contributionPolicySchema?.safeParse({enabled:false,wifiOnly:true,maxTaskDurationMs:1000}).success).toBe(true);
  });
  it("validates optional mobile telemetry without inventing absent readings",()=>{
    const basic={cpuUtilizationPercent:0,freeMemoryBytes:0,memoryUtilizationPercent:0,observedAt:"2026-10-13T10:00:00Z"};
    expect(contracts.resourceSchema.parse(basic)).not.toHaveProperty("batteryPercent");
    expect(contracts.resourceSchema.safeParse({...basic,batteryPercent:101}).success).toBe(false);
    expect(contracts.resourceSchema.parse({...basic,batteryPercent:70,isCharging:true,networkType:"WIFI",thermalState:"NORMAL",lifecycleState:"FOREGROUND"})).toHaveProperty("batteryPercent",70);
  });
});
