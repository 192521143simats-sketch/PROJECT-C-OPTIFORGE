import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import {applyMigrations} from '../apps/coordinator/src/migrations.ts';
import {existingSchemaMigration} from '../apps/coordinator/src/migrations/0001-existing-schema.mjs';
import {assertIsolatedTarget,verifyIsolatedCoordinator} from './Integration-Target.mjs';

const target=assertIsolatedTarget();await verifyIsolatedCoordinator(target);
const pool=mysql.createPool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),database:target.database,user:process.env.DB_USER,password:process.env.DB_PASSWORD,connectionLimit:4});
const id='9998_engineering_migration_probe';
try{
  const [baseline]=await pool.query('SELECT id,checksum FROM schema_migrations ORDER BY id');
  assert.equal(baseline.length,1);assert.equal(baseline[0].id,'0001_existing_schema');
  // Owned legacy rows exercise the actual adoption/backfills, not only a synthetic migration.
  const now=new Date().toISOString();
  await pool.execute("INSERT INTO users(id,name,email,password_hash,role,created_at,updated_at) VALUES('migration-user','Legacy fixture','migration-fixture@example.invalid','not-a-login-hash','USER',?,?)",[now,now]);
  await pool.execute("INSERT INTO distributed_networks(id,public_id,join_token_hash,name,status,created_by,created_at,configuration_json) VALUES('migration-network','migration-public',REPEAT('a',64),'Preserved legacy network','ACTIVE','migration-user',?,'{}')",[now]);
  await pool.execute("INSERT INTO compilation_jobs(id,language,source_name,source_text,status,stage,created_at) VALUES('migration-job','c','legacy.c','int main(){return 0;}','COMPLETED','COMPLETED',?)",[now]);
  await pool.execute("INSERT INTO artifacts(id,job_id,file_name,media_type,content,size_bytes,created_at) VALUES('migration-artifact','migration-job','legacy.c','text/plain',?,3,?)",[Buffer.from('abc'),now]);
  await pool.execute('DELETE FROM schema_migrations WHERE id=?',[baseline[0].id]);
  const actual=existingSchemaMigration();let adoptionInvocations=0;
  const interruptedBaseline={...actual,run:async connection=>{
    adoptionInvocations++;
    const fault=new Proxy(connection,{get(object,key){
      if(key==='execute')return async (...args)=>{const result=await object.execute(...args);if(String(args[0]).startsWith('ALTER TABLE nodes MODIFY'))throw new Error('Deliberate baseline DDL interruption');return result;};
      const value=Reflect.get(object,key);return typeof value==='function'?value.bind(object):value;
    }});
    await actual.run(fault);
  }};
  await assert.rejects(applyMigrations(pool,target.database,[interruptedBaseline]),/baseline DDL interruption/);
  const [failedBaseline]=await pool.query('SELECT id FROM schema_migrations');assert.equal(failedBaseline.length,0);
  const resumedBaseline={...actual,run:async connection=>{adoptionInvocations++;await actual.run(connection);}};
  await Promise.all([applyMigrations(pool,target.database,[resumedBaseline]),applyMigrations(pool,target.database,[resumedBaseline])]);
  assert.equal(adoptionInvocations,2);
  const [network]=await pool.query("SELECT name,network_code FROM distributed_networks WHERE id='migration-network'");
  assert.equal(network[0].name,'Preserved legacy network');assert.equal(network[0].network_code,'A');
  const [artifact]=await pool.query("SELECT language,content FROM artifacts WHERE id='migration-artifact'");
  assert.equal(artifact[0].language,'c');assert.equal(artifact[0].content.toString(),'abc');
  const existing={...existingSchemaMigration(),run:async()=>{throw new Error('An applied baseline must not run again');}};
  let interrupted=true,invocations=0;
  const probe={id,definition:'Owned isolated migration test: partial DDL recovery and serialized startup',run:async connection=>{
    invocations++;
    await connection.query('CREATE TABLE IF NOT EXISTS engineering_migration_probe (id INT PRIMARY KEY) ENGINE=InnoDB');
    if(interrupted){interrupted=false;throw new Error('Deliberate isolated interruption after DDL');}
    await connection.query('INSERT IGNORE INTO engineering_migration_probe VALUES (1)');
  }};
  await assert.rejects(applyMigrations(pool,target.database,[existing,probe]),/Deliberate isolated interruption/);
  const [notApplied]=await pool.execute('SELECT id FROM schema_migrations WHERE id=?',[id]);assert.equal(notApplied.length,0);
  await Promise.all([applyMigrations(pool,target.database,[existing,probe]),applyMigrations(pool,target.database,[existing,probe])]);
  assert.equal(invocations,2);
  const [completed]=await pool.execute('SELECT id FROM schema_migrations WHERE id=?',[id]);assert.equal(completed.length,1);
  await assert.rejects(applyMigrations(pool,target.database,[existing,{...probe,definition:'Changed definition'}]),/changed/);
  await assert.rejects(applyMigrations(pool,target.database,[existing]),/unknown|newer/);
  const [data]=await pool.query('SELECT id FROM engineering_migration_probe');assert.deepEqual(data.map(row=>row.id),[1]);
  console.log(JSON.stringify({baselineAdopted:true,legacyDataAndBackfillsPreserved:true,actualBaselineInterruptionRecovered:true,serializedConcurrentStartup:true,partialDdlRecovery:true,failedMigrationNotRecorded:true,changedDefinitionRejected:true,newerDatabaseRejected:true,probeInvocations:invocations}));
}finally{
  // These exact targets are owned fixtures in the isolated database, never developer data.
  await pool.execute('DELETE FROM schema_migrations WHERE id=?',[id]);
  await pool.query('DROP TABLE IF EXISTS engineering_migration_probe');
  await pool.query("DELETE FROM artifacts WHERE id='migration-artifact'");
  await pool.query("DELETE FROM compilation_jobs WHERE id='migration-job'");
  await pool.query("DELETE FROM distributed_networks WHERE id='migration-network'");
  await pool.query("DELETE FROM users WHERE id='migration-user'");
  await pool.end();
}
