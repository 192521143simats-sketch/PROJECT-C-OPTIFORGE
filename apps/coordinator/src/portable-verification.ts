import {createHash} from "node:crypto";
import {setImmediate as yieldToIO} from "node:timers/promises";
import {performance} from "node:perf_hooks";
import {testTaskSchema} from "@c-optiforge/contracts";
import {z} from "zod";

const digest=z.string().regex(/^[a-f0-9]{64}$/);
const resultSchema=z.discriminatedUnion("operation",[
  z.object({operation:z.literal("sha256"),digest,inputBytes:z.number().int().nonnegative()}).strict(),
  z.object({operation:z.literal("prime_count"),limit:z.number().int(),count:z.number().int().nonnegative()}).strict(),
  z.object({operation:z.literal("sha256_chain"),digest,iterations:z.number().int().positive()}).strict()
]);

export class ResultVerificationError extends Error {
  readonly code="RESULT_VERIFICATION_FAILED";
}
export class StaleTaskResultError extends Error {
  readonly code="STALE_TASK_RESULT";
  constructor(){super("The task result no longer belongs to an active authorized attempt.");}
}

// Uses coordinator-known inputs and Node's crypto implementation, never a
// worker's claimed digest/verification flag. Cooperative chunks keep I/O alive.
export async function verifyPortableResult(payload:unknown,result:unknown,signal?:AbortSignal){
  const input=testTaskSchema.safeParse(payload),answer=resultSchema.safeParse(result);
  if(!input.success||!answer.success)throw new ResultVerificationError("Portable result verification failed: invalid result schema.");
  const started=performance.now();
  const checkCancelled=()=>{if(signal?.aborted)throw new ResultVerificationError("Portable result verification timed out or was cancelled.");};
  checkCancelled();
  let expected:z.infer<typeof resultSchema>;
  const task=input.data;
  if(task.operation==="sha256"){
    expected={operation:task.operation,digest:createHash("sha256").update(task.input,"utf8").digest("hex"),inputBytes:Buffer.byteLength(task.input,"utf8")};
  }else if(task.operation==="sha256_chain"){
    let bytes:Uint8Array=Buffer.from(task.input,"utf8");
    for(let iteration=0;iteration<task.iterations;iteration++){
      bytes=createHash("sha256").update(bytes).digest();
      if((iteration+1)%500===0){await yieldToIO();checkCancelled();}
    }
    expected={operation:task.operation,iterations:task.iterations,digest:Buffer.from(bytes).toString("hex")};
  }else{
    // Reference sieve marks composites first, then counts remaining primes.
    const composite=new Uint8Array(task.limit+1);
    for(let divisor=2;divisor*divisor<=task.limit;divisor++){
      if(composite[divisor])continue;
      for(let multiple=divisor*divisor;multiple<=task.limit;multiple+=divisor)composite[multiple]=1;
      await yieldToIO();checkCancelled();
    }
    let count=0;
    for(let value=2;value<=task.limit;value++){
      if(!composite[value])count++;
      if(value%8192===0){await yieldToIO();checkCancelled();}
    }
    expected={operation:task.operation,limit:task.limit,count};
  }
  checkCancelled();
  // Property order is irrelevant; every required value must match exactly.
  for(const key of Object.keys(expected) as (keyof typeof expected)[]){
    if(answer.data[key]!==expected[key])throw new ResultVerificationError("Portable result verification failed: answer differs from independent recomputation.");
  }
  return {...expected,verification:{status:"VERIFIED",method:"independent-recomputation",version:1,verifiedAt:new Date().toISOString(),verificationTimeMs:performance.now()-started}};
}
