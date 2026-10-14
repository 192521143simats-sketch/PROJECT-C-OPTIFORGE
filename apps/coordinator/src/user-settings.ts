import {createHash} from 'node:crypto';
import type {Pool,ResultSetHeader,RowDataPacket} from 'mysql2/promise';
import type {FastifyInstance,FastifyRequest} from 'fastify';
export type UserPreferences={analyticsOptIn:boolean;notificationOptIn:boolean;reducedMotion:boolean};
export const defaultPreferences:Readonly<UserPreferences>=Object.freeze({analyticsOptIn:false,notificationOptIn:false,reducedMotion:false});
export function parsePreferences(value:unknown):Partial<UserPreferences>|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;const entries=Object.entries(value);if(!entries.length||entries.some(([key,v])=>!Object.hasOwn(defaultPreferences,key)||typeof v!=='boolean'))return null;return Object.fromEntries(entries);
}
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
const sessionId=(hash:string)=>digest(`settings-session:${hash}`);
export type SessionSummary={id:string;createdAt:string;expiresAt:string;current:boolean};
export interface SettingsStore{get(userId:string):Promise<UserPreferences>;update(userId:string,patch:Partial<UserPreferences>):Promise<UserPreferences>;listSessions(userId:string,currentToken?:string):Promise<SessionSummary[]>;revokeSession(userId:string,id:string):Promise<boolean>}
/** Reuses existing user/session tables; all writes are scoped by the authenticated owner. */
export class UserSettingsStore implements SettingsStore{
 constructor(private readonly pool:Pool){}
 async get(userId:string){const [rows]=await this.pool.execute<RowDataPacket[]>('SELECT preferences_json preferences FROM users WHERE id=?',[userId]);let value:unknown=rows[0]?.preferences;try{if(typeof value==='string')value=JSON.parse(value);}catch{value=null;}const parsed=parsePreferences(value);return {...defaultPreferences,...parsed};}
 async update(userId:string,patch:Partial<UserPreferences>){const parsed=parsePreferences(patch);if(!parsed)throw new Error('Invalid preferences');const pairs=Object.entries(parsed);const paths=pairs.flatMap(([key,value])=>[`$.${key}`,JSON.stringify(value)]);await this.pool.execute(`UPDATE users SET preferences_json=JSON_SET(COALESCE(preferences_json,JSON_OBJECT()),${pairs.map(()=> '?,CAST(? AS JSON)').join(',')}),updated_at=? WHERE id=?`,[...paths,new Date().toISOString(),userId]);return this.get(userId);}
 async listSessions(userId:string,currentToken?:string){const [rows]=await this.pool.execute<RowDataPacket[]>('SELECT token_hash tokenHash,created_at createdAt,expires_at expiresAt FROM auth_sessions WHERE user_id=? AND revoked_at IS NULL AND expires_at>? ORDER BY created_at DESC LIMIT 100',[userId,new Date().toISOString()]);return rows.map(row=>({id:sessionId(String(row.tokenHash)),createdAt:String(row.createdAt),expiresAt:String(row.expiresAt),current:!!currentToken&&digest(currentToken)===row.tokenHash}));}
 async revokeSession(userId:string,id:string){const [result]=await this.pool.execute<ResultSetHeader>("UPDATE auth_sessions SET revoked_at=? WHERE user_id=? AND SHA2(CONCAT('settings-session:',token_hash),256)=? AND revoked_at IS NULL AND expires_at>?",[new Date().toISOString(),userId,id,new Date().toISOString()]);return result.affectedRows>0;}
}
export type SettingsDependencies={store:SettingsStore;authenticate(request:FastifyRequest):Promise<{id:string}|null>;currentSessionToken(request:FastifyRequest):string|undefined;audit?(userId:string,event:string):Promise<void>};
export async function registerSettingsRoutes(app:FastifyInstance,deps:SettingsDependencies){
 const owner=async(request:FastifyRequest,reply:any)=>{const user=await deps.authenticate(request);if(!user)reply.code(401).send({error:{code:'AUTH_REQUIRED',message:'Sign in to manage your settings.'}});return user;};
 app.get('/api/user/settings',async(request,reply)=>{const user=await owner(request,reply);if(!user)return;return deps.store.get(user.id);});
 app.patch('/api/user/settings',async(request,reply)=>{const user=await owner(request,reply);if(!user)return;const patch=parsePreferences(request.body);if(!patch)return reply.code(400).send({error:{code:'INVALID_SETTINGS',message:'Only supported boolean preferences are accepted.'}});const settings=await deps.store.update(user.id,patch);await deps.audit?.(user.id,'USER_SETTINGS_UPDATED');return settings;});
 app.get('/api/user/settings/sessions',async(request,reply)=>{const user=await owner(request,reply);if(!user)return;return {items:await deps.store.listSessions(user.id,deps.currentSessionToken(request))};});
 app.delete('/api/user/settings/sessions/:sessionId',async(request,reply)=>{const user=await owner(request,reply);if(!user)return;const {sessionId:id}=request.params as {sessionId:string};if(!await deps.store.revokeSession(user.id,id))return reply.code(404).send({error:{code:'SESSION_NOT_FOUND',message:'Active session not found.'}});await deps.audit?.(user.id,'USER_SESSION_REVOKED');return {revoked:true};});
}
