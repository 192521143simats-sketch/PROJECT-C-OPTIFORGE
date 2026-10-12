import {describe,it,expect} from "vitest";
import {buildReports} from "./build-report.js";

describe("program-specific build reports",()=>{
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
