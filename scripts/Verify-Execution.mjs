import {spawn} from "node:child_process";
import {resolve} from "node:path";
import {mkdir,writeFile} from "node:fs/promises";
import {assertIsolatedTarget,verifyIsolatedCoordinator} from "./Integration-Target.mjs";

const target=assertIsolatedTarget(),base=target.base,root=process.cwd();await verifyIsolatedCoordinator(target);
const check=(value,message)=>{if(!value)throw new Error(message);},pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
class Client{cookie="";async request(path,{method="GET",body}={}){const response=await fetch(base+path,{method,headers:{origin:"http://localhost:5173",...(this.cookie?{cookie:this.cookie}:{}),...(body?{"content-type":"application/json"}:{})},body:body?JSON.stringify(body):undefined}),cookie=response.headers.get("set-cookie");if(cookie)this.cookie=cookie.split(";",1)[0];return{status:response.status,value:(response.headers.get("content-type")??"").includes("json")?await response.json():Buffer.from(await response.arrayBuffer())};}}
async function poll(work,predicate){const end=Date.now()+120000;do{const result=await work();if(predicate(result))return result;await pause(300);}while(Date.now()<end);throw new Error("Isolated execution integration timed out");}
const admin=new Client(),user=new Client(),peer=new Client(),anonymous=new Client(),other=new Client();
check((await admin.request("/api/auth/login",{method:"POST",body:{identifier:process.env.ADMIN_USERNAME,password:process.env.ADMIN_PASSWORD}})).status===200,"Admin login failed");
const network=(await admin.request("/api/admin/networks",{method:"POST",body:{name:"Execution verification",maxNodes:3}})).value;
const admission=await peer.request(`/api${new URL(network.joinUrl).pathname}/accept`,{method:"POST",body:{consent:true,workerType:"NATIVE",deviceIdentity:`execution-${crypto.randomUUID()}`}});check(admission.status===201,"Native enrollment failed");
const worker=spawn(process.execPath,[resolve(root,"node_modules/tsx/dist/cli.mjs"),resolve(root,"apps/worker/src/index.ts")],{cwd:root,windowsHide:true,env:{...process.env,COORDINATOR_URL:base,WORKER_CREDENTIAL:admission.value.workerCredential},stdio:"ignore"});
try{
  await poll(()=>admin.request("/api/admin/nodes?page=1&pageSize=10"),result=>result.value.items.some(node=>node.networkId===network.id&&node.status==="AVAILABLE"));
  for(const [client,name] of [[user,"execution"],[other,"other-execution"]]){const email=`${name}-${Date.now()}@example.test`,password="ExecutionOnly!42";check((await client.request("/api/auth/signup",{method:"POST",body:{name,email,password,confirmPassword:password}})).status===201,"Signup failed");check((await client.request("/api/auth/login",{method:"POST",body:{identifier:email,password}})).status===200,"Login failed");}
  for(const item of [
    {language:"c",sourceName:"invoice.c",source:'#include <stdio.h>\nint main(void){int value; if(scanf("%d",&value)!=1)return 2;printf("%d\\n",value+1);return 0;}',executionInput:"41\n",output:"42\n",execution:"SUCCEEDED"},
    {language:"c",sourceName:"invoice_ir.c",source:"int main(void){int amount=2+3;return amount-5;}",execution:"SUCCEEDED",optimized:true},
    {language:"python",sourceName:"invoice.py",source:"amount=2+3\nprint(int(input())+amount)\n",executionInput:"37\n",output:"42\n",execution:"SUCCEEDED"},
    {language:"java",sourceName:"Invoice.java",source:'public class Invoice { public static void main(String[] args){System.out.println(new java.util.Scanner(System.in).nextInt()+1);} }',executionInput:"41\n",output:"42\n",execution:"SUCCEEDED"},
    {language:"python",sourceName:"broken_runtime.py",source:"print(1/0)",execution:"FAILED",diagnostic:"ZeroDivisionError",suggestion:"divisor"},
    {language:"java",sourceName:"BrokenRuntime.java",source:'public class BrokenRuntime { public static void main(String[] args){throw new IllegalArgumentException("invalid invoice");} }',execution:"FAILED",diagnostic:"invalid invoice"},
    {language:"python",sourceName:"loop.py",source:"while True: pass",execution:"TIMED_OUT"},
    {language:"java",sourceName:"Ledger.java",source:"public interface Ledger { int cost(); }",execution:"NOT_RUN"}
  ]){
    const submitted=await user.request("/api/compilations",{method:"POST",body:item});check(submitted.status===202,`${item.sourceName}: submission failed`);
    if(item.execution==="TIMED_OUT"){await poll(()=>user.request(`/api/compilations/${submitted.value.id}`),result=>result.value.stage==="PROGRAM_EXECUTION");const before=(await admin.request("/api/admin/nodes?page=1&pageSize=10")).value.items.find(node=>node.networkId===network.id);await pause(6000);const after=(await admin.request("/api/admin/nodes?page=1&pageSize=10")).value.items.find(node=>node.id===before.id);check(Date.parse(after.lastHeartbeat)>Date.parse(before.lastHeartbeat),"Worker heartbeat was blocked by coordinator execution");}
    const job=(await poll(()=>user.request(`/api/compilations/${submitted.value.id}`),result=>["COMPLETED","FAILED"].includes(result.value.status))).value;check(job.status==="COMPLETED",`${item.sourceName}: actual compilation failed: ${job.error}`);
    const reportArtifact=job.artifacts.find(artifact=>artifact.artifactType==="BUILD_REPORT_JSON"),report=(await user.request(reportArtifact.downloadUrl)).value;
    check(report.programExecution.status===item.execution,`${item.sourceName}: execution was ${report.programExecution.status}, expected ${item.execution}: ${report.programExecution.message}`);
    check(report.compilationSummary.compilationStatus==="Successful","Runtime failure misreported as compilation error");
    if(item.output){check(report.programExecution.output===item.output,"Output mismatch");check(report.programExecution.exitCode===0&&report.programExecution.executionTimeSeconds>0&&report.resourceUsage.memoryUsedBytes>0,"Genuine execution measurements missing");}
    if(item.diagnostic)check(report.programExecution.stderr.includes(item.diagnostic),"Actual runtime diagnostics missing");
    if(item.suggestion)check(report.recommendations.join(" ").includes(item.suggestion),"Diagnostic-specific recommendation missing");
    if(item.optimized)check(report.optimizations.length>0&&report.output.optimizedSource!==item.source,"Distributed optimization evidence or final generated source missing");
    check(report.finalResult.status===(item.execution==="SUCCEEDED"||item.execution==="NOT_RUN"?"SUCCESS":"PARTIAL_SUCCESS"),"False final success claim");
    if(process.env.GRID_X_TEST_PDF_OUTPUT&&["invoice.c","broken_runtime.py"].includes(item.sourceName)){const directory=resolve(process.env.GRID_X_TEST_PDF_OUTPUT);check(directory.startsWith(resolve(root,".runtime")+"\\"),"PDF evidence must remain in ignored runtime storage");await mkdir(directory,{recursive:true});const pdf=await user.request(job.artifacts.find(artifact=>artifact.artifactType==="BUILD_REPORT_PDF").downloadUrl);check(pdf.status===200&&pdf.value.subarray(0,4).toString()==="%PDF","PDF download invalid");await writeFile(resolve(directory,item.sourceName+".pdf"),pdf.value);}
    if(item.language==="c"){const linux=job.artifacts.find(artifact=>artifact.fileName.endsWith("-linux")),bytes=(await user.request(linux.downloadUrl)).value;check(bytes.subarray(0,4).equals(Buffer.from([127,69,76,70])),"No genuine Linux output");check(report.programExecution.artifactName===linux.fileName,"Executed artifact identity mismatch");const original=job.artifacts.find(artifact=>artifact.artifactType==="EXECUTABLE"&&!artifact.fileName.endsWith("-linux"));check(original,"Original executable was discarded");}
    check((await anonymous.request(reportArtifact.downloadUrl)).status===401,"Anonymous report access succeeded");check((await other.request(reportArtifact.downloadUrl)).status===404,"Other owner report access succeeded");
    console.log(`${item.sourceName}: actual ${item.execution}, report/artifact ownership verified`);
  }
  for(const item of [{language:"c",sourceName:"invalid.c",source:"int main(void){return absent;}"},{language:"python",sourceName:"invalid.py",source:"def invalid(:"},{language:"java",sourceName:"Invalid.java",source:"public class Invalid { int x=absent; }"}]){
    const submitted=await user.request("/api/compilations",{method:"POST",body:item});check(submitted.status===202,"Invalid source not tracked");const job=(await poll(()=>user.request(`/api/compilations/${submitted.value.id}`),result=>result.value.status==="FAILED"&&result.value.artifacts.length===2)).value,report=(await user.request(job.artifacts.find(artifact=>artifact.artifactType==="BUILD_REPORT_JSON").downloadUrl)).value;check(report.errors.length>0&&report.errors.some(error=>error.line>0),"Located compiler errors missing");check(report.programExecution.status==="Not performed","Invalid source executed");check(report.recommendations.length>0&&job.artifacts.every(artifact=>artifact.artifactType.startsWith("BUILD_REPORT")),"Invalid source exposes usable artifacts");console.log(`${item.sourceName}: compiler errors and recommendations verified`);
  }
}finally{worker.kill();await pause(300);}
