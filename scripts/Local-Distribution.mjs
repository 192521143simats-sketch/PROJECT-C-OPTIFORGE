import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';

/** Metadata from actual local packages, never an invented published URL. */
export async function localDistributionManifest(root=process.cwd()) {
  const windows=JSON.parse(await readFile(resolve(root,'apps/windows-worker/package.json'),'utf8'));
  const gradle=await readFile(resolve(root,'apps/android-worker/app/build.gradle.kts'),'utf8');
  const androidVersion=gradle.match(/versionName\s*=\s*"(\d+\.\d+\.\d+)"/)?.[1];
  if(!androidVersion)throw new Error('Android package version unavailable');
  const entries=[
    {platform:'WINDOWS',version:windows.version,fileName:`GRID-X-Worker-${windows.version}-Windows-x64-Setup.exe`,filePath:resolve(root,`.runtime/windows-worker/releases/GRID-X-Worker-${windows.version}-Windows-x64-Setup.exe`),trust:'UNSIGNED_DEVELOPMENT'},
    {platform:'ANDROID',version:androidVersion,fileName:`GRID-X-Worker-${androidVersion}-Android-debug.apk`,filePath:resolve(root,'apps/android-worker/app/build/outputs/apk/debug/app-debug.apk'),trust:'DEBUG_BUILD'}
  ];
  for(const entry of entries){const bytes=await readFile(entry.filePath);entry.sha256=createHash('sha256').update(bytes).digest('hex');entry.sizeBytes=bytes.length;}
  return entries;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const destination=resolve('.runtime/distribution/manifest.json');await mkdir(dirname(destination),{recursive:true});
  await writeFile(destination,JSON.stringify(await localDistributionManifest(),null,2));
  console.log(`Verified local prerelease manifest: ${destination}\nPowerShell: $env:GRID_X_LOCAL_DISTRIBUTION_MANIFEST=Get-Content -Raw '${destination}'`);
}
