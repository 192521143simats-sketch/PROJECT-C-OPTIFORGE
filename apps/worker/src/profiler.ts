import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { CapabilityProfile, ResourceSnapshot } from "@c-optiforge/contracts";

const execFileAsync=promisify(execFile);
let previous=os.cpus().map(cpu=>({...cpu.times}));

async function available(command:string,args:string[]){
  try{await execFileAsync(command,args,{timeout:3_000,windowsHide:true});return true;}catch{return false;}
}

export async function profile():Promise<CapabilityProfile>{
  const cpus=os.cpus();
  const [c,python,java]=await Promise.all([available("gcc",["--version"]),available("python",["--version"]),available("javac",["-version"])]);
  return {cpuModel:cpus[0]?.model??"Unknown CPU",logicalCores:Math.max(cpus.length,1),totalMemoryBytes:os.totalmem(),operatingSystem:`${os.type()} ${os.release()}`,architecture:os.arch(),runtimes:{c,python,java}};
}

export function resources():ResourceSnapshot{
  const current=os.cpus();let idle=0,total=0;
  current.forEach((cpu,index)=>{const before=previous[index]??cpu.times;const keys=Object.keys(cpu.times) as Array<keyof typeof cpu.times>;for(const key of keys)total+=cpu.times[key]-before[key];idle+=cpu.times.idle-before.idle;});
  previous=current.map(cpu=>({...cpu.times}));const free=os.freemem(),all=os.totalmem();
  return {cpuUtilizationPercent:total>0?Math.max(0,Math.min(100,(1-idle/total)*100)):0,freeMemoryBytes:free,memoryUtilizationPercent:all?((all-free)/all)*100:0,observedAt:new Date().toISOString()};
}
