import type {WorkPayload} from '@c-optiforge/contracts';
import {runOwnedProcess} from '@c-optiforge/orchestration';
export {TaskTerminationUnconfirmedError} from '@c-optiforge/orchestration';
export function runTaskProcess(payload:WorkPayload,options:{signal?:AbortSignal;onStarted?:()=>void}={}){
  return runOwnedProcess<unknown>(new URL(import.meta.url.endsWith('.ts')?'./task-process.ts':'./task-process.js',import.meta.url),payload,options);
}
