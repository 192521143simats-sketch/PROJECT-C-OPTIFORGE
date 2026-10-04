import dotenv from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot=resolve(fileURLToPath(new URL("../../../",import.meta.url)));
dotenv.config({path:resolve(projectRoot,".env")});
function integer(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

export const config = {
  host: process.env.HOST ?? "0.0.0.0",
  port: integer("PORT", 4100),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "http://localhost:5173",
  coordinatorPublicUrl: process.env.COORDINATOR_PUBLIC_URL,
  adminApiKey: process.env.ADMIN_API_KEY ?? "development-admin-key",
  database: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: integer("DB_PORT", 3307),
    name: process.env.DB_NAME ?? "c_optiforge",
    user: process.env.DB_USER ?? "c_optiforge",
    password: process.env.DB_PASSWORD ?? ""
  },
  heartbeatStaleMs: integer("HEARTBEAT_STALE_MS", 15_000),
  heartbeatOfflineMs: integer("HEARTBEAT_OFFLINE_MS", 30_000),
  taskTimeoutMs: integer("TASK_TIMEOUT_MS", 30_000)
  ,projectRoot
};

if (!config.database.password) throw new Error("DB_PASSWORD is required. Run START-C-OPTIFORGE.bat to initialize .env.");
