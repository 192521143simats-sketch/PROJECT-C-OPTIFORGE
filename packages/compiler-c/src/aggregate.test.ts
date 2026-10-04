import {describe,expect,it} from "vitest";
import {aggregateCOptimization} from "./aggregate.js";
import {lowerCToIR} from "./lowering.js";
import {optimizeCIR} from "./optimize.js";

describe("C result aggregation and adaptive evaluation",()=>{
  it("accepts the cheapest structurally valid worker result",()=>{const original=lowerCToIR("int main(void){return (2+3)+0;}"),optimized=optimizeCIR(original).ir.functions[0]!;const result=aggregateCOptimization(original,[{taskId:"TASK-1",nodeId:"NODE-1",executionTimeMs:2.5,function:optimized,report:{}}]);expect(result.acceptedCandidates).toBe(1);expect(result.evaluations[0]).toMatchObject({accepted:true,taskId:"TASK-1",selectedCost:2});});
  it("rejects a candidate with a changed function identity",()=>{const original=lowerCToIR("int main(void){return 1;}"),altered={...original.functions[0]!,name:"injected"};const result=aggregateCOptimization(original,[{taskId:"TASK-X",nodeId:"NODE-X",executionTimeMs:1,function:altered,report:{}}]);expect(result.acceptedCandidates).toBe(0);expect(result.ir.functions[0]?.name).toBe("main");});
  it("rejects broken control-flow targets",()=>{const original=lowerCToIR("int main(void){int x=1;if(x)return 1;else return 0;}"),broken={...original.functions[0]!,instructions:[{op:"jump" as const,target:"missing"}]};const result=aggregateCOptimization(original,[{taskId:"TASK-X",nodeId:"NODE-X",executionTimeMs:1,function:broken,report:{}}]);expect(result.evaluations[0]?.accepted).toBe(false);});
});
