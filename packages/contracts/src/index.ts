import { z } from "zod";

export const nodeStatuses = ["REGISTERING", "ONLINE", "AVAILABLE", "BUSY", "UNAVAILABLE", "OFFLINE"] as const;
export type NodeStatus = (typeof nodeStatuses)[number];
export const taskStatuses = ["QUEUED", "ASSIGNED", "RUNNING", "COMPLETED", "FAILED", "REQUEUED"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const capabilitySchema = z.object({
  cpuModel: z.string().min(1).max(300),
  logicalCores: z.number().int().positive().max(1024),
  totalMemoryBytes: z.number().nonnegative(),
  operatingSystem: z.string().min(1).max(200),
  architecture: z.string().min(1).max(50),
  runtimes: z.object({ c: z.boolean(), python: z.boolean(), java: z.boolean() })
});
export type CapabilityProfile = z.infer<typeof capabilitySchema>;

export const resourceSchema = z.object({
  cpuUtilizationPercent: z.number().min(0).max(100),
  freeMemoryBytes: z.number().nonnegative(),
  memoryUtilizationPercent: z.number().min(0).max(100),
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
  z.object({ operation: z.literal("prime_count"), limit: z.number().int().min(2).max(2_000_000) })
]);
export type TestTaskPayload = z.infer<typeof testTaskSchema>;

export type CoordinatorMessage =
  | { type: "registered"; nodeId: string; workerToken: string; heartbeatIntervalMs: number }
  | { type: "task_assignment"; taskId: string; attempt: number; taskKind: "TEST_COMPUTE"; payload: TestTaskPayload }
  | { type: "error"; code: string; message: string };

export function parseWorkerMessage(value: unknown) {
  return workerMessageSchema.parse(value);
}
