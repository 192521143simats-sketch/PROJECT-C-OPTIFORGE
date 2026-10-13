import {defineConfig} from "vitest/config";
export default defineConfig({test:{maxWorkers:2,include:["apps/**/*.test.{ts,tsx}","packages/**/*.test.ts"],exclude:["**/dist/**","**/node_modules/**"]}});
