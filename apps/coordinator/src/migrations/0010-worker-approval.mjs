import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export function workerApprovalMigration(){return{
 id:'0010_worker_approval',definition:readFileSync(fileURLToPath(import.meta.url),'utf8').replace(/\r\n/g,'\n'),
 run:async connection=>{
  const [columns]=await connection.execute("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='network_enrollments' AND COLUMN_NAME='approval_status'");
  // Existing enrollment authorization is retained. Only future explicitly gated enrollments wait.
  if(!columns.length)await connection.query("ALTER TABLE network_enrollments ADD COLUMN approval_status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'APPROVED'");
 }
};}
