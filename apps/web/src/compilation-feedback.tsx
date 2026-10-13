import React from "react";

export function needsCompilationUpdate(job:any):boolean {
  return Boolean(job&&(!["COMPLETED","FAILED"].includes(job.status)||!job.artifacts?.some((item:any)=>item.artifactType==="BUILD_REPORT_JSON")));
}

/** Show the same persisted diagnostics as the downloadable report. */
export function CompilationFeedback({job,report,error}:{job:any;report:any;error:string}) {
  const execution=job?.metrics?.execution??report?.programExecution;
  return <section aria-live="polite" aria-label="Compilation and execution results">
    {error&&<div role="alert" className="error"><h3>Submission rejected</h3><p>{error}</p><p>Correct the source or selected language before submitting again. No execution was started for this submission.</p></div>}
    {job?.status==="FAILED"&&<div role="alert" className="error"><h3>Compilation failed — execution not performed</h3><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{job.error}</pre></div>}
    {report&&<><h3>Diagnostic summary</h3><p>Compilation errors: {report.programInformation.compilationErrors??report.programInformation.errors} · Execution failures: {report.programInformation.executionErrors??0} · Warnings: {report.programInformation.warnings}</p>
      {report.errors?.map((item:any,index:number)=><p key={index}><strong>{item.phase==="execution"?"Execution":"Compilation"}</strong>{item.sourceFile?` (${item.sourceFile})`:""}{item.line?` — line ${item.line}`:""}: {item.message}</p>)}
      {report.programInformation.warningDetails?.map((warning:string,index:number)=><p key={index}>Warning: {warning}</p>)}
    </>}
    {execution&&<><h3>Program execution: {execution.status}</h3><p>{execution.message}</p><dl><dt>Environment</dt><dd>{execution.target??"Not run"}</dd><dt>Executed artifact</dt><dd>{execution.artifactName??"Not run"}</dd><dt>Exit code</dt><dd>{execution.exitCode??"Not available"}</dd><dt>Execution time</dt><dd>{execution.durationMs==null?"Not available":`${(execution.durationMs/1000).toFixed(3)} seconds`}</dd></dl>{execution.stdout&&<><h4>Standard output</h4><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",maxHeight:240,overflow:"auto"}}>{execution.stdout}</pre></>}{execution.stderr&&<><h4>Runtime diagnostics</h4><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",maxHeight:240,overflow:"auto"}}>{execution.stderr}</pre></>}</>}
  </section>;
}
