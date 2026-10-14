import {describe,it,expect} from 'vitest';
import Fastify from 'fastify';
import {registerSettingsRoutes,parsePreferences,defaultPreferences} from './user-settings.js';
describe('owner settings API',()=>{
 it('uses the same safe error envelope as the existing API',async()=>{
  const app=Fastify();
  await registerSettingsRoutes(app,{store:{get:async()=>defaultPreferences,update:async()=>defaultPreferences,listSessions:async()=>[],revokeSession:async()=>false},authenticate:async()=>null,currentSessionToken:()=>undefined});
  const response=await app.inject('/api/user/settings');
  expect(response.json()).toEqual({error:{code:'AUTH_REQUIRED',message:'Sign in to manage your settings.'}});
  await app.close();
 });
 it('rejects unknown fields, nested arbitrary data and non-booleans',()=>{expect(parsePreferences({analyticsOptIn:'true'})).toBeNull();expect(parsePreferences({source:'secret'})).toBeNull();expect(parsePreferences({analyticsOptIn:true})).toEqual({analyticsOptIn:true});expect(defaultPreferences.analyticsOptIn).toBe(false);});
 it('denies anonymous access and binds settings writes/session revocation to authenticated owner',async()=>{const app=Fastify();const writes:any[]=[];const store={get:async()=>defaultPreferences,update:async(id:string,p:any)=>{writes.push([id,p]);return {...defaultPreferences,...p};},listSessions:async()=>[],revokeSession:async(id:string,s:string)=>{writes.push([id,s]);return s==='owned';}};await registerSettingsRoutes(app,{store,authenticate:async r=>r.headers.authorization?{id:'owner'}:null,currentSessionToken:()=>undefined});expect((await app.inject('/api/user/settings')).statusCode).toBe(401);const response=await app.inject({method:'PATCH',url:'/api/user/settings',headers:{authorization:'session'},payload:{analyticsOptIn:true,userId:'victim'}});expect(response.statusCode).toBe(400);expect(writes).toEqual([]);expect((await app.inject({method:'PATCH',url:'/api/user/settings',headers:{authorization:'session'},payload:{analyticsOptIn:true}})).json().analyticsOptIn).toBe(true);expect(writes[0]).toEqual(['owner',{analyticsOptIn:true}]);expect((await app.inject({method:'DELETE',url:'/api/user/settings/sessions/foreign',headers:{authorization:'session'}})).statusCode).toBe(404);expect(writes[1]).toEqual(['owner','foreign']);await app.close();});
});
