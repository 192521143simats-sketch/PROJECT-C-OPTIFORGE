import {describe,it,expect} from 'vitest';
import {runTaskProcess} from './task-process-controller.js';
import {compileCSource} from '@c-optiforge/compiler-c';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

describe('owned native task process',()=>{
  it.skipIf(process.platform!=='win32')('fails closed if the Windows tree-termination command cannot run',async()=>{
    const original=process.env.SystemRoot,controller=new AbortController();
    try{await expect(runTaskProcess({operation:'sha256_chain',input:'unconfirmed',iterations:10_000_000},{signal:controller.signal,onStarted:()=>{process.env.SystemRoot=join(tmpdir(),'gridx-missing-windows-fixture');controller.abort();}})).rejects.toMatchObject({name:'TaskTerminationUnconfirmedError'});}finally{if(original===undefined)delete process.env.SystemRoot;else process.env.SystemRoot=original;}
  },15000);
  it('kills an actual compiler child and its descendant, not just the Node parent',async()=>{
    const directory=await mkdtemp(join(tmpdir(),'gridx-tree-fixture-')),parentFile=join(directory,'parent.pid'),childFile=join(directory,'child.pid'),controller=new AbortController();let parentPid=0,childPid=0;
    const source=`#include <stdio.h>\n#include <string.h>\n#ifdef _WIN32\n#include <windows.h>\n#else\n#include <unistd.h>\n#endif\nint main(int argc,char **argv){int isChild=argc>1&&strcmp(argv[1],"child")==0;\n#ifdef _WIN32\n if(!isChild){char file[4096],command[4200];GetModuleFileNameA(NULL,file,sizeof(file));snprintf(command,sizeof(command),"\\\"%s\\\" child",file);STARTUPINFOA startup={0};PROCESS_INFORMATION process={0};startup.cb=sizeof(startup);if(!CreateProcessA(NULL,command,NULL,NULL,FALSE,CREATE_NO_WINDOW,NULL,NULL,&startup,&process))return 2;CloseHandle(process.hThread);CloseHandle(process.hProcess);}\n int id=(int)GetCurrentProcessId();\n#else\n if(!isChild){if(fork()==0)isChild=1;}int id=(int)getpid();\n#endif\n FILE *f=fopen(!isChild?${JSON.stringify(parentFile)}:${JSON.stringify(childFile)},"w");if(!f)return 3;fprintf(f,"%d",id);fclose(f);while(1){\n#ifdef _WIN32\n Sleep(1000);\n#else\n sleep(1);\n#endif\n }return 0;}\n`;
    const oldCompiler=process.env.GCC_EXECUTABLE,oldPath=process.env.PATH;
    let work:Promise<unknown>|undefined;
    try{
      const compiler=await compileCSource(source,'tree-fixture.c'),executable=join(directory,compiler.fileName);await writeFile(executable,compiler.bytes,{mode:0o700});process.env.GCC_EXECUTABLE=executable;if(process.platform==='win32')process.env.PATH=directory;
      work=runTaskProcess({operation:'c_compile',source:'int main(void){return 0;}',sourceName:'unused.c'},{signal:controller.signal});const observed=work.catch(error=>error);
      const end=Date.now()+10000;while(Date.now()<end){try{parentPid=Number(await readFile(parentFile,'utf8'));childPid=Number(await readFile(childFile,'utf8'));if(parentPid&&childPid)break;}catch{}await new Promise(resolve=>setTimeout(resolve,50));}
      expect(parentPid).toBeGreaterThan(0);expect(childPid).toBeGreaterThan(0);controller.abort();expect(await observed).toMatchObject({name:'AbortError'});
      expect(()=>process.kill(parentPid,0)).toThrow();expect(()=>process.kill(childPid,0)).toThrow();
    }finally{
      controller.abort();await work?.catch(()=>{});for(const pid of [parentPid,childPid])if(pid)try{process.kill(pid,'SIGKILL');}catch{}
      if(oldCompiler===undefined)delete process.env.GCC_EXECUTABLE;else process.env.GCC_EXECUTABLE=oldCompiler;if(oldPath===undefined)delete process.env.PATH;else process.env.PATH=oldPath;await rm(directory,{recursive:true,force:true});
    }
  },30000);
  it('returns genuine executor output and measured time',async()=>{
    const result=await runTaskProcess({operation:'prime_count',limit:10});
    expect(result.result).toEqual({operation:'prime_count',limit:10,count:4});expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  },15000);
  it('terminates expensive computation before advertising completion',async()=>{
    const controller=new AbortController();let started=false;
    const work=runTaskProcess({operation:'sha256_chain',input:'cancel',iterations:10_000_000},{signal:controller.signal,onStarted:()=>{started=true;controller.abort();}});
    await expect(work).rejects.toMatchObject({name:'AbortError'});expect(started).toBe(true);
  },15000);
});
