import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export function taskAttemptLeaseMigration(){return{
  id:'0004_task_attempt_leases',
  definition:readFileSync(fileURLToPath(import.meta.url),'utf8').replace(/\r\n/g,'\n'),
  run:async connection=>{
    const [columns]=await connection.query("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='task_attempts' AND COLUMN_NAME='lease_expires_at'");
    if(!columns.length)await connection.query('ALTER TABLE task_attempts ADD COLUMN lease_expires_at DATETIME(3) NULL');
    const [indexes]=await connection.query("SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='task_attempts' AND INDEX_NAME='idx_attempt_lease'");
    if(!indexes.length)await connection.query('ALTER TABLE task_attempts ADD INDEX idx_attempt_lease(status,lease_expires_at)');
    // Never invent a renewed deadline for historical attempts. Terminal history
    // stays untouched; startup recovery interrupts active legacy NULL leases.
  }
};}
