export type ReliabilityAttempt={status:string;failureReason?:string|null;executionTimeMs?:number|null};
export type WorkerReliability={
  assigned:number;completed:number;failed:number;timeouts:number;disconnects:number;invalidResults:number;excluded:number;
  sampleCount:number;successRate:number|null;score:number|null;averageExecutionTimeMs:number|null;
};

/** Observed, attributable terminal attempts only. No synthetic cold-start prior. */
export function deriveReliability(attempts:readonly ReliabilityAttempt[]):WorkerReliability{
  let completed=0,failed=0,timeouts=0,disconnects=0,invalidResults=0,excluded=0,latencyTotal=0,latencySamples=0;
  for(const attempt of attempts){
    if(["USER_PAUSED","USER_LEFT","SERVER_FAILURE"].includes(attempt.failureReason??"")||attempt.status==="CANCELLED"){excluded++;continue;}
    if(attempt.status==="COMPLETED"){
      completed++;
      if(attempt.executionTimeMs!==undefined&&attempt.executionTimeMs!==null&&Number.isFinite(attempt.executionTimeMs)&&attempt.executionTimeMs>=0){latencyTotal+=attempt.executionTimeMs;latencySamples++;}
    }else if(["FAILED","INTERRUPTED","TIMED_OUT"].includes(attempt.status)){
      failed++;
      if(attempt.failureReason==="TIMEOUT"||attempt.status==="TIMED_OUT")timeouts++;
      if(attempt.failureReason==="NETWORK_FAILURE"||attempt.failureReason==="WORKER_CRASH")disconnects++;
      if(attempt.failureReason==="INVALID_RESULT")invalidResults++;
    }
  }
  const sampleCount=completed+failed,successRate=sampleCount?completed/sampleCount:null;
  return{assigned:attempts.length,completed,failed,timeouts,disconnects,invalidResults,excluded,sampleCount,successRate,score:successRate===null?null:Number((successRate*100).toFixed(3)),averageExecutionTimeMs:latencySamples?latencyTotal/latencySamples:null};
}
