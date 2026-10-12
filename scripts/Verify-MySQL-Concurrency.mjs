import mysql from 'mysql2/promise';
import {retryTransaction} from '../apps/coordinator/src/transaction.ts';
import {assertIsolatedTarget,verifyIsolatedCoordinator} from './Integration-Target.mjs';

const target=assertIsolatedTarget();await verifyIsolatedCoordinator(target);
const pool=mysql.createPool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),database:target.database,user:process.env.DB_USER,password:process.env.DB_PASSWORD,connectionLimit:4});
try{
  await pool.query('CREATE TABLE engineering_transaction_probe (id INT PRIMARY KEY, value INT NOT NULL) ENGINE=InnoDB');
  await pool.query('INSERT INTO engineering_transaction_probe VALUES (1,0),(2,0)');
  let arrived=0,release,invocations=0;
  const barrier=new Promise(resolve=>{release=resolve;});
  const change=(first,second)=>{
    let attempt=0;
    return retryTransaction(pool,async connection=>{
      attempt++;invocations++;
      await connection.execute('UPDATE engineering_transaction_probe SET value=value+1 WHERE id=?',[first]);
      if(attempt===1){arrived++;if(arrived===2)release();await barrier;}
      // Opposite lock order intentionally creates a real InnoDB deadlock.
      await connection.execute('UPDATE engineering_transaction_probe SET value=value+1 WHERE id=?',[second]);
    });
  };
  await Promise.all([change(1,2),change(2,1)]);
  const [rows]=await pool.query('SELECT id,value FROM engineering_transaction_probe ORDER BY id');
  if(invocations<3 || rows.length!==2 || rows.some(row=>row.value!==2))throw new Error('Deadlock retry did not preserve exactly-once committed database effects');
  console.log(JSON.stringify({actualInnoDBDeadlockRecovery:'passed',transactionInvocations:invocations,committedRowValues:rows.map(row=>row.value)}));
}finally{await pool.end();}
