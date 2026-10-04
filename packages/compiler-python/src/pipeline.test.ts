import {mkdtemp,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawn} from "node:child_process";
import {describe,expect,it} from "vitest";
import {compilePython,PythonFrontendError} from "./pipeline.js";

describe("Python compiler and optimization pipeline",()=>{
  it("uses CPython AST analysis and folds safe constant expressions",async()=>{const result=await compilePython("value = 20 + 22\nif False:\n    value = 0\nraise SystemExit(value)\n");expect(result.representation).toBe("CPython AST + bytecode");expect(result.optimizedSource).toContain("value = 42");expect(result.optimizedSource).not.toContain("if False");expect(result.metrics.nodesRemoved).toBeGreaterThan(0);});
  it("produces a genuine runnable CPython bytecode artifact",async()=>{const result=await compilePython("raise SystemExit(7)\n"),workspace=await mkdtemp(join(tmpdir(),"c-optiforge-python-")),path=join(workspace,result.artifactName);try{await writeFile(path,result.bytecode);const exitCode=await new Promise<number>((resolve,reject)=>{const child=spawn(process.env.PYTHON_EXECUTABLE??"python",[path],{windowsHide:true});child.on("error",reject);child.on("close",code=>resolve(code??-1));});expect(exitCode).toBe(7);expect(result.bytecode.subarray(0,4).equals(Buffer.from([0,0,0,0]))).toBe(false);}finally{await rm(workspace,{recursive:true,force:true});}},30_000);
  it("returns source-positioned syntax diagnostics",async()=>{await expect(compilePython("def broken(:\n pass\n")).rejects.toBeInstanceOf(PythonFrontendError);await expect(compilePython("def broken(:\n pass\n")).rejects.toThrow(/PY_SYNTAX.*at 1:/);});
});
