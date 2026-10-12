import {describe,it,expect} from 'vitest';
import {capabilitySchema} from './index.js';
describe('native Android identity protocol',()=>{
  it('accepts Android as a distinct portable worker without claiming native toolchains',()=>{
    const result=capabilitySchema.safeParse({workerType:'ANDROID',deviceType:'PHONE',cpuModel:'ARM64',logicalCores:4,totalMemoryBytes:1024,operatingSystem:'Android',architecture:'arm64',runtimes:{c:false,python:false,java:false},toolchains:{c:{available:false},python:{available:false},java:{available:false}},operations:{irOptimization:true,staticAnalysis:true,browserCompute:false,nativeCompilation:false}});
    expect(result.success).toBe(true);
  });
});
