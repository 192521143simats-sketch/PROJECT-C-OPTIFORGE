import PDFDocument from "pdfkit";
import type {StoredArtifact} from "./database.js";

type Language="c"|"python"|"java";
type ReportInput={language:Language;sourceName:string;source:string;artifacts:StoredArtifact[];warnings?:string[];processingTimeMs?:number|undefined;memoryBytes?:number|undefined};
type BuildReport={title:string;compilationSummary:{sourceFile:string;language:string;compilationStatus:string;dateTime:string;sourceSizeBytes:number;sourceLines:number};result:{status:string;message:string;outputAvailable:string[]};programInformation:{language:string;sourceFile:string;sourceLines:number;compilation:string;warnings:number;errors:number;warningDetails:string[]};output:{generatedFiles:string[];filePurposes:Array<{file:string;purpose:string}>;howToUse:string};programExecution:{message:string};resourceUsage:{processingTimeSeconds:number|null;memoryUsedBytes:number|null;outputSizeBytes:number|null};codeQualitySummary:{syntax:string;compilationProcessing:string;errors:number;warnings:number;outputGeneration:string;overallAssessment:string};recommendations:string[];finalResult:{status:string;message:string;availableArtifacts:string[]}};

export async function buildReports(input:ReportInput):Promise<StoredArtifact[]>{
  const names=input.artifacts.map(artifact=>artifact.fileName);
  const output=input.artifacts.find(artifact=>["EXECUTABLE","JAR","GENERATED_SOURCE"].includes(artifact.artifactType));
  const sourceLines=input.source.replace(/\r?\n$/,"").split(/\r?\n/).length;
  const purposes:Record<StoredArtifact["artifactType"],string>={SOURCE:"Original source code",GENERATED_SOURCE:"Final generated or optimized source code",EXECUTABLE:"Runnable compiled program",BYTECODE:input.language==="java"?"Compiled Java class":"Compiled Python bytecode",JAR:"Java archive",BUILD_REPORT_JSON:"Machine-readable build report",BUILD_REPORT_PDF:"This build report"};
  const report={
    title:"GRID-X - Build Report",
    compilationSummary:{sourceFile:input.sourceName,language:input.language.toUpperCase(),compilationStatus:"Successful",dateTime:new Date().toLocaleString("en-GB",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true}),sourceSizeBytes:Buffer.byteLength(input.source),sourceLines},
    result:{status:"Compilation Successful",message:"Your program was successfully processed and the requested output is ready.",outputAvailable:[...names,"build-report.json","build-report.pdf"]},
    programInformation:{language:input.language.toUpperCase(),sourceFile:input.sourceName,sourceLines,compilation:"Successful",warnings:input.warnings?.length??0,errors:0,warningDetails:input.warnings??[]},
    output:{generatedFiles:[...names,"build-report.json","build-report.pdf"],filePurposes:[...input.artifacts.map(artifact=>({file:artifact.fileName,purpose:purposes[artifact.artifactType]})),{file:"build-report.json",purpose:purposes.BUILD_REPORT_JSON},{file:"build-report.pdf",purpose:purposes.BUILD_REPORT_PDF}],howToUse:input.language==="c"?"Run the generated program on a compatible system.":input.language==="python"?"Run the generated .py file using Python.":"Run the generated .jar file using Java when the source defines a main entry point."},
    programExecution:{status:"Not performed",message:"Execution was not performed. The generated artifact is available for download.",output:null,executionTimeSeconds:null},
    resourceUsage:{processingTimeSeconds:input.processingTimeMs===undefined?null:Number((input.processingTimeMs/1000).toFixed(3)),memoryUsedBytes:input.memoryBytes??null,outputSizeBytes:output?.bytes.byteLength??null},
    codeQualitySummary:{syntax:"Passed",compilationProcessing:"Passed",errors:0,warnings:input.warnings?.length??0,outputGeneration:"Passed",overallAssessment:"The program was successfully processed and the generated output is ready to use."},
    recommendations:input.warnings?.length?["Review the warnings listed in Program Information."]:["Your program compiled successfully and requires no corrections."],
    finalResult:{status:"SUCCESS",message:`Your ${input.language.toUpperCase()} program was successfully processed.`,availableArtifacts:[...names,"build-report.json","build-report.pdf"]},
    reportGeneratedBy:"GRID-X"
  };
  const json:StoredArtifact={artifactType:"BUILD_REPORT_JSON",fileName:"build-report.json",mediaType:"application/json",bytes:Buffer.from(JSON.stringify(report,null,2),"utf8")};
  const pdf=await renderPdf(report);
  return[json,{artifactType:"BUILD_REPORT_PDF",fileName:"build-report.pdf",mediaType:"application/pdf",bytes:pdf}];
}

