import {z} from "zod";

const resourcePolicyFields={
  maxTaskDurationMs:z.number().int().min(1).max(3_600_000).optional(),
  minBatteryPercent:z.number().min(0).max(100).optional(),
  wifiOnly:z.boolean().optional(),
  chargingOnly:z.boolean().optional(),
  maxCpuPercent:z.number().min(1).max(100).optional(),
  maxMemoryBytes:z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  thermalProtection:z.boolean().optional(),
  allowBackground:z.boolean().optional()
};
export const contributionPolicySchema=z.strictObject({enabled:z.boolean().optional(),...resourcePolicyFields});
export type ContributionPolicy=z.infer<typeof contributionPolicySchema>;

export const networkPolicySchema=z.strictObject({
  allowedWorkerTypes:z.array(z.enum(["NATIVE","BROWSER","ANDROID"])).max(3).optional(),
  allowedPlatforms:z.array(z.string().min(1).max(200)).max(30).optional(),
  allowedTaskKinds:z.array(z.enum(["TEST_COMPUTE","C_OPTIMIZE_IR","C_COMPILE","PYTHON_COMPILE","JAVA_COMPILE"])).max(20).optional(),
  allowedOperations:z.array(z.enum(["sha256","prime_count","sha256_chain","c_optimize_ir","c_compile","python_compile","java_compile","matrix_multiply","portable_benchmark"])).max(30).optional(),
  minReliability:z.number().min(0).max(1).optional(),
  ...resourcePolicyFields
});
export type NetworkPolicy=z.infer<typeof networkPolicySchema>;
