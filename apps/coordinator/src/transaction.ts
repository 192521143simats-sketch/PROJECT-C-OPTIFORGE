import type {Pool,PoolConnection} from "mysql2/promise";

/** Only database work belongs in this callback: retries must not repeat external effects. */
export async function retryTransaction<T>(pool:Pool,work:(connection:PoolConnection)=>Promise<T>):Promise<T> {
  for(let attempt=1;attempt<=3;attempt++){
    const connection=await pool.getConnection();let retry=false;
    try {await connection.beginTransaction();const result=await work(connection);await connection.commit();return result;}
    catch(error){
      try{await connection.rollback();}catch{/* Preserve the original failure, not a secondary rollback error. */}
      const code=(error as {code?:string;errno?:number});
      retry=attempt<3 && (code.code==='ER_LOCK_DEADLOCK'||code.code==='ER_LOCK_WAIT_TIMEOUT'||code.errno===1213||code.errno===1205);
      if(!retry)throw error;
    }finally{connection.release();}
    if(retry)await new Promise(resolve=>setTimeout(resolve,10*attempt));
  }
  throw new Error('Transaction retry budget exhausted');
}

export function runBackground(work:()=>Promise<void>,onFailure:(error:unknown)=>void):void {
  void Promise.resolve().then(work).catch(onFailure);
}
