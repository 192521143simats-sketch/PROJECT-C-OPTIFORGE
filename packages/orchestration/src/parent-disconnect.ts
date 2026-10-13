import {execFile} from 'node:child_process';
import {join} from 'node:path';
import {promisify} from 'node:util';
const execute=promisify(execFile);
/** Owned fork is a process-group leader. Parent loss must stop native descendants. */
export function installParentDisconnectGuard(){
  const disconnected=()=>{void (async()=>{
    if(process.platform==='win32'){
      const systemRoot=process.env.SystemRoot??process.env.SYSTEMROOT;
      if(!systemRoot){process.exit(1);return;}
      // Do not taskkill our own tree: that also kills taskkill before it can
      // finish descendants. Enumerate direct owned children, exclude the
      // enumerator itself, terminate their trees, then exit this Node process.
      try{
        const script=`Get-CimInstance Win32_Process -Filter "ParentProcessId=${process.pid}" | Where-Object { $_.ProcessId -ne $PID } | Select-Object -ExpandProperty ProcessId`;
        const listed=await execute(join(systemRoot,'System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,timeout:10000});
        const children=listed.stdout.trim().split(/\s+/).filter(Boolean).map(Number);
        if(children.some(pid=>!Number.isSafeInteger(pid)||pid<1))throw new Error('Invalid owned child identity');
        for(const pid of children)await execute(join(systemRoot,'System32','taskkill.exe'),['/PID',String(pid),'/T','/F'],{windowsHide:true,timeout:5000});
      }catch{process.stderr.write('Native parent-loss cleanup could not be confirmed.\n');}
      process.exit(1);
    }else{
      try{process.kill(-process.pid,'SIGKILL');}catch{process.exit(1);}
    }
  })();};
  process.once('disconnect',disconnected);
  return ()=>process.removeListener('disconnect',disconnected);
}
