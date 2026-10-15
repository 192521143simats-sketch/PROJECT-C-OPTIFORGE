import {createHash,randomUUID} from 'node:crypto';
import {readFile,mkdir,writeFile,rename,unlink} from 'node:fs/promises';
import {join} from 'node:path';

export function assertRuntimeIntegrity(bytes,expected){
  if(!/^[a-f0-9]{64}$/.test(expected)||createHash('sha256').update(bytes).digest('hex')!==expected)throw new Error('Private Node runtime checksum mismatch; refusing execution.');
}

export async function ensurePrivateRuntime(root){
  const lock=JSON.parse(await readFile(join(root,'apps/windows-worker/runtime-lock.json'),'utf8'));
  const directory=join(root,`.runtime/toolchains/node-v${lock.version}`),destination=join(directory,'node.exe');
  try{assertRuntimeIntegrity(await readFile(destination),lock.sha256);return destination;}catch(error){if(error.code!=='ENOENT')throw error;}
  const response=await fetch(lock.url,{signal:AbortSignal.timeout(180000)});
  if(!response.ok)throw new Error(`Private runtime download failed (${response.status}).`);
  const chunks=[];let size=0;
  for await(const chunk of response.body){size+=chunk.length;if(size>150*1024*1024)throw new Error('Private runtime exceeds expected size limit.');chunks.push(chunk);}
  const bytes=Buffer.concat(chunks);assertRuntimeIntegrity(bytes,lock.sha256);
  await mkdir(directory,{recursive:true});const temporary=join(directory,`${randomUUID()}.tmp`);
  try{await writeFile(temporary,bytes,{flag:'wx'});await rename(temporary,destination);}finally{await unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;});}
  return destination;
}
