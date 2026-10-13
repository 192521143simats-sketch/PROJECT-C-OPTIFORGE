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
  QUEUED: ["ASSIGNED", "FAILED", "CANCELLED"],
  ASSIGNED: ["RUNNING", "REQUEUED", "FAILED", "CANCELLED"],
  RUNNING: ["COMPLETED", "REQUEUED", "FAILED", "CANCELLED"],
  COMPLETED: [],
  FAILED: ["REQUEUED"],
  REQUEUED: ["ASSIGNED", "FAILED", "CANCELLED"],
  CANCELLED: []
};

export function assertNodeTransition(from: NodeStatus, to: NodeStatus): void {
  if (!nodeTransitions[from].includes(to)) throw new Error(`Invalid node transition ${from} -> ${to}`);
}

export function assertTaskTransition(from: TaskStatus, to: TaskStatus): void {
  if (!taskTransitions[from].includes(to)) throw new Error(`Invalid task transition ${from} -> ${to}`);
}
