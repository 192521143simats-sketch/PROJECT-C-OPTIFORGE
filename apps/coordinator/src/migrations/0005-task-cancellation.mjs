import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export function taskCancellationMigration(){return{
  id:'0005_task_cancellation',
  definition:readFileSync(fileURLToPath(import.meta.url),'utf8').replace(/\r\n/g,'\n'),
  run:async connection=>{
    const statuses={tasks:"'QUEUED','ASSIGNED','RUNNING','COMPLETED','FAILED','REQUEUED','CANCELLED'",compilation_jobs:"'SUBMITTED','DISTRIBUTING','CODE_GENERATING','COMPLETED','FAILED','CANCELLED'",optimization_batches:"'DISTRIBUTING','COMPLETED','FAILED','CANCELLED'"};
    for(const [table,values] of Object.entries(statuses)){
      const [rows]=await connection.query("SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME='status'",[table]);
      if(!rows[0].COLUMN_TYPE.includes("'CANCELLED'"))await connection.query(`ALTER TABLE ${table} MODIFY status ENUM(${values}) NOT NULL`);
    }
  }
};}
