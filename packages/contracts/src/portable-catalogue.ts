import {z} from "zod";

const uint32=z.number().int().min(0).max(0xffff_ffff);
const boundedMatrix=(entry:z.ZodNumber)=>z.array(z.array(entry).min(1).max(32)).min(1).max(32).refine(rows=>rows.every(row=>row.length===rows[0]!.length),"Matrix rows must have equal length");
const inputMatrix=boundedMatrix(z.number().int().min(-1000).max(1000));
export const matrixMultiplyTaskSchema=z.object({operation:z.literal("matrix_multiply"),left:inputMatrix,right:inputMatrix}).strict().refine(input=>input.left[0]?.length===input.right.length,"Matrix inner dimensions must match");
export const portableBenchmarkTaskSchema=z.object({operation:z.literal("portable_benchmark"),seed:uint32,iterations:z.number().int().min(1).max(1_000_000)}).strict();
export const sha256TaskSchema=z.object({operation:z.literal("sha256"),input:z.string().max(100_000)}).strict();
export const primeCountTaskSchema=z.object({operation:z.literal("prime_count"),limit:z.number().int().min(2).max(2_000_000)}).strict();
export const sha256ChainTaskSchema=z.object({operation:z.literal("sha256_chain"),input:z.string().max(10_000),iterations:z.number().int().min(1).max(10_000_000)}).strict();

const digest=z.string().regex(/^[a-f0-9]{64}$/);
export const sha256ResultSchema=z.object({operation:z.literal("sha256"),digest,inputBytes:z.number().int().min(0).max(400_000)}).strict();
export const primeCountResultSchema=z.object({operation:z.literal("prime_count"),limit:z.number().int().min(2).max(2_000_000),count:z.number().int().min(0).max(2_000_000)}).strict();
export const sha256ChainResultSchema=z.object({operation:z.literal("sha256_chain"),digest,iterations:z.number().int().min(1).max(10_000_000)}).strict();
// At most 32 products of inputs bounded by 1000: |sum| <= 32,000,000.
// Every multiplication and sum is an exact IEEE-754 safe integer.
export const matrixMultiplyResultSchema=z.object({operation:z.literal("matrix_multiply"),matrix:boundedMatrix(z.number().int().min(-32_000_000).max(32_000_000))}).strict();
export const portableBenchmarkResultSchema=z.object({operation:z.literal("portable_benchmark"),seed:uint32,iterations:z.number().int().min(1).max(1_000_000),checksum:uint32}).strict();
export const portableResultSchema=z.discriminatedUnion("operation",[sha256ResultSchema,primeCountResultSchema,sha256ChainResultSchema,matrixMultiplyResultSchema,portableBenchmarkResultSchema]);
export type PortableResult=z.infer<typeof portableResultSchema>;

const verification={method:"independent-recomputation",trustWorkerClaims:false} as const;
const resources=(estimatedWorkingMemoryBytes:number,maxWorkUnits:number,workUnit:string)=>({kind:"estimate" as const,estimatedWorkingMemoryBytes,maxWorkUnits,workUnit,basis:"Working-memory estimate excludes JavaScript/runtime overhead. Work units bound the input or loop count, not CPU instructions, elapsed time or measured performance."});
const requirements=(operationCapability:"browserCompute"|"portableMatrix"|"portableBenchmark")=>({runtime:"portable-js" as const,operationCapability,nativeToolchain:false});

// Schemas are exported so consumers admit inputs and results from the same
// bounded catalogue. Durations are policy ceilings, never promised throughput.
export const portableWorkloadCatalogue={
  sha256:{operation:"sha256",inputSchema:sha256TaskSchema,resultSchema:sha256ResultSchema,requirements:requirements("browserCompute"),estimatedResources:resources(1_048_576,400_000,"UTF-8 input bytes"),executionLimit:{maxDurationMs:30_000,maxInputCodeUnits:100_000},verification},
  prime_count:{operation:"prime_count",inputSchema:primeCountTaskSchema,resultSchema:primeCountResultSchema,requirements:requirements("browserCompute"),estimatedResources:resources(4_194_304,40_000_000,"sieve marks and count visits"),executionLimit:{maxDurationMs:30_000,maxLimit:2_000_000},verification},
  sha256_chain:{operation:"sha256_chain",inputSchema:sha256ChainTaskSchema,resultSchema:sha256ChainResultSchema,requirements:requirements("browserCompute"),estimatedResources:resources(262_144,10_000_000,"SHA-256 digest rounds"),executionLimit:{maxDurationMs:30_000,maxIterations:10_000_000},verification},
  matrix_multiply:{operation:"matrix_multiply",inputSchema:matrixMultiplyTaskSchema,resultSchema:matrixMultiplyResultSchema,requirements:requirements("portableMatrix"),estimatedResources:resources(262_144,32_768,"integer multiply-add pairs"),executionLimit:{maxDurationMs:10_000,maxDimension:32,maxAbsoluteInput:1000},verification},
  portable_benchmark:{operation:"portable_benchmark",inputSchema:portableBenchmarkTaskSchema,resultSchema:portableBenchmarkResultSchema,requirements:requirements("portableBenchmark"),estimatedResources:resources(65_536,1_000_000,"uint32 LCG rounds"),executionLimit:{maxDurationMs:10_000,maxIterations:1_000_000},verification:{...verification,algorithm:"uint32 LCG: state = (1664525 * state + 1013904223) mod 2^32; checksum is the final state. No performance score."}}
} as const;

type DeterministicTask=z.infer<typeof matrixMultiplyTaskSchema>|z.infer<typeof portableBenchmarkTaskSchema>;
// Shared portable executor for native JS and Web Workers only. The coordinator
// uses its separate reference implementation rather than trusting this helper.
export async function executeDeterministicPortable(payload:DeterministicTask,yieldControl:()=>Promise<void>=()=>new Promise(resolve=>setTimeout(resolve,0))){
  const task=payload.operation==="matrix_multiply"?matrixMultiplyTaskSchema.parse(payload):portableBenchmarkTaskSchema.parse(payload);
  const deadline=performance.now()+portableWorkloadCatalogue[task.operation].executionLimit.maxDurationMs;
  const checkpoint=async()=>{await yieldControl();if(performance.now()>deadline)throw new Error("Portable execution time limit exceeded.");};
  if(task.operation==="matrix_multiply"){
    const matrix:number[][]=[];
    for(const row of task.left){
      const output=Array<number>(task.right[0]!.length).fill(0);
      for(let inner=0;inner<row.length;inner++)for(let column=0;column<output.length;column++)output[column]=output[column]!+row[inner]!*task.right[inner]![column]!;
      matrix.push(output);await checkpoint();
    }
    return {operation:task.operation,matrix};
  }
  let checksum=task.seed;
  for(let index=0;index<task.iterations;index++){
    checksum=(Math.imul(1664525,checksum)+1013904223)>>>0;
    if((index+1)%4096===0)await checkpoint();
  }
  await checkpoint();
  return {operation:task.operation,seed:task.seed,iterations:task.iterations,checksum};
}
