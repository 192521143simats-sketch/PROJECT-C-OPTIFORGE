import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export function workerInvitationMigration(){return{
  id:'0002_worker_invitations',
  definition:readFileSync(fileURLToPath(import.meta.url),'utf8').replace(/\r\n/g,'\n'),
  run:async connection=>{
    // Refuse ambiguous identities rather than renaming nodes or deleting valuable records.
    const [codes]=await connection.query('SELECT network_code FROM distributed_networks WHERE network_code IS NOT NULL GROUP BY network_code HAVING COUNT(*)>1');
    const [enrollments]=await connection.query('SELECT enrollment_id FROM nodes WHERE enrollment_id IS NOT NULL GROUP BY enrollment_id HAVING COUNT(*)>1');
    if(codes.length||enrollments.length)throw new Error('Existing duplicate network or enrollment identities require reviewed reconciliation before migration');
    const [networks]=await connection.query('SELECT network_code FROM distributed_networks');
    let next=1;
    for(const row of networks){if(!/^[A-Z]{1,12}$/.test(String(row.network_code)))throw new Error('Existing network code requires reviewed reconciliation');let value=0;for(const letter of row.network_code)value=value*26+letter.charCodeAt(0)-64;if(!Number.isSafeInteger(value+1))throw new Error('Network identity sequence exceeds safe bounds');next=Math.max(next,value+1);}
    await connection.query('CREATE TABLE IF NOT EXISTS network_identity_sequence (id INT PRIMARY KEY,next_value BIGINT NOT NULL) ENGINE=InnoDB');
    await connection.execute('INSERT INTO network_identity_sequence(id,next_value) VALUES(1,?) ON DUPLICATE KEY UPDATE next_value=GREATEST(next_value,?)',[next,next]);
    const [index]=await connection.query("SELECT NON_UNIQUE nonUnique FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='distributed_networks' AND INDEX_NAME='uq_network_code'");
    if(index.some(row=>Number(row.nonUnique)===1))await connection.query('ALTER TABLE distributed_networks DROP INDEX uq_network_code');
    if(!index.length||index.some(row=>Number(row.nonUnique)===1))await connection.query('ALTER TABLE distributed_networks ADD UNIQUE INDEX uq_network_code(network_code)');
    const [nodeIndex]=await connection.query("SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='nodes' AND INDEX_NAME='uq_node_enrollment'");
    if(!nodeIndex.length)await connection.query('ALTER TABLE nodes ADD UNIQUE INDEX uq_node_enrollment(enrollment_id)');
    const [deadline]=await connection.query("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='network_enrollments' AND COLUMN_NAME='registration_deadline'");
    if(!deadline.length)await connection.query('ALTER TABLE network_enrollments ADD COLUMN registration_deadline VARCHAR(32) NULL');
    await connection.query("ALTER TABLE network_enrollments MODIFY worker_type ENUM('BROWSER','NATIVE','ANDROID') NOT NULL");
    await connection.query(`CREATE TABLE IF NOT EXISTS worker_invitations (
      id VARCHAR(64) PRIMARY KEY,network_id VARCHAR(64) NOT NULL,token_hash CHAR(64) NOT NULL UNIQUE,
      created_by VARCHAR(64) NOT NULL,created_at VARCHAR(32) NOT NULL,expires_at VARCHAR(32) NOT NULL,
      allowed_worker_types JSON NOT NULL,consumed_at VARCHAR(32),revoked_at VARCHAR(32),consumed_enrollment_id VARCHAR(64),
      CONSTRAINT fk_worker_invite_network FOREIGN KEY(network_id) REFERENCES distributed_networks(id),
      CONSTRAINT fk_worker_invite_creator FOREIGN KEY(created_by) REFERENCES users(id),
      CONSTRAINT fk_worker_invite_enrollment FOREIGN KEY(consumed_enrollment_id) REFERENCES network_enrollments(id),
      INDEX idx_worker_invite_network(network_id,expires_at)
    ) ENGINE=InnoDB`);
  }
};}
