import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { testTaskSchema, type TestTaskPayload } from "@c-optiforge/contracts";

function primeCount(limit:number){const composite=new Uint8Array(limit+1);let count=0;for(let n=2;n<=limit;n++){if(composite[n]===0){count++;if(n*n<=limit)for(let multiple=n*n;multiple<=limit;multiple+=n)composite[multiple]=1;}}return count;}

export async function execute(payload:TestTaskPayload){
  const validated=testTaskSchema.parse(payload);const started=performance.now();let result:unknown;
  if(validated.operation==="sha256")result={operation:"sha256",digest:createHash("sha256").update(validated.input).digest("hex"),inputBytes:Buffer.byteLength(validated.input)};
  else result={operation:"prime_count",limit:validated.limit,count:primeCount(validated.limit)};
  return {result,executionTimeMs:performance.now()-started};
}
