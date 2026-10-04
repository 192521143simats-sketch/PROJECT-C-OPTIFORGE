import type { NodeStatus, TaskStatus } from "./index.js";

const nodeTransitions: Record<NodeStatus, readonly NodeStatus[]> = {
  REGISTERING: ["ONLINE", "OFFLINE"],
  ONLINE: ["AVAILABLE", "UNAVAILABLE", "OFFLINE"],
  AVAILABLE: ["BUSY", "UNAVAILABLE", "OFFLINE"],
  BUSY: ["AVAILABLE", "UNAVAILABLE", "OFFLINE"],
  UNAVAILABLE: ["ONLINE", "AVAILABLE", "OFFLINE"],
  OFFLINE: ["ONLINE"]
};

const taskTransitions: Record<TaskStatus, readonly TaskStatus[]> = {
  QUEUED: ["ASSIGNED", "FAILED"],
  ASSIGNED: ["RUNNING", "REQUEUED", "FAILED"],
  RUNNING: ["COMPLETED", "REQUEUED", "FAILED"],
  COMPLETED: [],
  FAILED: ["REQUEUED"],
  REQUEUED: ["ASSIGNED", "FAILED"]
};

export function assertNodeTransition(from: NodeStatus, to: NodeStatus): void {
  if (!nodeTransitions[from].includes(to)) throw new Error(`Invalid node transition ${from} -> ${to}`);
}

export function assertTaskTransition(from: TaskStatus, to: TaskStatus): void {
  if (!taskTransitions[from].includes(to)) throw new Error(`Invalid task transition ${from} -> ${to}`);
}
