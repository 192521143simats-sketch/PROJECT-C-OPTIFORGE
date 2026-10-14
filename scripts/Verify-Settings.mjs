import assert from 'node:assert/strict';
import WebSocket from 'ws';
import {assertIsolatedTarget,verifyIsolatedCoordinator} from './Integration-Target.mjs';
const target=assertIsolatedTarget();await verifyIsolatedCoordinator(target);
async function request(path,{cookie,method='GET',body}={}){const response=await fetch(target.base+path,{method,headers:{origin:process.env.PUBLIC_BASE_URL,...(cookie?{cookie}:{}),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});return{status:response.status,body:response.status===204?null:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};}
async function signup(label){const email=`settings-${label}-${target.instance}@example.test`,password='Settings!Fixture123';assert.equal((await request('/api/auth/signup',{method:'POST',body:{name:`Settings ${label}`,email,password,confirmPassword:password}})).status,201);const login=await request('/api/auth/login',{method:'POST',body:{identifier:email,password}});assert.equal(login.status,200);return{cookie:login.cookie,email,password};}
const owner=await signup('owner'),foreign=await signup('foreign');
assert.equal((await request('/api/user/settings')).status,401);
assert.deepEqual((await request('/api/user/settings',{cookie:owner.cookie})).body,{analyticsOptIn:false,notificationOptIn:false,reducedMotion:false});
const changes=await Promise.all([request('/api/user/settings',{method:'PATCH',cookie:owner.cookie,body:{analyticsOptIn:true}}),request('/api/user/settings',{method:'PATCH',cookie:owner.cookie,body:{reducedMotion:true}})]);assert.ok(changes.every(change=>change.status===200));
assert.deepEqual((await request('/api/user/settings',{cookie:owner.cookie})).body,{analyticsOptIn:true,notificationOptIn:false,reducedMotion:true},'Concurrent independent preference changes must both persist');
assert.deepEqual((await request('/api/user/settings',{cookie:foreign.cookie})).body,{analyticsOptIn:false,notificationOptIn:false,reducedMotion:false});
assert.equal((await request('/api/user/settings',{method:'PATCH',cookie:owner.cookie,body:{analyticsOptIn:false,userId:foreign.email}})).status,400);
assert.equal((await request('/api/user/settings',{method:'PATCH',cookie:owner.cookie,body:{reducedMotion:'true'}})).status,400);
const second=await request('/api/auth/login',{method:'POST',body:{identifier:owner.email,password:owner.password}});assert.equal(second.status,200);
const sessions=(await request('/api/user/settings/sessions',{cookie:owner.cookie})).body;
assert.equal(sessions.items.length,2);assert.equal(sessions.items.filter(item=>item.current).length,1);assert.equal(JSON.stringify(sessions).includes('tokenHash'),false);
for(const item of sessions.items){assert.deepEqual(Object.keys(item).sort(),['createdAt','current','expiresAt','id']);assert.match(item.id,/^[a-f0-9]{64}$/);assert.equal(typeof item.current,'boolean');assert.ok(Number.isFinite(Date.parse(item.expiresAt)));}
const current=sessions.items.find(item=>item.current),other=sessions.items.find(item=>!item.current);
assert.equal((await request(`/api/user/settings/sessions/${current.id}`,{method:'DELETE',cookie:foreign.cookie})).status,404);
assert.equal((await request(`/api/user/settings/sessions/${other.id}`,{method:'DELETE',cookie:owner.cookie})).status,200);
const revoked=await request('/api/auth/me',{cookie:second.cookie});assert.equal(revoked.status,401);assert.equal(revoked.body.error.code,'AUTH_REQUIRED');
assert.equal((await request(`/api/user/settings/sessions/${other.id}`,{method:'DELETE',cookie:owner.cookie})).status,404);
assert.equal((await request(`/api/user/settings/sessions/${current.id}`,{method:'DELETE',cookie:owner.cookie})).status,200);
const rejected=await request('/api/user/settings',{cookie:owner.cookie});assert.equal(rejected.status,401);assert.equal(rejected.body.error.code,'AUTH_REQUIRED');
assert.equal((await request('/api/user/settings',{cookie:foreign.cookie})).status,200);
console.log(JSON.stringify({concurrentPreferences:'preserved',defaults:'private',foreignPreferences:'unchanged',sessions:'owner scoped opaque identifiers',foreignRevoke:'denied',revokedSession:'401',currentRevocation:'401'}));
const admin=await request('/api/auth/login',{method:'POST',body:{identifier:process.env.ADMIN_USERNAME,password:process.env.ADMIN_PASSWORD}});
assert.equal(admin.status,200);
const socket=new WebSocket(target.base.replace(/^http/,'ws')+'/ws/admin',{headers:{Cookie:admin.cookie,Origin:process.env.PUBLIC_BASE_URL}});
try{
 await new Promise((resolve,reject)=>{socket.once('message',resolve);socket.once('error',reject);});
 const active=(await request('/api/user/settings/sessions',{cookie:admin.cookie})).body.items.find(item=>item.current);
 const closed=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Revoked administrator WebSocket retained access')),3000);socket.once('close',code=>{clearTimeout(timer);resolve(code);});});
 await request(`/api/user/settings/sessions/${active.id}`,{method:'DELETE',cookie:admin.cookie});
 assert.equal(await closed,1008);
 console.log('Revoked administrator WebSocket closes with1008; no continued snapshots.');
}finally{socket.terminate();}
