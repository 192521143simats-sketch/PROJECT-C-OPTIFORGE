import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export function taskPolicyIntegrityMigration(){return {
  id:'0006_task_policy_integrity',
  definition:readFileSync(fileURLToPath(import.meta.url),'utf8').replace(/\r\n/g,'\n'),
  run:async connection=>{
    for(const [table,column,definition] of [
      ['tasks','deadline_at','DATETIME(3) NULL'],
      ['tasks','next_eligible_at','DATETIME(3) NULL'],
      ['tasks','timeout_ms','INT UNSIGNED NOT NULL DEFAULT 30000'],
      ['tasks','max_attempts','INT UNSIGNED NOT NULL DEFAULT 3'],
      ['tasks','priority','INT NOT NULL DEFAULT 0'],
      ['artifacts','content_sha256','CHAR(64) NULL']
    ]){
      const [rows]=await connection.execute('SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?',[table,column]);
      if(!rows.length)await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
    await connection.query("UPDATE tasks SET deadline_at=TIMESTAMPADD(SECOND,300,UTC_TIMESTAMP(3)) WHERE deadline_at IS NULL AND status IN ('QUEUED','REQUEUED','ASSIGNED','RUNNING')");
    await connection.query('UPDATE artifacts SET content_sha256=LOWER(SHA2(content,256)) WHERE content_sha256 IS NULL');
    const [indexes]=await connection.execute("SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tasks' AND INDEX_NAME='idx_task_eligibility'");
    if(!indexes.length)await connection.query('ALTER TABLE tasks ADD INDEX idx_task_eligibility(status,next_eligible_at,deadline_at,priority)');
  }
};}
