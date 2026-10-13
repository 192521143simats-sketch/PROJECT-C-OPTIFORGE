export type ExecutionEvidence={
  status:"SUCCEEDED"|"FAILED"|"TIMED_OUT"|"OUTPUT_LIMIT"|"UNAVAILABLE"|"NOT_RUN";
  stdout:string;stderr:string;exitCode:number|null;durationMs:number|null;
  peakMemoryBytes:number|null;target:string;artifactName:string|null;input:string;
  message:string;
};
