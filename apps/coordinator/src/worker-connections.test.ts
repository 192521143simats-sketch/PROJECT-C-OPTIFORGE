import {expect,it} from "vitest";
import {WorkerConnections} from "./worker-connections.js";
it("finishes old connection cleanup before same-enrollment registration without blocking other enrollments",async()=>{
  const gate=new WorkerConnections(),order:string[]=[];let release!:()=>void;
  const pending=new Promise<void>(resolve=>{release=resolve;});
  const closing=gate.run("enrollment-a",async()=>{order.push("cleanup-start");await pending;order.push("cleanup-finish");});
  await Promise.resolve();const register=gate.run("enrollment-a",async()=>{order.push("registered");});
  await gate.run("enrollment-b",async()=>{order.push("other-enrollment");});
  expect(order).toEqual(["cleanup-start","other-enrollment"]);release();await Promise.all([closing,register]);expect(order).toEqual(["cleanup-start","other-enrollment","cleanup-finish","registered"]);
});
it("releases failed connection operations so reconnect is not permanently blocked",async()=>{const gate=new WorkerConnections();await expect(gate.run("a",async()=>{throw new Error("database interrupted");})).rejects.toThrow("database interrupted");expect(await gate.run("a",async()=>42)).toBe(42);});
