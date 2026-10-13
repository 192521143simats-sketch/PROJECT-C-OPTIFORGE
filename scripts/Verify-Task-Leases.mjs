import assert from 'node:assert/strict';
import {Store} from '../apps/coordinator/src/database.ts';
import {NetworkService} from '../apps/coordinator/src/networks.ts';
import {assertIsolatedTarget,verifyIsolatedCoordinator} from './Integration-Target.mjs';

const target=assertIsolatedTarget();await verifyIsolatedCoordinator(target);
const config={host:process.env.DB_HOST,port:Number(process.env.DB_PORT),name:target.database,user:process.env.DB_USER,password:process.env.DB_PASSWORD};
let store=await Store.connect(config);
const resources={cpuUtilizationPercent:1,freeMemoryBytes:2e9,memoryUtilizationPercent:50,observedAt:new Date().toISOString()};
const profile={workerType:'BROWSER',deviceType:'DESKTOP',cpuModel:'Lease protocol fixture',logicalCores:2,totalMemoryBytes:4e9,operatingSystem:'Test only',architecture:'browser',runtimes:{c:false,python:false,java:false},toolchains:{c:{available:false},python:{available:false},java:{available:false}},operations:{irOptimization:true,staticAnalysis:true,browserCompute:true,nativeCompilation:false}};
const payload={operation:'prime_count',limit:10},answer={operation:'prime_count',limit:10,count:4};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function assign(...args){const end=Date.now()+5000;while(Date.now()<end){const [rows]=await store.pool.execute('SELECT next_eligible_at IS NULL OR next_eligible_at<=UTC_TIMESTAMP(3) eligible FROM tasks WHERE id=?',[args[0]]);if(rows[0]?.eligible)return store.assignTask(...args);await pause(30);}throw new Error('Persisted retry backoff did not expire');}
try{
  const [admins]=await store.pool.query("SELECT id FROM users WHERE role='ADMIN' LIMIT 1");
  const networks=new NetworkService(store.pool),network=await networks.create({name:'Durable lease fixture',description:'',maxNodes:5,expiresAt:null},admins[0].id);
  const nodes=[],credentials=[];
  for(let i=0;i<3;i++){
    const enrollment=await networks.createEnrollment(network.joinToken,'BROWSER',`lease-device-${i}`,true);
    credentials.push(enrollment.credential);const node=await networks.register(enrollment.credential,profile);assert.ok(node);nodes.push(node.nodeId);await store.heartbeat(node.nodeId,resources);
  }
  async function task(){const id=store.id('TASK');await store.pool.execute("INSERT INTO tasks(id,session_id,network_id,kind,payload_json,required_capability,status,created_at) VALUES(?,NULL,?,'TEST_COMPUTE',?,'base','QUEUED',?)",[id,network.id,JSON.stringify(payload),store.now()]);return id;}
  // A node lock must not turn a pre-expiry admission check into permission after expiry.
  const admission=await task(),nodeLock=await store.pool.getConnection();
  await store.pool.execute('UPDATE distributed_networks SET expires_at=? WHERE id=?',[new Date(Date.now()+1800).toISOString(),network.id]);
  await nodeLock.beginTransaction();await nodeLock.execute('SELECT id FROM nodes WHERE id=? FOR UPDATE',[nodes[0]]);
  const admissionWaiting=store.assignTask(admission,nodes[0],1,'Network expires during node lock').then(()=>null,error=>error);
  await pause(2300);await nodeLock.rollback();nodeLock.release();
  assert.ok(await admissionWaiting,'Assignment must reject a network that expired while waiting on the node lock');
  assert.equal((await store.getTask(admission)).status,'QUEUED');
  await store.pool.execute('UPDATE distributed_networks SET expires_at=NULL WHERE id=?',[network.id]);
  const networkResult=await task();await assign(networkResult,nodes[2],1,'Network expires during result lock',30000);await store.setTaskRunning(networkResult,nodes[2],1);
  await store.pool.execute('UPDATE distributed_networks SET expires_at=? WHERE id=?',[new Date(Date.now()+1800).toISOString(),network.id]);
  const publicationLock=await store.pool.getConnection();await publicationLock.beginTransaction();await publicationLock.execute('SELECT id FROM distributed_networks WHERE id=? FOR UPDATE',[network.id]);
  const publishing=store.completeTask(networkResult,nodes[2],1,answer,1,resources).then(()=>null,error=>error);
  await pause(2300);await publicationLock.rollback();publicationLock.release();
  assert.equal((await publishing)?.code,'STALE_TASK_RESULT','Network expiry must be checked after publication locks');
  const [expiredNetworkResults]=await store.pool.execute('SELECT id FROM results WHERE task_id=?',[networkResult]);assert.equal(expiredNetworkResults.length,0);
  await store.pool.execute('UPDATE distributed_networks SET expires_at=NULL WHERE id=?',[network.id]);await store.failTask(networkResult,nodes[2],1,'Owned expiry fixture finished',true);
  const id=await task();await assign(id,nodes[0],1,'Lease expiry fixture',80);assert.equal(await store.setTaskRunning(id,nodes[0],1),true);
  await pause(120);
  await assert.rejects(()=>store.completeTask(id,nodes[0],1,answer,1,resources),error=>error.code==='STALE_TASK_RESULT','Correct but expired result must not be accepted');
  const [published]=await store.pool.execute('SELECT id FROM results WHERE task_id=?',[id]);assert.equal(published.length,0);
  const [before]=await store.pool.execute('SELECT lease_expires_at deadline FROM task_attempts WHERE task_id=?',[id]);assert.ok(before[0].deadline instanceof Date);
  // Close and reopen the real store: the lease must survive loss of memory.
  await store.close();store=await Store.connect(config);
  const [after]=await store.pool.execute('SELECT lease_expires_at deadline FROM task_attempts WHERE task_id=?',[id]);assert.equal(after[0].deadline.toISOString(),before[0].deadline.toISOString());
  await store.recoverTaskAttempts();const [expired]=await store.pool.execute('SELECT status FROM task_attempts WHERE task_id=? AND attempt=1',[id]);assert.equal(expired[0].status,'TIMED_OUT');
  assert.equal((await store.getTask(id)).status,'REQUEUED');assert.equal(await store.heartbeat(nodes[0],resources),false,'An expired executor must re-register before receiving work');
  assert.deepEqual(await store.recoverTaskAttempts(),[],'Recovery must be idempotent');
  await assign(id,nodes[1],1,'Successful reassignment',30000);await store.setTaskRunning(id,nodes[1],2);
  await assert.rejects(()=>store.completeTask(id,nodes[0],1,answer,1,resources),error=>error.code==='STALE_TASK_RESULT');
  await store.completeTask(id,nodes[1],2,answer,1,resources);
  const [history]=await store.pool.execute('SELECT status,lease_expires_at FROM task_attempts WHERE task_id=? ORDER BY attempt',[id]);assert.deepEqual(history.map(row=>row.status),['TIMED_OUT','COMPLETED']);assert.equal(history[0].lease_expires_at.toISOString(),before[0].deadline.toISOString());
  assert.deepEqual(await store.recoverTaskAttempts(true),[]);assert.equal((await store.getTask(id)).status,'COMPLETED');

  const race=await task();await assign(race,nodes[1],1,'Expiry while publishing',400);await store.setTaskRunning(race,nodes[1],1);
  const originalGet=store.pool.getConnection.bind(store.pool);
  store.pool.getConnection=async()=>{const connection=await originalGet();await pause(500);return connection;};
  try{await assert.rejects(()=>store.completeTask(race,nodes[1],1,answer,1,resources),error=>error.code==='STALE_TASK_RESULT');}
  finally{store.pool.getConnection=originalGet;}
  const [raceResult]=await store.pool.execute('SELECT id FROM results WHERE task_id=?',[race]);assert.equal(raceResult.length,0,'Result checked before expiry must not commit after expiry');
  await store.recoverTaskAttempts();

  await new NetworkService(store.pool).register(credentials[1],profile);await store.heartbeat(nodes[1],resources);
  const locked=await task();await assign(locked,nodes[1],1,'Expiry during actual InnoDB lock wait',400);await store.setTaskRunning(locked,nodes[1],1);
  const blocker=await store.pool.getConnection();await blocker.beginTransaction();await blocker.execute('SELECT id FROM distributed_networks WHERE id=? FOR UPDATE',[network.id]);
  const waiting=store.completeTask(locked,nodes[1],1,answer,1,resources).then(()=>null,error=>error);
  await pause(600);await blocker.rollback();blocker.release();
  const waited=await waiting;assert.equal(waited?.code,'STALE_TASK_RESULT','Statement-start UTC time must not authorize publication after an InnoDB lock wait crosses expiry');
  const [lockResult]=await store.pool.execute('SELECT id FROM results WHERE task_id=?',[locked]);assert.equal(lockResult.length,0);
  await store.recoverTaskAttempts();

  const assigned=await task();await assign(assigned,nodes[2],1,'Expired before RUNNING',80);await pause(120);assert.equal(await store.setTaskRunning(assigned,nodes[2],1),false);await store.recoverTaskAttempts();
  const exhausted=await task();
  for(let attempt=1;attempt<=3;attempt++){
    const registered=await new NetworkService(store.pool).register(credentials[0],profile);assert.equal(registered.nodeId,nodes[0]);await store.heartbeat(nodes[0],resources);
    await assign(exhausted,nodes[0],1,'Restart recovery budget',30000);await store.setTaskRunning(exhausted,nodes[0],attempt);
    const [saved]=await store.pool.execute('SELECT lease_expires_at FROM task_attempts WHERE task_id=? AND attempt=?',[exhausted,attempt]);
    const recovered=await store.recoverTaskAttempts(true);assert.ok(recovered.some(item=>item.taskId===exhausted&&item.status==='INTERRUPTED'));
    const [retained]=await store.pool.execute('SELECT lease_expires_at FROM task_attempts WHERE task_id=? AND attempt=?',[exhausted,attempt]);assert.equal(retained[0].lease_expires_at.toISOString(),saved[0].lease_expires_at.toISOString());
  }
  assert.equal((await store.getTask(exhausted)).status,'FAILED');await assert.rejects(()=>store.assignTask(exhausted,nodes[0],1,'No fourth attempt'));
  const [attempts]=await store.pool.execute('SELECT status FROM task_attempts WHERE task_id=? ORDER BY attempt',[exhausted]);assert.deepEqual(attempts.map(row=>row.status),['INTERRUPTED','INTERRUPTED','INTERRUPTED']);
  // Simulate an upgraded active legacy attempt: no deadline means no permission.
  await new NetworkService(store.pool).register(credentials[2],profile);await store.heartbeat(nodes[2],resources);
  const legacy=await task();await assign(legacy,nodes[2],1,'Legacy no lease');await store.pool.execute('UPDATE task_attempts SET lease_expires_at=NULL WHERE task_id=?',[legacy]);
  assert.equal(await store.setTaskRunning(legacy,nodes[2],1),false);await store.recoverTaskAttempts();const [legacyHistory]=await store.pool.execute('SELECT status FROM task_attempts WHERE task_id=?',[legacy]);assert.equal(legacyHistory[0].status,'INTERRUPTED');
  const manyNetwork=await new NetworkService(store.pool).create({name:'Bounded recovery backlog',description:'',maxNodes:110,expiresAt:null},admins[0].id);
  for(let i=0;i<101;i++){
    const service=new NetworkService(store.pool),enrolled=await service.createEnrollment(manyNetwork.joinToken,'BROWSER',`batch-device-${i}`,true),node=await service.register(enrolled.credential,profile);await store.heartbeat(node.nodeId,resources);
    const taskId=store.id('TASK');await store.pool.execute("INSERT INTO tasks(id,session_id,network_id,kind,payload_json,required_capability,status,created_at) VALUES(?,NULL,?,'TEST_COMPUTE',?,'base','QUEUED',?)",[taskId,manyNetwork.id,JSON.stringify(payload),store.now()]);await assign(taskId,node.nodeId,1,'Bounded recovery fixture',30000);
  }
  const firstBatch=await store.recoverTaskAttempts(true);assert.equal(firstBatch.length,100,'Recovery must not lock an unbounded backlog in one transaction');
  assert.equal((await store.recoverTaskAttempts(true)).length,1);assert.deepEqual(await store.recoverTaskAttempts(true),[]);
  await verifyIsolatedCoordinator(target);
  console.log(JSON.stringify({expiredResultRejected:true,databaseLeaseSurvivesStoreRestart:true,publishAfterExpiryRejected:true,actualLockWaitExpiryRejected:true,expiredRunningTransitionRejected:true,recoveryIdempotent:true,staleReassignmentRejected:true,reassignmentCompleted:true,terminalHistoryPreserved:true,threeAttemptBudget:true,legacyNullLeaseInterrupted:true,workerQuarantine:true,boundedRecoveryBatches:[100,1,0]}));
}finally{await store.close();}
