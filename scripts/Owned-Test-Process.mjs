import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {join} from 'node:path';
const exec=promisify(execFile);
/** Accept a retained ChildProcess object, never a caller-supplied PID. */
export async function terminateOwnedTestProcess(child){
 if(!child||child.exitCode!==null||child.signalCode!==null)return;
 if(!Number.isSafeInteger(child.pid)||child.pid===process.pid)throw new Error('Invalid owned fixture process');
 if(process.platform==='win32'){
  try{await exec(join(process.env.SystemRoot??'C:\\Windows','System32','taskkill.exe'),['/PID',String(child.pid),'/T','/F'],{windowsHide:true,timeout:10000});}
  catch(error){if(child.exitCode===null&&child.signalCode===null)throw error;}
 }else child.kill('SIGTERM');
 await Promise.race([new Promise(resolve=>{if(child.exitCode!==null||child.signalCode!==null)resolve();else child.once('exit',resolve);}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Owned fixture process did not exit')),5000).unref())]);
}
