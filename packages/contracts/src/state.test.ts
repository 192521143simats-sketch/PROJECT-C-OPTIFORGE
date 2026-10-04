import {describe,expect,it} from "vitest";
import {assertNodeTransition,assertTaskTransition} from "./state.js";

describe("explicit lifecycle guards",()=>{
  it("allows required node transitions",()=>{expect(()=>assertNodeTransition("REGISTERING","ONLINE")).not.toThrow();expect(()=>assertNodeTransition("AVAILABLE","BUSY")).not.toThrow();expect(()=>assertNodeTransition("BUSY","AVAILABLE")).not.toThrow();});
  it("rejects invalid node transitions",()=>expect(()=>assertNodeTransition("OFFLINE","BUSY")).toThrow(/Invalid node transition/));
  it("allows retry and completion task transitions",()=>{expect(()=>assertTaskTransition("RUNNING","REQUEUED")).not.toThrow();expect(()=>assertTaskTransition("RUNNING","COMPLETED")).not.toThrow();});
  it("keeps completed tasks terminal",()=>expect(()=>assertTaskTransition("COMPLETED","REQUEUED")).toThrow(/Invalid task transition/));
});
