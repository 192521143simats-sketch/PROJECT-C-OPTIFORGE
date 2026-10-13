import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export function attemptFailureReasonMigration(){return {
  id:'0007_attempt_failure_reasons',definition:readFileSync(fileURLToPath(import.meta.url),'utf8').replace(/\r\n/g,'\n'),
  run:async connection=>{
    const [rows]=await connection.execute("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='task_attempts' AND COLUMN_NAME='failure_reason'");
    if(!rows.length)await connection.query('ALTER TABLE task_attempts ADD COLUMN failure_reason VARCHAR(32) NULL');
  }
};}
