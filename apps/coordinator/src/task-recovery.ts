import {randomUUID} from 'node:crypto';
import type {Pool,RowDataPacket} from 'mysql2/promise';
import {retryTransaction} from './transaction.js';

export type RecoveredAttempt={taskId:string;nodeId:string|null;attempt:number;status:'INTERRUPTED'|'TIMED_OUT'};

/** Single-active-coordinator recovery. Database time, not a JS timer, owns expiry. */
export async function recoverTaskAttempts(pool:Pool,restart=false):Promise<RecoveredAttempt[]>{
  return retryTransaction(pool,async connection=>{
    const [rows]=await connection.execute<RowDataPacket[]>(
      `SELECT t.id,t.network_id networkId,t.assigned_node_id nodeId,t.attempt,a.lease_expires_at deadline
       FROM tasks t LEFT JOIN task_attempts a ON a.task_id=t.id AND a.attempt=t.attempt
       WHERE t.status IN ('ASSIGNED','RUNNING') AND (? OR a.lease_expires_at IS NULL OR a.lease_expires_at<=UTC_TIMESTAMP(3))
       ORDER BY t.id LIMIT 100 FOR UPDATE`,[restart]);
    const recovered:RecoveredAttempt[]=[];
    for(const row of rows){
      const taskId=String(row.id),nodeId=row.nodeId?String(row.nodeId):null,attempt=Number(row.attempt);
      const status=restart||row.deadline===null?'INTERRUPTED':'TIMED_OUT';
      const reason=restart?'Coordinator restarted during task execution':row.deadline===null?'Task attempt has no durable lease':'Task execution timed out: durable lease expired';
      const now=new Date().toISOString();
      await connection.execute("UPDATE task_attempts SET status=?,completed_at=?,error=? WHERE task_id=? AND attempt=? AND status IN ('ASSIGNED','RUNNING')",[status,now,reason,taskId,attempt]);
      await connection.execute("UPDATE tasks SET status=IF(attempt>=3,'FAILED','REQUEUED'),assigned_node_id=NULL,error=?,completed_at=IF(attempt>=3,?,NULL) WHERE id=?",[reason,now,taskId]);
      // OFFLINE prevents an old socket heartbeat from making this still-running
      // executor eligible. Re-registration is required; IDs remain unchanged.
      if(nodeId)await connection.execute("UPDATE nodes SET status='OFFLINE',current_task_id=NULL,disconnected_at=? WHERE id=? AND network_id=? AND current_task_id=?",[now,nodeId,row.networkId,taskId]);
      await connection.execute("INSERT INTO audit_events(id,actor_type,event_type,target_type,target_id,metadata_json,created_at) VALUES(?,'SYSTEM',?,'TASK',?,?,?)",[`AUDIT-${randomUUID()}`,status==='TIMED_OUT'?'TASK_LEASE_EXPIRED':'TASK_ATTEMPT_INTERRUPTED',taskId,JSON.stringify({nodeId,attempt,networkId:row.networkId,reason}),now]);
      recovered.push({taskId,nodeId,attempt,status});
    }
    return recovered;
  });
}
