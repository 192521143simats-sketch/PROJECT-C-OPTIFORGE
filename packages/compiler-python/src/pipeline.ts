import {spawn} from "node:child_process";

export type PythonDiagnostic={severity:"error"|"warning";code:string;message:string;line:number|null;column:number|null};
export type PythonCompilation={language:"python";representation:"CPython AST + bytecode";pythonVersion:string;ast:string;optimizedAst:string;optimizedSource:string;bytecode:Buffer;artifactName:string;metrics:{originalAstNodes:number;optimizedAstNodes:number;nodesRemoved:number};diagnostics:PythonDiagnostic[]};
export class PythonFrontendError extends Error{constructor(readonly diagnostics:PythonDiagnostic[]){super(diagnostics.map(d=>`${d.code}: ${d.message}${d.line?` at ${d.line}:${d.column??1}`:""}`).join("\n"));this.name="PythonFrontendError";}}

const pipelineScript=String.raw`
import ast, base64, importlib.util, json, marshal, struct, sys
source=sys.stdin.read()
class Optimizer(ast.NodeTransformer):
    def safe(self,node):
        try:
            value=eval(compile(ast.Expression(node),"<c-optiforge>","eval"),{"__builtins__":{}})
            if type(value) in (int,float,complex,bool,str,bytes,type(None)) and (not hasattr(value,"__len__") or len(value)<=100000):
                return ast.copy_location(ast.Constant(value=value),node)
        except Exception:
            pass
        return node
    def visit_BinOp(self,node):
        node=self.generic_visit(node)
        return self.safe(node) if isinstance(node.left,ast.Constant) and isinstance(node.right,ast.Constant) else node
    def visit_UnaryOp(self,node):
        node=self.generic_visit(node)
        return self.safe(node) if isinstance(node.operand,ast.Constant) else node
    def visit_If(self,node):
        node=self.generic_visit(node)
        if isinstance(node.test,ast.Constant): return node.body if bool(node.test.value) else node.orelse
        return node
    def visit_While(self,node):
        node=self.generic_visit(node)
        if isinstance(node.test,ast.Constant) and not bool(node.test.value): return node.orelse
        return node
try:
    tree=ast.parse(source,filename="program.py",mode="exec",type_comments=True)
    original_dump=ast.dump(tree,annotate_fields=True,include_attributes=True)
    original_nodes=sum(1 for _ in ast.walk(tree))
    optimized=ast.fix_missing_locations(Optimizer().visit(tree))
    optimized_source=ast.unparse(optimized)+"\n"
    compile(optimized,"program.py","exec",optimize=2)
    reparsed=ast.parse(optimized_source,filename="program.py",mode="exec",type_comments=True)
    code=compile(reparsed,"program.py","exec",optimize=2)
    header=importlib.util.MAGIC_NUMBER+struct.pack("<III",0,0,0)
    bytecode=header+marshal.dumps(code)
    optimized_nodes=sum(1 for _ in ast.walk(reparsed))
    print(json.dumps({"ok":True,"pythonVersion":sys.version.split()[0],"ast":original_dump,"optimizedAst":ast.dump(reparsed,annotate_fields=True,include_attributes=True),"optimizedSource":optimized_source,"bytecode":base64.b64encode(bytecode).decode("ascii"),"metrics":{"originalAstNodes":original_nodes,"optimizedAstNodes":optimized_nodes,"nodesRemoved":original_nodes-optimized_nodes},"diagnostics":[]}))
except SyntaxError as error:
    print(json.dumps({"ok":False,"diagnostics":[{"severity":"error","code":"PY_SYNTAX","message":error.msg,"line":error.lineno,"column":error.offset}]}))
`;

export async function compilePython(source:string,pythonExecutable=process.env.PYTHON_EXECUTABLE??"python"):Promise<PythonCompilation>{if(!source.trim())throw new PythonFrontendError([{severity:"error",code:"PY_EMPTY_SOURCE",message:"Python source is empty",line:null,column:null}]);if(Buffer.byteLength(source)>1_000_000)throw new PythonFrontendError([{severity:"error",code:"PY_SOURCE_TOO_LARGE",message:"Python source exceeds 1 MB",line:null,column:null}]);const completed=await runPython(pythonExecutable,source);if(completed.code!==0)throw new Error(`Python compiler process failed: ${completed.stderr||completed.stdout}`);const response=JSON.parse(completed.stdout) as any;if(!response.ok)throw new PythonFrontendError(response.diagnostics);return{language:"python",representation:"CPython AST + bytecode",pythonVersion:response.pythonVersion,ast:response.ast,optimizedAst:response.optimizedAst,optimizedSource:response.optimizedSource,bytecode:Buffer.from(response.bytecode,"base64"),artifactName:"program.pyc",metrics:response.metrics,diagnostics:response.diagnostics};}
function runPython(executable:string,source:string){return new Promise<{code:number;stdout:string;stderr:string}>((resolve,reject)=>{const child=spawn(executable,["-c",pipelineScript],{windowsHide:true}),stdout:Buffer[]=[],stderr:Buffer[]=[];child.stdout.on("data",chunk=>stdout.push(chunk));child.stderr.on("data",chunk=>stderr.push(chunk));child.on("error",reject);child.on("close",code=>resolve({code:code??-1,stdout:Buffer.concat(stdout).toString("utf8"),stderr:Buffer.concat(stderr).toString("utf8")}));child.stdin.end(source);});}
