import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'node:net';
import {resolve} from 'node:path';
import mysql from 'mysql2/promise';
import {assertIsolatedTarget,verifyIsolatedCoordinator} from './Integration-Target.mjs';

const mode=process.argv[2]??'all';
if(!['all','platform','artifacts','enrollment','reusable','execution','results'].includes(mode)) throw new Error('Use all, platform, artifacts, enrollment, reusable, execution or results.');
const root=process.cwd(),instance=randomBytes(8).toString('hex'),container=`gridx-test-${instance}`,database=`gridx_test_${instance}`;
const password=randomBytes(32).toString('base64url'),rootPassword=randomBytes(32).toString('base64url');
const startedAt=new Date().toISOString(),evidence=resolve(root,'.runtime','integration',instance);
await mkdir(evidence,{recursive:true});
let created=false,coordinator,coordinatorLog='',exitCode=1;
const results=[];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function command(executable,args,{env=process.env,timeout=30_000}={}) {
  return new Promise((resolve,reject)=>{
    const child=spawn(executable,args,{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
    let output='',settled=false;
    const finish=(error,code)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve({code,output});};
    const timer=setTimeout(()=>{child.kill();finish(new Error(`${executable} timed out after ${timeout} ms`));},timeout);
    child.stdout.on('data',chunk=>{output+=chunk.toString();if(output.length>2_000_000){child.kill();finish(new Error('Integration command output limit exceeded'));}});
    child.stderr.on('data',chunk=>{output+=chunk.toString();});
    child.on('error',error=>finish(error));child.on('close',code=>finish(undefined,code??-1));
  });
}
async function checked(executable,args,options){const value=await command(executable,args,options);if(value.code!==0) throw new Error(`${executable} failed (exit ${value.code}); see isolated evidence logs`);return value.output.trim();}
async function availablePort(){const server=createServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});const port=server.address().port;await new Promise(resolve=>server.close(resolve));return port;}
async function waitFor(work,label,timeout=120_000){const end=Date.now()+timeout;do{try{return await work();}catch{await pause(1000);}}while(Date.now()<end);throw new Error(`Timed out waiting for ${label}`);}
try {
  console.log('Checking Docker engine (bounded; does not modify the developer database)...');
  await checked('docker',['info','--format','{{.ServerVersion}}'],{timeout:30_000});
  console.log(`Creating isolated MySQL fixture ${container} (temporary storage, no developer volume)...`);
  await checked('docker',['create','--name',container,'--label',`gridx.test.instance=${instance}`,'--memory','768m','--publish','127.0.0.1::3306','--tmpfs','/var/lib/mysql:rw','--env','MYSQL_ROOT_PASSWORD','--env','MYSQL_DATABASE','--env','MYSQL_USER','--env','MYSQL_PASSWORD','mysql:8.4'],{timeout:180_000,env:{...process.env,MYSQL_ROOT_PASSWORD:rootPassword,MYSQL_DATABASE:database,MYSQL_USER:'gridx_test',MYSQL_PASSWORD:password}});
  created=true;
  await checked('docker',['start',container]);
  const published=await checked('docker',['port',container,'3306/tcp']);
  const dbPort=Number(published.match(/127\.0\.0\.1:(\d+)/)?.[1]);
  if(!dbPort) throw new Error('Isolated MySQL port was not published on loopback.');
  await waitFor(async()=>{const connection=await mysql.createConnection({host:'127.0.0.1',port:dbPort,database,user:'gridx_test',password,connectTimeout:2000});try{await connection.query('SELECT 1');}finally{await connection.end();}},'isolated MySQL readiness');
  const port=await availablePort(),base=`http://127.0.0.1:${port}`;
  const env={...process.env,GRID_X_EXECUTION_MODE:process.env.GRID_X_EXECUTION_MODE??(mode==='execution'?'docker':'disabled'),NODE_ENV:'development',HOST:'127.0.0.1',PORT:String(port),PUBLIC_BASE_URL:'http://localhost:5173',COORDINATOR_PUBLIC_URL:base,ALLOWED_ORIGINS:'',TRUSTED_PROXIES:'',DB_HOST:'127.0.0.1',DB_PORT:String(dbPort),DB_NAME:database,DB_USER:'gridx_test',DB_PASSWORD:password,ADMIN_USERNAME:'integration-admin',ADMIN_PASSWORD:'IntegrationOnly!42',ADMIN_PASSWORD_HASH:'',GRID_X_TEST_BASE:base,GRID_X_TEST_INSTANCE:instance};
  coordinator=spawn(process.execPath,[resolve(root,'node_modules/tsx/dist/cli.mjs'),resolve(root,'apps/coordinator/src/server.ts')],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
  coordinator.stdout.on('data',chunk=>{coordinatorLog+=chunk.toString();});coordinator.stderr.on('data',chunk=>{coordinatorLog+=chunk.toString();});
  coordinator.on('error',error=>{coordinatorLog+=`Coordinator spawn failed: ${error.message}`;});
  await waitFor(()=>verifyIsolatedCoordinator(assertIsolatedTarget(env)),'isolated coordinator readiness',60_000);
  const scripts=mode==='results'?['Verify-Migrations.mjs','Verify-Task-Results.mjs']:mode==='execution'?['Verify-Migrations.mjs','Verify-Execution.mjs']:mode==='reusable'?['Verify-Reusable-Link.mjs']:mode==='enrollment'?['Verify-Migrations.mjs','Verify-Enrollment.mjs']:['Verify-Migrations.mjs','Verify-MySQL-Concurrency.mjs','Verify-Protocol.mjs',...(mode==='all'?['Verify-Task-Results.mjs','Verify-Platform.mjs','Verify-Artifacts.mjs']:[mode==='platform'?'Verify-Platform.mjs':'Verify-Artifacts.mjs'])];
  for(const script of scripts){
    console.log(`Running ${script} against isolated test MySQL and coordinator...`);
    const result=await command(process.execPath,[resolve(root,'node_modules/tsx/dist/cli.mjs'),resolve(root,'scripts',script)],{env,timeout:300_000});
    await writeFile(resolve(evidence,`${script}.log`),result.output);
    results.push({script,exitCode:result.code});
    if(result.code!==0) throw new Error(`${script} failed; inspect ${evidence}`);
    console.log(`${script}: passed`);
  }
  exitCode=0;
}catch(error){console.error(error.message);results.push({error:error.message});}
finally {
  if(coordinator && coordinator.exitCode===null){coordinator.kill();await Promise.race([new Promise(resolve=>coordinator.once('exit',resolve)),pause(5000)]);}
  // Only this runner's freshly created, labelled temporary fixture is removable.
  if(created){try{const label=await checked('docker',['inspect','--format','{{ index .Config.Labels "gridx.test.instance" }}',container]);if(label!==instance) throw new Error('Test container ownership changed; refusing cleanup');await checked('docker',['rm','--force',container]);}catch(error){console.error(`Isolated cleanup failed: ${error.message}`);exitCode=1;results.push({cleanupError:error.message});}}
  for(const secret of [password,rootPassword])coordinatorLog=coordinatorLog.replaceAll(secret,'[REDACTED]');
  await writeFile(resolve(evidence,'coordinator.log'),coordinatorLog);
  await writeFile(resolve(evidence,'summary.json'),JSON.stringify({instance,startedAt,finishedAt:new Date().toISOString(),mode,exitCode,results},null,2)+'\n');
  console.log(`Evidence: ${evidence}`);
  process.exitCode=exitCode;
}
