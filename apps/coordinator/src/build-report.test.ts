import {describe,it,expect} from "vitest";
import {buildReports} from "./build-report.js";

describe("program-specific build reports",()=>{
  it("retains real runtime warnings without misclassifying stderr as an error",async()=>{
    const artifacts=await buildReports({language:"python",sourceName:"invoice.py",source:"import warnings\nwarnings.warn('deprecated rate')",artifacts:[],execution:{status:"SUCCEEDED",stdout:"",stderr:"compiled_invoice.py:2: UserWarning: deprecated rate\n  warnings.warn('deprecated rate')",exitCode:0,durationMs:20,peakMemoryBytes:900000,target:"Linux container",artifactName:"compiled_invoice.py",input:"",message:"Program exited successfully."}});
    const report=JSON.parse(artifacts[0]!.bytes.toString());expect(report.programInformation.warnings).toBe(1);expect(report.programInformation.errors).toBe(0);expect(report.programInformation.warningDetails[0]).toContain("deprecated rate");expect(report.finalResult.status).toBe("SUCCESS");
  });
  it("counts runtime errors separately and never presents failed execution as an overall success",async()=>{
    const artifacts=await buildReports({language:"python",sourceName:"invoice.py",source:"print(1/0)",artifacts:[],diagnostics:[{severity:"warning",message:"Compiler warning",line:1}],execution:{status:"FAILED",stdout:"",stderr:'Traceback (most recent call last):\n  File "/work/compiled_invoice.py", line 1, in <module>\n    print(1/0)\nZeroDivisionError: division by zero',exitCode:1,durationMs:20,peakMemoryBytes:900000,target:"Linux container",artifactName:"compiled_invoice.py",input:"",message:"Program exited with code 1."}});
    const report=JSON.parse(artifacts[0]!.bytes.toString());
    expect(report.result.status).not.toBe("Compilation Successful");
    expect(report.programInformation).toMatchObject({compilation:"Successful",warnings:1,errors:1,compilationErrors:0,executionErrors:1});
    expect(report.errors[0]).toMatchObject({phase:"execution",line:1,message:"ZeroDivisionError: division by zero",sourceFile:"compiled_invoice.py"});
    expect(report.codeQualitySummary.errors).toBe(1);
    expect(report.codeQualitySummary.overallAssessment).toMatch(/execution failed/i);
    expect(report.recommendations.join(" ")).not.toContain("no errors or warnings");
  });
  it("does not blame user code for unavailable execution infrastructure",async()=>{
    const artifacts=await buildReports({language:"c",sourceName:"main.c",source:"int main(){return 0;}",artifacts:[],execution:{status:"UNAVAILABLE",stdout:"",stderr:"",exitCode:null,durationMs:null,peakMemoryBytes:null,target:"Linux container",artifactName:null,input:"",message:"Execution infrastructure unavailable."}});
    const report=JSON.parse(artifacts[0]!.bytes.toString());
    expect(report.result.status).toMatch(/unavailable/i);expect(report.programInformation.errors).toBe(0);expect(report.errors).toBeUndefined();expect(report.finalResult.status).toBe("PARTIAL_SUCCESS");
  });
  it("uses measured execution and the usable artifact rather than source bytes",async()=>{
    const artifacts=await buildReports({language:"python",sourceName:"invoice.py",source:"print(5)",artifacts:[{artifactType:"GENERATED_SOURCE",fileName:"compiled_invoice.py",mediaType:"text/x-python",bytes:Buffer.from("print(5)\n")}],execution:{status:"SUCCEEDED",stdout:"5\n",stderr:"",exitCode:0,durationMs:25,peakMemoryBytes:1000000,target:"Linux container",artifactName:"compiled_invoice.py",input:"",message:"Program exited successfully."}} as any);
    const report=JSON.parse(artifacts[0]!.bytes.toString());
    expect(report.programExecution.status).toBe("SUCCEEDED");expect(report.programExecution.output).toBe("5\n");expect(report.programExecution.executionTimeSeconds).toBe(0.025);expect(report.resourceUsage.memoryUsedBytes).toBe(1000000);
  });
  it("distinguishes runtime failure from successful compilation and suggests the actual issue",async()=>{
    const artifacts=await buildReports({language:"python",sourceName:"invoice.py",source:"print(1/0)",artifacts:[],execution:{status:"FAILED",stdout:"",stderr:"ZeroDivisionError: division by zero",exitCode:1,durationMs:20,peakMemoryBytes:900000,target:"Linux container",artifactName:"compiled_invoice.py",input:"",message:"Program exited with code 1."}} as any);
    const report=JSON.parse(artifacts[0]!.bytes.toString());expect(report.compilationSummary.compilationStatus).toBe("Successful");expect(report.finalResult.status).toBe("PARTIAL_SUCCESS");expect(report.recommendations.join(" ")).toMatch(/divisor|denominator/i);
  });
  it("does not mistake C generated source size for executable size",async()=>{
    const artifacts=await buildReports({language:"c",sourceName:"main.c",source:"int main(){return 0;}",artifacts:[{artifactType:"GENERATED_SOURCE",fileName:"compiled_main.c",mediaType:"text/x-c",bytes:Buffer.alloc(25)},{artifactType:"EXECUTABLE",fileName:"main.exe",mediaType:"application/octet-stream",bytes:Buffer.alloc(128)}]});expect(JSON.parse(artifacts[0]!.bytes.toString()).resourceUsage.outputSizeBytes).toBe(128);
  });
  it("reports genuine compiler errors rather than unconditional success",async()=>{
    const artifacts=await buildReports({language:"c",sourceName:"broken.c",source:"int main(void) { return missing; }",artifacts:[],status:"FAILED",diagnostics:[{severity:"error",message:"'missing' undeclared",line:1,column:25}]});
    const report=JSON.parse(artifacts[0]!.bytes.toString());
    expect(report.finalResult.status).toBe("FAILED");
    expect(report.programInformation.errors).toBe(1);
    expect(report.errors[0]).toMatchObject({line:1,message:"'missing' undeclared"});
    expect(report.result.outputAvailable).toEqual(["build-report.json","build-report.pdf"]);
    expect(report.resourceUsage.memoryUsedBytes).toBeNull();
    expect(artifacts[1]!.bytes.subarray(0,4).toString()).toBe("%PDF");
  });
  it("retains real locations, measured values and performed transformations",async()=>{
    const artifacts=await buildReports({language:"python",sourceName:"invoice.py",source:"total = 2 + 3\n",artifacts:[{artifactType:"GENERATED_SOURCE",fileName:"compiled_invoice.py",mediaType:"text/x-python",bytes:Buffer.from("total = 5\n")}],diagnostics:[{severity:"warning",message:"Unused variable total",line:1,column:1}],optimizations:[{description:"Folded constant addition",line:1}],processingTimeMs:1250});
    const report=JSON.parse(artifacts[0]!.bytes.toString());
    expect(report.programInformation.warnings).toBe(1);
    expect(report.programInformation.warningDetails[0]).toContain("Line 1");
    expect(report.optimizations[0].description).toBe("Folded constant addition");
    expect(report.output.optimizedSource).toBe("total = 5\n");
    expect(report.programExecution.status).toBe("Not performed");
    expect(report.resourceUsage.processingTimeSeconds).toBe(1.25);
    expect(report.errors).toBeUndefined();
  });
});
