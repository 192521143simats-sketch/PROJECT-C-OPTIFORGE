import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHash} from 'node:crypto';

export function reusableNetworkLinkMigration(){return{
  id:'0003_reusable_network_links',
  definition:readFileSync(fileURLToPath(import.meta.url),'utf8').replace(/\r\n/g,'\n'),
  run:async connection=>{
    for(const [name,definition] of [['join_link_token','VARCHAR(64) NULL'],['join_link_enabled','BOOLEAN NOT NULL DEFAULT TRUE']]){
      const [columns]=await connection.execute("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='distributed_networks' AND COLUMN_NAME=?",[name]);
      if(!columns.length)await connection.query(`ALTER TABLE distributed_networks ADD COLUMN ${name} ${definition}`);
    }
    // Existing token hashes cannot be reversed. Supply a fresh default link once;
    // do not alter existing enrollments, node identities or scoped credentials.
    const [networks]=await connection.query('SELECT id FROM distributed_networks WHERE join_link_token IS NULL');
    for(const network of networks){const token=randomBytes(32).toString('base64url');await connection.execute('UPDATE distributed_networks SET join_link_token=?,join_token_hash=? WHERE id=? AND join_link_token IS NULL',[token,createHash('sha256').update(token).digest('hex'),network.id]);}
  }
};}
