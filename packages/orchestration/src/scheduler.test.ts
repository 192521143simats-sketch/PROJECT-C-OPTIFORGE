import {describe,expect,it} from "vitest";
import {evaluateNode,selectNode,type SchedulableNode} from "./scheduler.js";

const node=(id:string,cpu:number,memory:number,runtimes={c:true,python:true,java:true},status="AVAILABLE"):SchedulableNode=>({id,status,profile:{cpuModel:"test",logicalCores:8,totalMemoryBytes:16_000,operatingSystem:"test",architecture:"x64",runtimes,toolchains:{c:{available:runtimes.c},python:{available:runtimes.python},java:{available:runtimes.java}}},resources:{cpuUtilizationPercent:cpu,freeMemoryBytes:8_000,memoryUtilizationPercent:memory,observedAt:new Date().toISOString()}});

describe("resource-aware scheduler",()=>{
  it("rejects nodes missing the required language capability",()=>{const result=evaluateNode(node("no-java",10,10,{c:true,python:true,java:false}),{capability:"java"});expect(result.eligible).toBe(false);expect(result.reasons).toContain("java capability is unavailable");});
  it("rejects stale profiles and insufficient resources",()=>{const candidate=node("weak",10,10);candidate.resources=null;candidate.profile.logicalCores=2;const result=evaluateNode(candidate,{capability:"c",minLogicalCores:4});expect(result.reasons).toEqual(expect.arrayContaining(["requires at least 4 logical cores","no current resource snapshot"]));});
  it("selects the eligible node with greatest current headroom",()=>{const decision=selectNode([node("busy",90,80),node("free",10,20),node("offline",0,0,undefined,"OFFLINE")],{capability:"python"});expect(decision.selectedNodeId).toBe("free");expect(decision.explanation).toMatch(/CPU headroom 90.0%/);});
  it("returns an explicit no-eligible-node decision",()=>{const decision=selectNode([node("c-only",10,10,{c:true,python:false,java:false})],{capability:"java"});expect(decision.selectedNodeId).toBeNull();expect(decision.explanation).toMatch(/No eligible node/);});
});
