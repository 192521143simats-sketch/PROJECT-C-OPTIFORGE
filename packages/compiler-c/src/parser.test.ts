import {describe,expect,it} from "vitest";
import {parse} from "./parser.js";

describe("C parser",()=>{
  it("builds a structured AST and honors expression precedence",()=>{const ast=parse("int add(int a, int b) { int total = a + b * 2; return total; }");expect(ast.functions[0]).toMatchObject({name:"add",returnType:"int",parameters:[{name:"a",type:"int"},{name:"b",type:"int"}],body:{statements:[{kind:"VariableDeclaration",initializer:{kind:"BinaryExpression",operator:"+",right:{operator:"*"}}},{kind:"ReturnStatement"}]}});});
  it("parses control flow, calls, and assignments",()=>{const ast=parse("int main(void){ int x=0; while(x<3){ x=x+1; } if(x==3) return helper(x); else return 0; }");expect(ast.functions[0]?.body.statements.map(s=>s.kind)).toEqual(["VariableDeclaration","WhileStatement","IfStatement"]);});
  it("reports syntax errors at their source location",()=>{expect(()=>parse("int main( { return 0; }")).toThrow(/Expected type specifier at 1:11/);});
});
