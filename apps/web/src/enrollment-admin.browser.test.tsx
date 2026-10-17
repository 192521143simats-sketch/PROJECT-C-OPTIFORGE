// @vitest-environment jsdom
import React,{act} from "react";
import {createRoot} from "react-dom/client";
import {expect,it,vi} from "vitest";
import {EnrollmentAdmin} from "./enrollment-admin.js";
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
it("loads pending enrollments and approves only through the administrator endpoint",async()=>{
  const request=vi.fn(async(input:string,init?:RequestInit)=>new Response(JSON.stringify(input.endsWith('/admission')?{requireAdminApproval:true}:init?.method==='POST'?{enrollmentId:'e1',approvalStatus:'APPROVED'}:{items:[{enrollmentId:'e1',workerType:'ANDROID',status:'ACTIVE',approvalStatus:'PENDING',createdAt:'2026-10-16T00:00:00Z'}]}),{headers:{'content-type':'application/json'}}));
  vi.stubGlobal('fetch',request);const host=document.createElement('div'),root=createRoot(host);document.body.append(host);
  try{await act(async()=>root.render(<EnrollmentAdmin networks={[{id:'n1',name:'Lab'}]}/>));expect(host.textContent).toContain('PENDING');const approve=Array.from(host.querySelectorAll('button')).find(button=>button.textContent==='Approve');expect(approve).toBeDefined();await act(async()=>approve!.click());expect(request.mock.calls.some(([path,init])=>path==='/api/admin/enrollments/e1/approval'&&init?.body===JSON.stringify({approved:true}))).toBe(true);}finally{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();}
});
