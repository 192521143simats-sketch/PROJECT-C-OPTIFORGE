import {describe,expect,it} from "vitest";
import type {Pool,PoolConnection} from "mysql2/promise";
import {retryTransaction,runBackground} from "./transaction.js";

describe("transaction deadlock recovery",()=>{
  function fixture(){
    const events:string[]=[];let connectionNumber=0;
    const pool={getConnection:async()=>{
      const number=++connectionNumber;
      return {beginTransaction:async()=>{events.push(`begin:${number}`)},commit:async()=>{events.push(`commit:${number}`)},rollback:async()=>{events.push(`rollback:${number}`)},release:()=>{events.push(`release:${number}`)}};
    }};
    return{events,pool:pool as unknown as Pool};
  }
  it("rolls back and releases before retrying a deadlock, then commits the recovered result",async()=>{
    const{pool,events}=fixture();let calls=0;
    const result=await retryTransaction(pool,async(_connection:PoolConnection)=>{calls++;if(calls===1)throw Object.assign(new Error('deadlock'),{code:'ER_LOCK_DEADLOCK'});return 42;});
    expect(result).toBe(42);expect(events).toEqual(['begin:1','rollback:1','release:1','begin:2','commit:2','release:2']);
  });
  it("bounds repeated transient failures and never retries a constraint or application error",async()=>{
    const{pool,events}=fixture();let calls=0;
    await expect(retryTransaction(pool,async()=>{calls++;throw Object.assign(new Error('deadlock'),{errno:1213});})).rejects.toThrow('deadlock');expect(calls).toBe(3);expect(events.filter(event=>event.startsWith('release'))).toHaveLength(3);
    calls=0;await expect(retryTransaction(pool,async()=>{calls++;throw Object.assign(new Error('duplicate'),{code:'ER_DUP_ENTRY'});})).rejects.toThrow('duplicate');expect(calls).toBe(1);
  });
  it("observes rejected asynchronous and synchronous background work without an unhandled rejection",async()=>{
    const failures:unknown[]=[];
    runBackground(async()=>{throw new Error('async failure')},error=>failures.push(error));
    runBackground(()=>{throw new Error('sync failure')},error=>failures.push(error));
    await new Promise(resolve=>setTimeout(resolve,0));
    expect(failures.map(error=>(error as Error).message)).toEqual(['sync failure','async failure']);
  });
});
