import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { CapabilityProfile, ResourceSnapshot } from "@c-optiforge/contracts";

const execFileAsync=promisify(execFile);
let previous=os.cpus().map(cpu=>({...cpu.times}));

export type CpuTimes={user:number;nice:number;sys:number;idle:number;irq:number};
export type ToolchainProbe=(command:string,args:string[])=>Promise<{available:boolean;version?:string}>;

export async function probeToolchain(command:string,args:string[]){
  try{
    const {stdout,stderr}=await execFileAsync(command,args,{timeout:3_000,windowsHide:true});
    const version=`${stdout}\n${stderr}`.trim().split(/\r?\n/,1)[0]?.trim();
    return version?{available:true,version}:{available:true};
  }catch{return {available:false};}
}

export async function profile(probe:ToolchainProbe=probeToolchain):Promise<CapabilityProfile>{
  const cpus=os.cpus();
  const [c,python,java]=await Promise.all([probe("gcc",["--version"]),probe("python",["--version"]),probe("javac",["-version"])]);
  return {cpuModel:cpus[0]?.model??"Unknown CPU",logicalCores:Math.max(cpus.length,1),totalMemoryBytes:os.totalmem(),operatingSystem:`${os.type()} ${os.release()}`,architecture:os.arch(),runtimes:{c:c.available,python:python.available,java:java.available},toolchains:{c,python,java}};
}

export function calculateCpuUtilization(before:CpuTimes[],after:CpuTimes[]){
  let idle=0,total=0;
  after.forEach((current,index)=>{const prior=before[index]??current;for(const key of Object.keys(current) as Array<keyof CpuTimes>)total+=Math.max(0,current[key]-prior[key]);idle+=Math.max(0,current.idle-prior.idle);});
  return total>0?Math.max(0,Math.min(100,(1-idle/total)*100)):0;
}

export function calculateMemoryUtilization(total:number,free:number){return total>0?Math.max(0,Math.min(100,((total-free)/total)*100)):0;}

export function resources():ResourceSnapshot{
  const current=os.cpus();
  const cpuUtilizationPercent=calculateCpuUtilization(previous,current.map(cpu=>cpu.times));
  previous=current.map(cpu=>({...cpu.times}));const free=os.freemem(),all=os.totalmem();
  return {cpuUtilizationPercent,freeMemoryBytes:free,memoryUtilizationPercent:calculateMemoryUtilization(all,free),observedAt:new Date().toISOString()};
}