function renderPdf(report:BuildReport):Promise<Buffer>{
  return new Promise((resolve,reject)=>{
    const document=new PDFDocument({size:"A4",margin:42,info:{Title:report.title,Author:"GRID-X"}}),chunks:Buffer[]=[];
    document.on("data",chunk=>chunks.push(Buffer.from(chunk)));document.on("error",reject);document.on("end",()=>resolve(Buffer.concat(chunks)));
    const heading=(number:number,title:string)=>{document.moveDown(0.45).font("Helvetica-Bold").fontSize(12).text(`${number}. ${title}`).moveDown(0.2);document.font("Helvetica").fontSize(9);};
    const line=(label:string,value:unknown)=>document.text(`${label}: ${value===null||value===undefined?"Not available":String(value)}`);
    const files=(items:string[])=>items.forEach(name=>document.text(`- ${name}`));
    document.font("Helvetica-Bold").fontSize(18).text(report.title).font("Helvetica").fontSize(9);
    heading(1,"Compilation Summary");line("Source File",report.compilationSummary.sourceFile);line("Language",report.compilationSummary.language);line("Compilation Status",report.compilationSummary.compilationStatus);line("Date & Time",report.compilationSummary.dateTime);line("Source Size",`${(report.compilationSummary.sourceSizeBytes/1024).toFixed(1)} KB`);line("Source Lines",report.compilationSummary.sourceLines);
    heading(2,"Result");document.font("Helvetica-Bold").text(report.result.status).font("Helvetica").text(report.result.message);document.text("Output Available:");files(report.result.outputAvailable);
    heading(3,"Program Information");line("Language",report.programInformation.language);line("Source File",report.programInformation.sourceFile);line("Source Lines",report.programInformation.sourceLines);line("Compilation",report.programInformation.compilation);line("Warnings",report.programInformation.warnings);line("Errors",report.programInformation.errors);report.programInformation.warningDetails.length?report.programInformation.warningDetails.forEach(warning=>document.text(warning)):document.text("No warnings detected.");
    heading(4,"Output / Artifact");document.text("Generated Files:");report.output.filePurposes.forEach(item=>document.text(`- ${item.file}: ${item.purpose}`));document.text(`How to Use: ${report.output.howToUse}`);
    heading(5,"Program Execution");document.text(report.programExecution.message);
    heading(6,"Resource Usage");line("Processing Time",report.resourceUsage.processingTimeSeconds===null?null:`${report.resourceUsage.processingTimeSeconds} seconds`);line("Memory Used",report.resourceUsage.memoryUsedBytes===null?null:`${(report.resourceUsage.memoryUsedBytes/1024/1024).toFixed(1)} MB`);line("Output Size",report.resourceUsage.outputSizeBytes===null?null:`${(report.resourceUsage.outputSizeBytes/1024).toFixed(1)} KB`);
    heading(7,"Code Quality Summary");line("Syntax",report.codeQualitySummary.syntax);line("Compilation / Processing",report.codeQualitySummary.compilationProcessing);line("Errors",report.codeQualitySummary.errors);line("Warnings",report.codeQualitySummary.warnings);line("Output Generation",report.codeQualitySummary.outputGeneration);document.text(report.codeQualitySummary.overallAssessment);
    heading(9,"Recommendations");files(report.recommendations);
    heading(10,"Final Result");document.font("Helvetica-Bold").text(report.finalResult.status).font("Helvetica").text(report.finalResult.message).text("Available artifacts:");files(report.finalResult.availableArtifacts);document.moveDown().text("Report Generated By GRID-X");
    document.end();
  });
}
