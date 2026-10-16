import {chromium,_electron,expect} from '@playwright/test';
import mysql from 'mysql2/promise';
import {resolve,join} from 'node:path';
import {mkdir} from 'node:fs/promises';
import {assertIsolatedTarget,verifyIsolatedCoordinator} from './Integration-Target.mjs';
import {terminateOwnedTestProcess} from './Owned-Test-Process.mjs';

const target=assertIsolatedTarget();await verifyIsolatedCoordinator(target);
const web=process.env.GRID_X_TEST_WEB_BASE,evidence=process.env.GRID_X_TEST_EVIDENCE;
if(!web||!/^http:\/\/127\.0\.0\.1:\d+$/.test(web)||!evidence)throw new Error('Owned mixed web fixture required');
const data=resolve(evidence,'mixed-windows-profile');await mkdir(data,{recursive:true});
let cookie='',browser,desktop,desktopProcess,failure;
const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),database:target.database,user:process.env.DB_USER,password:process.env.DB_PASSWORD});
async function api(path,body,method=body?'POST':'GET'){const response=await fetch(target.base+path,{method,headers:{origin:web,...(cookie?{cookie}:{}),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});expect(response.ok,`${path}: ${response.status}`).toBe(true);if(path==='/api/auth/login')cookie=response.headers.get('set-cookie').split(';')[0];return response.status===204?null:response.json();}
async function completed(task){await expect.poll(async()=>(await api('/api/admin/tasks/'+task.id)).status,{timeout:90000}).toBe('COMPLETED');const[rows]=await db.execute("SELECT a.node_id,r.result_json FROM task_attempts a JOIN results r ON r.task_id=a.task_id AND r.attempt=a.attempt WHERE a.task_id=? AND a.status='COMPLETED'",[task.id]);expect(rows).toHaveLength(1);return{node:rows[0].node_id,result:typeof rows[0].result_json==='string'?JSON.parse(rows[0].result_json):rows[0].result_json};}
async function restart(){if(!process.send)throw new Error('Owned fault control required');const id=crypto.randomUUID();await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{process.off('message',receive);reject(new Error('Coordinator restart timeout'));},60000);function receive(message){if(message.id!==id)return;process.off('message',receive);clearTimeout(timer);message.error?reject(new Error(message.error)):resolve();}process.on('message',receive);process.send({id,recoveryAction:'restartCoordinator'});});}
try{
  await api('/api/auth/login',{identifier:process.env.ADMIN_USERNAME,password:process.env.ADMIN_PASSWORD});
  const network=await api('/api/admin/networks',{name:'Actual mixed desktop and browser',maxNodes:4});
  expect(new URL(network.joinUrl).origin).toBe(web);
  browser=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'msedge'}:{})});
  const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(network.joinUrl);await page.getByRole('button',{name:'Become a Worker'}).click();
  const browserStatus=page.getByLabel('Worker status');await expect(browserStatus).toHaveText('AVAILABLE',{timeout:30000});
  const browserNode=(await page.locator('.browser-node code').first().textContent()).trim();
  desktop=await _electron.launch({executablePath:resolve('.runtime/windows-worker/releases/win-unpacked/GRID-X Worker.exe'),env:{...process.env,GRID_X_WORKER_DATA_DIR:data},timeout:30000});desktopProcess=desktop.process();
  const window=await desktop.firstWindow();await window.locator('#invitation').fill(network.joinUrl);await window.locator('#consent').check();await window.locator('#enroll').click();
  const nativeStatus=window.locator('#status');await expect(nativeStatus).toHaveText('AVAILABLE',{timeout:30000});
  const nativeNode=(await window.evaluate(()=>window.gridx.snapshot())).nodeId;expect(nativeNode).not.toBe(browserNode);
  const[nodes]=await db.execute('SELECT id,network_id,worker_type FROM nodes WHERE network_id=?',[network.id]);expect(nodes).toHaveLength(2);expect(new Set(nodes.map(node=>node.worker_type))).toEqual(new Set(['BROWSER','NATIVE']));
  const submit=payload=>api('/api/admin/tasks/test',{networkId:network.id,payload});
  // Controlled user-facing pause makes each actual execution attributable.
  await page.getByRole('button',{name:'Pause contribution'}).click();await expect(browserStatus).toHaveText('PAUSED');
  const nativeTask=await submit({operation:'sha256',input:'abc'}),nativeResult=await completed(nativeTask);expect(nativeResult.node).toBe(nativeNode);expect(nativeResult.result.digest).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  await window.locator('#pause').click();await expect(nativeStatus).toHaveText('PAUSED');
  await page.getByRole('button',{name:'Resume contribution'}).click();await expect(browserStatus).toHaveText('AVAILABLE');
  const browserTask=await submit({operation:'prime_count',limit:100}),browserResult=await completed(browserTask);expect(browserResult.node).toBe(browserNode);expect(browserResult.result.count).toBe(25);
  await window.locator('#connect').click();await expect(nativeStatus).toHaveText('AVAILABLE');await expect(browserStatus).toHaveText('AVAILABLE');
  const burst=await Promise.all(Array.from({length:6},(_,index)=>submit({operation:'sha256',input:`mixed-${index}`})));
  for(const task of burst){const result=await completed(task);expect([nativeNode,browserNode]).toContain(result.node);}
  // Browser interruption must preserve attempts and reassign to the native peer.
  await window.locator('#pause').click();await expect(nativeStatus).toHaveText('PAUSED');
  const interrupted=await submit({operation:'sha256_chain',input:'recover on another real platform',iterations:1000000});
  await expect.poll(async()=>(await api('/api/admin/tasks/'+interrupted.id)).status,{timeout:30000,intervals:[50,100]}).toBe('RUNNING');
  await page.getByRole('button',{name:'Pause contribution'}).click();await expect(browserStatus).toHaveText('PAUSED');
  await window.locator('#connect').click();await expect(nativeStatus).toHaveText(/^(AVAILABLE|BUSY)$/,{timeout:30000});
  const recovered=await completed(interrupted);expect(recovered.node).toBe(nativeNode);
  const[attempts]=await db.execute('SELECT node_id,status FROM task_attempts WHERE task_id=? ORDER BY attempt',[interrupted.id]);expect(attempts.length).toBeGreaterThan(1);expect(attempts[0].node_id).toBe(browserNode);expect(attempts[0].status).not.toBe('COMPLETED');
  await page.getByRole('button',{name:'Resume contribution'}).click();await expect(browserStatus).toHaveText('AVAILABLE');
  await restart();await expect(browserStatus).toHaveText('AVAILABLE',{timeout:60000});await expect(nativeStatus).toHaveText('AVAILABLE',{timeout:60000});
  expect((await window.evaluate(()=>window.gridx.snapshot())).nodeId).toBe(nativeNode);expect((await page.locator('.browser-node code').first().textContent()).trim()).toBe(browserNode);
  // Do not accept stale AVAILABLE labels as reconnect proof. Policy routes fresh
  // work to each platform without manually reconnecting either client.
  for(const [workerType,nodeId] of [['NATIVE',nativeNode],['BROWSER',browserNode]]){
    await api('/api/admin/networks/'+network.id+'/policy',{allowedWorkerTypes:[workerType]},'PATCH');
    const final=await completed(await submit({operation:'prime_count',limit:20}));expect(final.node).toBe(nodeId);expect(final.result.count).toBe(8);
  }
  await api('/api/admin/networks/'+network.id+'/policy',{},'PATCH');
  const[reconnected]=await db.execute('SELECT id FROM nodes WHERE network_id=?',[network.id]);expect(reconnected.map(row=>row.id).sort()).toEqual([browserNode,nativeNode].sort());
  expect(errors).toEqual([]);await page.screenshot({path:join(evidence,'mixed-browser.png')});await window.screenshot({path:join(evidence,'mixed-windows.png')});
  await page.getByRole('button',{name:'Leave network'}).click();await expect(page.getByRole('heading',{name:'Join distributed network'})).toBeVisible();
  await window.locator('#leave').click();await expect(nativeStatus).toHaveText('LEFT');
  console.log(JSON.stringify({platforms:['actual browser Web Worker','packaged Windows native worker'],sameCoordinator:true,sameNetwork:true,distinctIdentity:true,persistedResults:true,browserToNativeReassignment:true,coordinatorRestart:true,publicInternet:false,androidIncluded:false}));
}catch(error){failure=error;throw error;}finally{
  const cleanupErrors=[];
  try{if(browser)await browser.close();}catch(error){cleanupErrors.push(error);}
  try{if(desktop){let timer;try{await Promise.race([desktop.close(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Owned mixed desktop close timeout')),20000);})]);}finally{clearTimeout(timer);await terminateOwnedTestProcess(desktopProcess);}}}catch(error){cleanupErrors.push(error);}
  try{await db.end();}catch(error){cleanupErrors.push(error);}
  if(cleanupErrors.length)throw new AggregateError([...(failure?[failure]:[]),...cleanupErrors],'Mixed verification cleanup failed; all cleanup actions were attempted');
}
