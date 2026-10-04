import {mkdtemp,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawn} from "node:child_process";
import {describe,expect,it} from "vitest";
import {compileCExecutable,emitCFromIR} from "./codegen.js";
import {lowerCToIR} from "./lowering.js";
import {optimizeCIR} from "./optimize.js";

describe("C native code generation",()=>{
  it("emits readable C with explicit control flow",()=>{const source=emitCFromIR(lowerCToIR("int main(void){int x=1;if(x)return 2;else return 3;}"));expect(source).toContain("int main(void)");expect(source).toContain("goto main_then_");});
  it("builds a genuine native executable that returns the computed value",async()=>{const ir=optimizeCIR(lowerCToIR("int answer(int x){return x+0;} int main(void){return answer(42);}" )).ir,artifact=await compileCExecutable(ir,"answer"),workspace=await mkdtemp(join(tmpdir(),"c-optiforge-test-")),path=join(workspace,artifact.fileName);try{expect(artifact.bytes.byteLength).toBeGreaterThan(1_000);await writeFile(path,artifact.bytes);const code=await new Promise<number>((resolve,reject)=>{const child=spawn(path,[],{windowsHide:true});child.on("error",reject);child.on("close",value=>resolve(value??-1));});expect(code).toBe(42);}finally{await rm(workspace,{recursive:true,force:true});}},30_000);
});
