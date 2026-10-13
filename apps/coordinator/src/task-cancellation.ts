import {randomUUID} from 'node:crypto';
import type {Pool,PoolConnection,RowDataPacket} from 'mysql2/promise';
import {retryTransaction} from './transaction.js';

export const terminalJobStatuses=['COMPLETED','FAILED','CANCELLED'];
export class InactiveJobError extends Error { constructor(){super('Compilation is no longer active.');} }
export async function lockActiveJob(connection:PoolConnection,jobId:string,networkId?:string){
  const [rows]=await connection.execute<RowDataPacket[]>('SELECT status,network_id networkId FROM compilation_jobs WHERE id=? FOR UPDATE',[jobId]);
  if(!rows[0]||terminalJobStatuses.includes(rows[0].status)||networkId!==undefined&&rows[0].networkId!==networkId)throw new InactiveJobError();
}
type CancelledTask={taskId:string;nodeId:string|null;attempt:number};
async function cancelRows(connection:PoolConnection,rows:RowDataPacket[],now:string):Promise<CancelledTask[]>{
  const cancelled:CancelledTask[]=[];
  for(const row of rows){
    if(!['QUEUED','REQUEUED','ASSIGNED','RUNNING'].includes(row.status))continue;
    const taskId=String(row.id),nodeId=row.assigned_node_id?String(row.assigned_node_id):null,attempt=Number(row.attempt);
    await connection.execute("UPDATE task_attempts SET status='CANCELLED',completed_at=?,error='Cancelled by request' WHERE task_id=? AND attempt=? AND status IN ('ASSIGNED','RUNNING')",[now,taskId,attempt]);
    await connection.execute("UPDATE tasks SET status='CANCELLED',completed_at=?,error='Cancelled by request' WHERE id=?",[now,taskId]);
    if(nodeId)await connection.execute("UPDATE nodes SET status='OFFLINE',current_task_id=NULL,disconnected_at=? WHERE id=? AND current_task_id=?",[now,nodeId,taskId]);
    cancelled.push({taskId,nodeId,attempt});
  }
  return cancelled;
}
export async function cancelCompilationJob(pool:Pool,jobId:string,actorId:string,admin=false){
  return retryTransaction(pool,async connection=>{
    const [jobs]=await connection.execute<RowDataPacket[]>('SELECT user_id,status,batch_id FROM compilation_jobs WHERE id=? FOR UPDATE',[jobId]);
    const job=jobs[0];if(!job||!admin&&job.user_id!==actorId)return undefined;
    if(terminalJobStatuses.includes(job.status))return{status:String(job.status),tasks:[] as CancelledTask[]};
    const [rows]=await connection.execute<RowDataPacket[]>(`SELECT t.* FROM tasks t WHERE t.job_id=? OR t.id IN (SELECT task_id FROM optimization_batch_tasks WHERE batch_id=?) ORDER BY t.id FOR UPDATE`,[jobId,job.batch_id]);
    const now=new Date().toISOString(),tasks=await cancelRows(connection,rows,now);
    await connection.execute("UPDATE compilation_jobs SET status='CANCELLED',completed_at=?,error=NULL WHERE id=?",[now,jobId]);
    if(job.batch_id)await connection.execute("UPDATE optimization_batches SET status='CANCELLED',completed_at=? WHERE id=? AND status='DISTRIBUTING'",[now,job.batch_id]);
    await connection.execute("INSERT INTO audit_events(id,actor_type,actor_id,event_type,target_type,target_id,metadata_json,created_at) VALUES(?,?,?,'COMPILATION_CANCELLED','JOB',?,?,?)",[`AUDIT-${randomUUID()}`,admin?'ADMIN':'USER',actorId,jobId,JSON.stringify({taskCount:tasks.length}),now]);
    return{status:'CANCELLED',tasks};
  });
}
export async function cancelPortableTask(pool:Pool,taskId:string,actorId:string){
  return retryTransaction(pool,async connection=>{
    const [rows]=await connection.execute<RowDataPacket[]>("SELECT * FROM tasks WHERE id=? AND kind='TEST_COMPUTE' AND job_id IS NULL FOR UPDATE",[taskId]);
    if(!rows[0])return undefined;
    const now=new Date().toISOString(),tasks=await cancelRows(connection,rows,now);
    if(tasks.length)await connection.execute("INSERT INTO audit_events(id,actor_type,actor_id,event_type,target_type,target_id,metadata_json,created_at) VALUES(?,'ADMIN',?,'TASK_CANCELLED','TASK',?,'{}',?)",[`AUDIT-${randomUUID()}`,actorId,taskId,now]);
    return{status:tasks.length?'CANCELLED':String(rows[0].status),tasks};
  });
}
