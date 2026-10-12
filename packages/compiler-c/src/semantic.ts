import type {BlockStatement,CType,Expression,FunctionDefinition,Program,Statement} from "./ast.js";
import type {SourceSpan} from "./lexer.js";

export type SemanticDiagnostic={code:string;message:string;span:SourceSpan};
export type FunctionSignature={name:string;returnType:CType;parameterTypes:CType[]};
export type SemanticModel={functions:FunctionSignature[];diagnostics:SemanticDiagnostic[]};

export function analyze(program:Program):SemanticModel{
  const diagnostics:SemanticDiagnostic[]=[],functions=new Map<string,FunctionSignature>();
  const report=(code:string,message:string,span:SourceSpan)=>diagnostics.push({code,message,span});
  for(const fn of program.functions){if(functions.has(fn.name))report("CSEM001",`Function '${fn.name}' is defined more than once`,fn.span);else functions.set(fn.name,{name:fn.name,returnType:fn.returnType,parameterTypes:fn.parameters.map(p=>p.type)});}
  for(const fn of program.functions)analyzeFunction(fn,functions,report);
  return{functions:[...functions.values()],diagnostics};
}

function analyzeFunction(fn:FunctionDefinition,functions:Map<string,FunctionSignature>,report:(code:string,message:string,span:SourceSpan)=>void){
  const scopes:Array<Map<string,CType>>=[new Map()];
  for(const parameter of fn.parameters){if(scopes[0]!.has(parameter.name))report("CSEM002",`Parameter '${parameter.name}' is declared more than once`,parameter.span);else scopes[0]!.set(parameter.name,parameter.type);}
  const lookup=(name:string)=>{for(let i=scopes.length-1;i>=0;i--){const found=scopes[i]!.get(name);if(found)return found;}return undefined;};
  const expressionType=(expression:Expression):CType=>{
    switch(expression.kind){
      case"IntegerLiteral":if(!Number.isInteger(expression.value)||expression.value<0||expression.value>2147483647)report("CSEM013","Integer literal is outside the portable signed int subset; use native GCC compilation",expression.span);return"int";
      case"IdentifierExpression":{const type=lookup(expression.name);if(!type)report("CSEM003",`Use of undeclared identifier '${expression.name}'`,expression.span);return type??"int";}
      case"UnaryExpression":{const type=expressionType(expression.operand);if(type!=="int")report("CSEM004",`Unary '${expression.operator}' requires an int operand`,expression.span);return"int";}
      case"BinaryExpression":{const left=expressionType(expression.left),right=expressionType(expression.right);if(left!=="int"||right!=="int")report("CSEM005",`Binary '${expression.operator}' requires int operands`,expression.span);return"int";}
      case"AssignmentExpression":{const target=lookup(expression.target.name),value=expressionType(expression.value);if(!target)report("CSEM003",`Assignment to undeclared identifier '${expression.target.name}'`,expression.target.span);else if(target!==value)report("CSEM006","Assignment types are incompatible",expression.span);return target??"int";}
      case"CallExpression":{const signature=functions.get(expression.callee),argumentTypes=expression.arguments.map(expressionType);if(!signature){report("CSEM007",`Call to undefined function '${expression.callee}'`,expression.span);return"int";}if(signature.parameterTypes.length!==expression.arguments.length)report("CSEM008",`Function '${expression.callee}' expects ${signature.parameterTypes.length} argument(s), received ${expression.arguments.length}`,expression.span);argumentTypes.forEach((type,index)=>{if(signature.parameterTypes[index]&&signature.parameterTypes[index]!==type)report("CSEM014",`Argument ${index+1} to '${expression.callee}' has incompatible type`,expression.arguments[index]!.span);});return signature.returnType;}
    }
  };
  const statement=(node:Statement):void=>{
    switch(node.kind){
      case"BlockStatement":block(node,true);break;
      case"VariableDeclaration":{const scope=scopes.at(-1)!;if(scope.has(node.name))report("CSEM009",`Variable '${node.name}' is already declared in this scope`,node.span);else scope.set(node.name,node.type);if(node.initializer&&expressionType(node.initializer)!==node.type)report("CSEM010",`Initializer for '${node.name}' has incompatible type`,node.initializer.span);break;}
      case"ReturnStatement":{const actual=node.expression?expressionType(node.expression):"void";if(actual!==fn.returnType||(fn.returnType==="void"&&node.expression))report("CSEM011",`Return statement is incompatible with function return type '${fn.returnType}'`,node.span);break;}
      case"IfStatement":if(expressionType(node.condition)!=="int")report("CSEM015","Condition requires an int value",node.condition.span);statement(node.thenBranch);if(node.elseBranch)statement(node.elseBranch);break;
      case"WhileStatement":if(expressionType(node.condition)!=="int")report("CSEM015","Condition requires an int value",node.condition.span);statement(node.body);break;
      case"ExpressionStatement":if(node.expression)expressionType(node.expression);break;
    }
  };
  const block=(node:BlockStatement,nested:boolean)=>{if(nested)scopes.push(new Map());for(const child of node.statements)statement(child);if(nested)scopes.pop();};
  block(fn.body,false);
  if(fn.returnType!=="void"&&!containsReturn(fn.body))report("CSEM012",`Non-void function '${fn.name}' has no return statement`,fn.span);
}
function containsReturn(statement:Statement):boolean{switch(statement.kind){case"ReturnStatement":return true;case"BlockStatement":return statement.statements.some(containsReturn);case"IfStatement":return containsReturn(statement.thenBranch)||(statement.elseBranch!==null&&containsReturn(statement.elseBranch));case"WhileStatement":return containsReturn(statement.body);default:return false;}}
