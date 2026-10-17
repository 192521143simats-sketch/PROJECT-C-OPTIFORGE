import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {localDistributionManifest} from './Local-Distribution.mjs';
test('local package metadata uses actual bytes and configured versions; missing packages fail',async()=>{
 const root=await mkdtemp(join(tmpdir(),'gridx-package-metadata-'));
 try{
  const files=[['apps/windows-worker/package.json','{"version":"1.2.3"}'],['apps/android-worker/app/build.gradle.kts','versionName = "2.3.4"'],['.runtime/windows-worker/releases/GRID-X-Worker-1.2.3-Windows-x64-Setup.exe','unit fixture windows bytes'],['apps/android-worker/app/build/outputs/apk/debug/app-debug.apk','unit fixture android bytes']];
  for(const[path,bytes]of files){await mkdir(dirname(join(root,path)),{recursive:true});await writeFile(join(root,path),bytes);}
  const manifest=await localDistributionManifest(root);assert.equal(manifest[1].version,'2.3.4');assert.equal(manifest[1].sha256,createHash('sha256').update(files[3][1]).digest('hex'));assert.equal(manifest[1].sizeBytes,Buffer.byteLength(files[3][1]));assert.ok(manifest.every(entry=>!('url' in entry)));
  await rm(join(root,files[3][0]));await assert.rejects(localDistributionManifest(root),/ENOENT/);
 }finally{await rm(root,{recursive:true,force:true});}
});
