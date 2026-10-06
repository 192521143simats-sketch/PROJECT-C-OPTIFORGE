import { z } from "zod";

export const nodeStatuses = ["REGISTERING", "ONLINE", "AVAILABLE", "BUSY", "UNAVAILABLE", "OFFLINE"] as const;
export type NodeStatus = (typeof nodeStatuses)[number];
export const taskStatuses = ["QUEUED", "ASSIGNED", "RUNNING", "COMPLETED", "FAILED", "REQUEUED"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const capabilitySchema = z.object({
  workerType: z.enum(["NATIVE","BROWSER"]),
  deviceType: z.enum(["DESKTOP","LAPTOP","PHONE","TABLET","SERVER","UNKNOWN"]),
  cpuModel: z.string().min(1).max(300),
  logicalCores: z.number().int().positive().max(1024),
  totalMemoryBytes: z.number().nonnegative(),
  operatingSystem: z.string().min(1).max(200),
  architecture: z.string().min(1).max(50),
  runtimes: z.object({ c: z.boolean(), python: z.boolean(), java: z.boolean() }),
  toolchains: z.object({
    c: z.object({ available: z.boolean(), version: z.string().max(300).optional() }),
    python: z.object({ available: z.boolean(), version: z.string().max(300).optional() }),
    java: z.object({ available: z.boolean(), version: z.string().max(300).optional() })
  }),
  operations: z.object({irOptimization:z.boolean(),staticAnalysis:z.boolean(),browserCompute:z.boolean(),nativeCompilation:z.boolean()})
});
export type CapabilityProfile = z.infer<typeof capabilitySchema>;

export const resourceSchema = z.object({
  cpuUtilizationPercent: z.number().min(0).max(100),
  cpuMeasurementAvailable: z.boolean().optional(),
  freeMemoryBytes: z.number().nonnegative(),
  memoryUtilizationPercent: z.number().min(0).max(100),
  memoryMeasurementAvailable: z.boolean().optional(),
  observedAt: z.string().datetime()
});
export type ResourceSnapshot = z.infer<typeof resourceSchema>;

export const registerMessageSchema = z.object({
  type: z.literal("register"),
  profile: capabilitySchema
});
export const heartbeatMessageSchema = z.object({
  type: z.literal("heartbeat"),
  resources: resourceSchema
});
export const taskStateMessageSchema = z.object({
  type: z.literal("task_state"),
  taskId: z.string(),
  attempt: z.number().int().positive(),
  status: z.enum(["RUNNING", "FAILED"]),
  error: z.string().max(2000).optional()
});
export const taskResultMessageSchema = z.object({
  type: z.literal("task_result"),
  taskId: z.string(),
  attempt: z.number().int().positive(),
  result: z.unknown(),
  executionTimeMs: z.number().nonnegative(),
  resources: resourceSchema
});
export const disconnectMessageSchema = z.object({ type: z.literal("disconnect") });
export const workerMessageSchema = z.discriminatedUnion("type", [
  registerMessageSchema,
  heartbeatMessageSchema,
  taskStateMessageSchema,
  taskResultMessageSchema,
  disconnectMessageSchema
]);

export const testTaskSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("sha256"), input: z.string().max(100_000) }),
  z.object({ operation: z.literal("prime_count"), limit: z.number().int().min(2).max(2_000_000) }),
  z.object({ operation: z.literal("sha256_chain"), input: z.string().max(10_000), iterations: z.number().int().min(1).max(10_000_000) })
]);
export type TestTaskPayload = z.infer<typeof testTaskSchema>;

const irValue=z.string().min(1).max(200);
const irInstructionSchema=z.discriminatedUnion("op",[
  z.object({op:z.literal("const"),dest:irValue,value:z.number()}),z.object({op:z.literal("copy"),dest:irValue,source:irValue}),
  z.object({op:z.literal("unary"),dest:irValue,operator:z.enum(["+","-","!"]),operand:irValue}),z.object({op:z.literal("binary"),dest:irValue,operator:z.string().max(8),left:irValue,right:irValue}),
  z.object({op:z.literal("call"),dest:irValue.nullable(),callee:z.string().min(1).max(200),arguments:z.array(irValue).max(128)}),z.object({op:z.literal("label"),name:irValue}),
  z.object({op:z.literal("branch"),condition:irValue,thenLabel:irValue,elseLabel:irValue}),z.object({op:z.literal("jump"),target:irValue}),z.object({op:z.literal("return"),value:irValue.nullable()})
]);
export const cIrFunctionSchema=z.object({name:z.string().min(1).max(200),returnType:z.enum(["int","void"]),parameters:z.array(z.object({name:z.string().max(200),type:z.enum(["int","void"]),value:irValue})).max(128),instructions:z.array(irInstructionSchema).max(100_000)});
export const cOptimizationTaskSchema=z.object({operation:z.literal("c_optimize_ir"),function:cIrFunctionSchema});
export const pythonCompileTaskSchema=z.object({operation:z.literal("python_compile"),source:z.string().min(1).max(1_000_000)});
export const javaCompileTaskSchema=z.object({operation:z.literal("java_compile"),source:z.string().min(1).max(1_000_000)});
export const workPayloadSchema=z.union([testTaskSchema,cOptimizationTaskSchema,pythonCompileTaskSchema,javaCompileTaskSchema]);
export type WorkPayload=z.infer<typeof workPayloadSchema>;

export type CoordinatorMessage =
  | { type: "registered"; nodeId: string; heartbeatIntervalMs: number }
  | { type: "task_assignment"; taskId: string; attempt: number; taskKind: "TEST_COMPUTE"|"C_OPTIMIZE_IR"|"PYTHON_COMPILE"|"JAVA_COMPILE"; payload: WorkPayload }
  | { type: "error"; code: string; message: string };

export function parseWorkerMessage(value: unknown) {
  return workerMessageSchema.parse(value);
}
