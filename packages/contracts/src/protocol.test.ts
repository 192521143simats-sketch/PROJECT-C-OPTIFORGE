import {describe,expect,it} from "vitest";
import {encodeProtocolMessage,parseCoordinatorMessage,parseWorkerMessage} from "./index.js";

describe("versioned worker protocol",()=>{
  it("rejects missing and unsupported versions before accepting worker commands",()=>{
    for(const protocolVersion of [undefined,0,2,'1']) expect(()=>parseWorkerMessage({type:'disconnect',...(protocolVersion===undefined?{}:{protocolVersion})})).toThrow(/protocol/i);
    expect(parseWorkerMessage(JSON.parse(encodeProtocolMessage({type:'disconnect'})))).toEqual({type:'disconnect',protocolVersion:1});
  });
  it("validates coordinator assignments instead of trusting arbitrary server payloads",()=>{
    const assignment={type:'task_assignment',protocolVersion:1,taskId:'TASK-test',attempt:1,taskKind:'TEST_COMPUTE',payload:{operation:'prime_count',limit:10}};
    expect(parseCoordinatorMessage(assignment)).toEqual(assignment);
    expect(()=>parseCoordinatorMessage({...assignment,payload:{operation:'shell',command:'whoami'}})).toThrow();
    expect(()=>parseCoordinatorMessage({...assignment,attempt:0})).toThrow();
    expect(()=>parseCoordinatorMessage({...assignment,protocolVersion:2})).toThrow(/protocol/i);
    expect(()=>parseCoordinatorMessage({...assignment,taskKind:'JAVA_COMPILE'})).toThrow();
  });
  it("cannot encode a caller-supplied unsupported version",()=>{
    expect(JSON.parse(encodeProtocolMessage({type:'disconnect',protocolVersion:99})).protocolVersion).toBe(1);
  });
});
