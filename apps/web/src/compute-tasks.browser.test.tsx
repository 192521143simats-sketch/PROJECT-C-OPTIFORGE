// @vitest-environment jsdom
import React,{act} from "react";
import {createRoot,type Root} from "react-dom/client";
import {afterEach,describe,expect,it,vi} from "vitest";
import {ComputeTasks} from "./compute-tasks.js";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root|undefined;
afterEach(async()=>{if(root)await act(async()=>root!.unmount());root=undefined;document.body.replaceChildren();vi.unstubAllGlobals();});
const json=(body:unknown)=>new Response(JSON.stringify(body),{headers:{"content-type":"application/json"}});
async function render(){const host=document.createElement("div");document.body.append(host);root=createRoot(host);await act(async()=>root!.render(<ComputeTasks/>));return host;}
async function submit(host:HTMLElement){await act(async()=>host.querySelector("form")!.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})));}
async function parameters(host:HTMLElement,value:string){const field=host.querySelector("textarea")!;await act(async()=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")!.set!.call(field,value);field.dispatchEvent(new Event("input",{bubbles:true}));});}

// Actual React UI and api() are exercised; only HTTP transport uses explicit fixtures.
describe("compute tasks in React DOM",()=>{
  it.each(["COMPLETED","RUNNING"])("keeps the newly submitted task B selected when its state is %s",async(status)=>{
    const tasks:Record<string,any>={
      "fixture-A":{id:"fixture-A",status:"COMPLETED",operation:"sha256",attempt:1,createdAt:"2026-10-14T00:00:00Z",attempts:[],result:{result:{sha256:"result-A"},executionTimeMs:1}},
      "fixture-B":{id:"fixture-B",status,operation:"sha256",attempt:1,createdAt:"2026-10-14T00:01:00Z",attempts:[],result:status==="COMPLETED"?{result:{sha256:"result-B"},executionTimeMs:2}:null}
    };
    const admitted:string[]=[],cancelled:string[]=[];
    vi.stubGlobal("fetch",async(path:string,options:RequestInit)=>{
      if(path==="/api/tasks/catalogue")return json({items:[]});
      if(path==="/api/compute/tasks"&&options.method==="POST"){const id=admitted.length?"fixture-B":"fixture-A";admitted.push(id);return json({id,status:"QUEUED"});}
      if(path.startsWith("/api/compute/tasks?page="))return json({items:admitted.map(id=>tasks[id]),page:1,pageSize:10,totalItems:admitted.length,totalPages:admitted.length?1:0});
      if(path.endsWith("/cancel")){const id=path.split("/").at(-2)!;cancelled.push(id);tasks[id].status="CANCELLED";return json({status:"CANCELLED"});}
      const task=tasks[path.split("/").at(-1)!];if(task)return json(task);
      throw new Error(`Unexpected fixture request: ${path}`);
    });
    const host=await render();await submit(host);
    const current=()=>Array.from(host.querySelectorAll(".card")).find(card=>card.querySelector("h2")?.textContent==="Current compute task")!;
    expect(current().querySelector("code")?.textContent).toBe("fixture-A");expect(current().textContent).toContain("result-A");
    await submit(host);
    expect(current().querySelector("code")?.textContent).toBe("fixture-B");expect(current().textContent).not.toContain("result-A");
    if(status==="COMPLETED")expect(current().textContent).toContain("result-B");
    else{const cancel=Array.from(current().querySelectorAll("button")).find(button=>button.textContent==="Cancel compute task")!;expect(cancel).toBeDefined();await act(async()=>cancel.click());expect(cancelled).toEqual(["fixture-B"]);expect(current().textContent).toContain("CANCELLED");}
  });
  it.each([{input:"{",message:/valid JSON/},{input:'{"operation":"prime_count","limit":10}',message:/selected workload/}])("rejects invalid workload parameters before HTTP submission: $input",async({input,message})=>{
    let posts=0;vi.stubGlobal("fetch",async(path:string,options:RequestInit)=>{if(options.method==="POST")posts++;return json(path==="/api/tasks/catalogue"?{items:[]}:{items:[],page:1,pageSize:10,totalItems:0,totalPages:0});});
    const host=await render();await parameters(host,input);await submit(host);
    expect(host.querySelector('[role="alert"]')?.textContent).toMatch(message);expect(posts).toBe(0);expect(host.querySelector<HTMLButtonElement>("form button")?.disabled).toBe(false);
  });
  it("blocks duplicate same-turn submissions and recovers after the HTTP error",async()=>{
    let posts=0,resolve!:(value:Response)=>void;vi.stubGlobal("fetch",async(path:string,options:RequestInit)=>{
      if(options.method==="POST"){posts++;return new Promise<Response>(done=>resolve=done);}
      return json(path==="/api/tasks/catalogue"?{items:[]}:{items:[],page:1,pageSize:10,totalItems:0,totalPages:0});
    });
    const host=await render();await act(async()=>{host.querySelector("form")!.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));host.querySelector("form")!.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));});
    expect(posts).toBe(1);expect(host.querySelector("form")?.getAttribute("aria-busy")).toBe("true");
    await act(async()=>resolve(new Response(JSON.stringify({error:{message:"Fixture service unavailable"}}),{status:503,headers:{"content-type":"application/json"}})));
    expect(host.querySelector('[role="alert"]')?.textContent).toBe("Fixture service unavailable");expect(host.querySelector<HTMLButtonElement>("form button")?.disabled).toBe(false);
  });
});
