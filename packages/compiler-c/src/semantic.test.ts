import {describe,expect,it} from "vitest";
import {compileCFrontend,CSemanticError} from "./frontend.js";
import {parse} from "./parser.js";
import {analyze} from "./semantic.js";

describe("C semantic frontend",()=>{
  it("accepts scoped, typed functions and calls",()=>{const result=compileCFrontend("int add(int a,int b){return a+b;} int main(void){int answer=add(20,22);return answer;}");expect(result.semantic.functions.map(f=>f.name)).toEqual(["add","main"]);expect(result.ast.functions).toHaveLength(2);});
  it("collects actionable semantic diagnostics",()=>{const model=analyze(parse("int f(int x,int x){int bad; int bad; missing=1; return; } int f(void){return 0;}"));expect(model.diagnostics.map(d=>d.code)).toEqual(expect.arrayContaining(["CSEM001","CSEM002","CSEM003","CSEM009","CSEM011"]));});
  it("rejects undefined functions and wrong arity",()=>{expect(()=>compileCFrontend("int main(void){ return absent(1,2); }")).toThrow(CSemanticError);expect(()=>compileCFrontend("int one(int x){return x;} int main(void){return one();}")).toThrow(/expects 1 argument/);});
});
