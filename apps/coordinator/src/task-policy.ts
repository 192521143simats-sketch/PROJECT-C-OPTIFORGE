import {createHash,timingSafeEqual} from 'node:crypto';
/** Stable per-attempt jitter survives restarts without an in-memory timer. */
export function retryDelayMs(taskId:string,attempt:number):number{
  const base=500*2**Math.min(6,Math.max(0,attempt-1));
  const fraction=createHash('sha256').update(`${taskId}:${attempt}`).digest().readUInt16BE(0)/65535;
  return Math.min(30000,Math.round(base*(1+fraction*.25)));
}
export function verifyArtifactIntegrity(content:Buffer,size:number,digest:unknown):boolean{
  if(content.length!==size||typeof digest!=='string'||! /^[a-f0-9]{64}$/.test(digest))return false;
  return timingSafeEqual(createHash('sha256').update(content).digest(),Buffer.from(digest,'hex'));
}
