import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';

const [id,status,evidence,implementation,verification]=process.argv.slice(2);
if(!id || !['NOT_STARTED','IMPLEMENTED','VERIFIED','FAILED','BLOCKED'].includes(status) || !evidence || !implementation || !verification) throw new Error('Usage: node scripts/Update-Requirement-Ledger.mjs <exact-id> <status> <evidence-file> <implementation> <verification>');
if(!existsSync(resolve(evidence))) throw new Error('Evidence file does not exist');
const path=resolve('docs/engineering/REQUIREMENT_LEDGER.json'),ledger=JSON.parse(readFileSync(path,'utf8'));
const item=ledger.items.find(item=>item.id===id);
if(!item) throw new Error(`Unknown source-qualified requirement ${id}`);
item.status=status;item.implementation=implementation;item.verification=verification;
if(!item.evidence.includes(evidence))item.evidence.push(evidence);
writeFileSync(path,JSON.stringify(ledger,null,2)+'\n');
console.log(`${id}: ${status}`);
