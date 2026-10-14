import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {terminateOwnedTestProcess} from './Owned-Test-Process.mjs';
test('terminates only an actually spawned fixture and permits repeated cleanup',async()=>{
 const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{windowsHide:true,stdio:'ignore'});
 await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});
 await terminateOwnedTestProcess(child);assert.ok(child.exitCode!==null||child.signalCode!==null);
 await terminateOwnedTestProcess(child);
});
test('Windows cleanup terminates the retained fixture tree, not just its root',{skip:process.platform!=='win32'},async()=>{
 const child=spawn(process.execPath,['-e',`const {spawn}=require('node:child_process');const leaf=spawn(process.execPath,['-e','setTimeout(()=>{},5000)'],{stdio:'ignore',windowsHide:true});console.log(leaf.pid);setInterval(()=>{},1000);`],{windowsHide:true,stdio:['ignore','pipe','ignore']});
 try{
  const pid=await new Promise((resolve,reject)=>{child.stdout.once('data',chunk=>resolve(Number(String(chunk).trim())));child.once('error',reject);});
  assert.ok(Number.isSafeInteger(pid));await terminateOwnedTestProcess(child);
  let alive=true;for(let i=0;i<20;i++){try{process.kill(pid,0);}catch{alive=false;break;}await new Promise(resolve=>setTimeout(resolve,50));}
  assert.equal(alive,false,'Owned descendant must not survive fixture cleanup');
 }finally{await terminateOwnedTestProcess(child);}
});
