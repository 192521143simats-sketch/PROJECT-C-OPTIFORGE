import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export function computeOwnershipMigration(){return{
  id:'0008_compute_ownership',definition:readFileSync(fileURLToPath(import.meta.url),'utf8').replace(/\r\n/g,'\n'),
  run:async connection=>{
    const [columns]=await connection.execute("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tasks' AND COLUMN_NAME='user_id'");
    if(!columns.length)await connection.query('ALTER TABLE tasks ADD COLUMN user_id VARCHAR(64) NULL');
    const [indexes]=await connection.execute("SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tasks' AND INDEX_NAME='idx_compute_owner_history'");
    if(!indexes.length)await connection.query('ALTER TABLE tasks ADD INDEX idx_compute_owner_history(user_id,status,created_at)');
    const [keys]=await connection.execute("SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='tasks' AND CONSTRAINT_NAME='fk_compute_owner'");
    if(!keys.length)await connection.query('ALTER TABLE tasks ADD CONSTRAINT fk_compute_owner FOREIGN KEY(user_id) REFERENCES users(id)');
  }
};}
