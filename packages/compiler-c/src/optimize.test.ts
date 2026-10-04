import {describe,expect,it} from "vitest";
import {lowerCToIR} from "./lowering.js";
import {optimizeCIR} from "./optimize.js";

describe("C IR optimizations",()=>{
  it("folds constants and removes algebraic identities",()=>{const result=optimizeCIR(lowerCToIR("int main(void){int x=2+3;return x*1+0;}"));const fn=result.ir.functions[0]!;expect(result.report.constantFolds).toBeGreaterThan(0);expect(fn.instructions.some(i=>i.op==="binary")).toBe(false);expect(fn.instructions).toContainEqual(expect.objectContaining({op:"const",value:5}));});
  it("removes unused pure temporary computations but preserves calls",()=>{const result=optimizeCIR(lowerCToIR("int side(void){return 7;} int main(void){2+3;side();return 1;}"));const main=result.ir.functions[1]!;expect(result.report.deadInstructionsRemoved).toBeGreaterThan(0);expect(main.instructions.some(i=>i.op==="call"&&i.callee==="side")).toBe(true);});
  it("does not fold division by zero into a fabricated result",()=>{const fn=optimizeCIR(lowerCToIR("int main(void){return 1/0;}" )).ir.functions[0]!;expect(fn.instructions.some(i=>i.op==="binary"&&i.operator==="/")).toBe(true);});
});
