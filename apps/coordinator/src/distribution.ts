import {z} from 'zod';
import {validateProductionEnvironment} from './runtime-policy.js';
import {open,lstat,realpath,type FileHandle} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';

const entry=z.object({platform:z.enum(['WINDOWS','ANDROID']),version:z.string().regex(/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/),fileName:z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/),sha256:z.string().regex(/^[a-f0-9]{64}$/),sizeBytes:z.number().int().positive().max(2_147_483_647),url:z.string().max(2048)}).strict();
export type DistributionEntry=z.infer<typeof entry>;
export function parseDistributionManifest(raw:string|undefined):DistributionEntry[]{
 if(!raw)return[];
 const values=z.array(entry).max(2).parse(JSON.parse(raw)),seen=new Set<string>();
 for(const value of values){
  if(seen.has(value.platform))throw new Error('Duplicate distribution platform');seen.add(value.platform);
  const url=new URL(value.url);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!url.pathname.toLowerCase().endsWith(value.platform==='WINDOWS'?'.exe':'.apk')||!value.fileName.toLowerCase().endsWith(value.platform==='WINDOWS'?'.exe':'.apk'))throw new Error('Distribution requires a credential-free HTTPS package URL');
  validateProductionEnvironment({nodeEnv:'production',publicBaseUrl:url.origin,adminPasswordHash:'$argon2id$validation-only'});
 }
 return values;
}
export function distributionMetadata(manifest:DistributionEntry[]){return{platforms:(['WINDOWS','ANDROID'] as const).map(platform=>{const value=manifest.find(item=>item.platform===platform);return value?{...value,available:true}:{platform,available:false,reason:'NOT_PUBLISHED'};})};}

const localEntry=entry.omit({url:true}).extend({filePath:z.string().min(1),trust:z.enum(['UNSIGNED_DEVELOPMENT','DEBUG_BUILD','SIGNED_RELEASE'])}).strict();
type LocalEntry=z.infer<typeof localEntry>;
const within=(path:string,root:string)=>{const delta=relative(root,path);return delta!==''&&!delta.startsWith('..')&&!isAbsolute(delta);};
export class LocalDistributionRegistry{
 private readonly entries:LocalEntry[];private readonly roots:string[];private activeVerifications=0;
 constructor(private readonly projectRoot:string,raw:string|undefined){
  this.roots=['.runtime/distribution','.runtime/windows-worker/releases','apps/android-worker/app/build/outputs/apk'].map(path=>resolve(projectRoot,path));
  this.entries=raw?z.array(localEntry).max(2).parse(JSON.parse(raw)):[];const seen=new Set<string>();
  for(const item of this.entries){if(seen.has(item.platform))throw new Error('Duplicate local distribution platform');seen.add(item.platform);if(!isAbsolute(item.filePath)||!this.roots.some(root=>within(resolve(item.filePath),root))||!item.fileName.toLowerCase().endsWith(item.platform==='WINDOWS'?'.exe':'.apk'))throw new Error('Local distribution path must be inside an approved package directory');}
 }
 private async verified(item:LocalEntry):Promise<FileHandle|null>{
  if(this.activeVerifications>=4)throw Object.assign(new Error('Package verification is busy. Retry shortly.'),{statusCode:503});
  this.activeVerifications++;try{return await this.verifyFile(item);}finally{this.activeVerifications--;}
 }
 private async verifyFile(item:LocalEntry):Promise<FileHandle|null>{
  let handle:FileHandle|undefined;
  try{
   const configured=resolve(item.filePath),root=this.roots.find(root=>within(configured,root));if(!root)return null;
   // Reject symlink components, then check canonical containment and the opened identity.
   let current=this.projectRoot;const components=relative(this.projectRoot,configured).split(/[\\/]/);for(const component of ['',...components]){if(component)current=resolve(current,component);if((await lstat(current)).isSymbolicLink())return null;}
   const canonicalRoot=await realpath(root),canonical=await realpath(configured);if(!within(canonical,canonicalRoot))return null;
   const before=await lstat(canonical);if(!before.isFile()||before.size!==item.sizeBytes)return null;
   handle=await open(canonical,'r');const stat=await handle.stat();if(!stat.isFile()||stat.size!==item.sizeBytes||stat.ino!==before.ino||stat.dev!==before.dev){await handle.close();return null;}
   const hash=createHash('sha256');for await(const chunk of handle.createReadStream({autoClose:false,start:0}))hash.update(chunk);
   const after=await handle.stat();if(hash.digest('hex')!==item.sha256||after.size!==stat.size||after.mtimeMs!==stat.mtimeMs||after.ctimeMs!==stat.ctimeMs){await handle.close();return null;}
   return handle;
  }catch{await handle?.close().catch(()=>{});return null;}
 }
 private metadataEntry(item:LocalEntry){return{platform:item.platform,version:item.version,fileName:item.fileName,sha256:item.sha256,sizeBytes:item.sizeBytes,localAvailable:true,localDownloadUrl:`/api/distribution/${item.platform}/download`,channel:'LOCAL_PRERELEASE',trust:item.trust};}
 async metadata(){return Promise.all(this.entries.map(async item=>{const handle=await this.verified(item);if(!handle)return{platform:item.platform,localAvailable:false};await handle.close();return this.metadataEntry(item);}));}
 async download(platform:string){const item=this.entries.find(item=>item.platform===platform);if(!item)return null;const handle=await this.verified(item);return handle?{...this.metadataEntry(item),stream:handle.createReadStream({autoClose:true,start:0})}:null;}
}
