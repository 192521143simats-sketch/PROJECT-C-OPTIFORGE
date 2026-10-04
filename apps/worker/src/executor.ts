import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { testTaskSchema, type TestTaskPayload } from "@c-optiforge/contracts";

function primeCount(limit:number){const composite=new Uint8Array(limit+1);let count=0;for(let n=2;n<=limit;n++){if(composite[n]===0){count++;if(n*n<=limit)for(let multiple=n*n;multiple<=limit;multiple+=n)composite[multiple]=1;}}return count;}

export async function execute(payload:TestTaskPayload){
  const validated=testTaskSchema.parse(payload);const started=performance.now();let result:unknown;
  if(validated.operation==="sha256")result={operation:"sha256",digest:createHash("sha256").update(validated.input).digest("hex"),inputBytes:Buffer.byteLength(validated.input)};
  else if(validated.operation==="prime_count")result={operation:"prime_count",limit:validated.limit,count:primeCount(validated.limit)};
  else{let digest=Buffer.from(validated.input);for(let iteration=0;iteration<validated.iterations;iteration++){digest=createHash("sha256").update(digest).digest();if(iteration>0&&iteration%10_000===0)await new Promise<void>(resolve=>setImmediate(resolve));}result={operation:"sha256_chain",iterations:validated.iterations,digest:digest.toString("hex")};}
  return {result,executionTimeMs:performance.now()-started};
}
