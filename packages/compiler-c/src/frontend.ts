import {lex} from "./lexer.js";
import {parse} from "./parser.js";
import {analyze,type SemanticDiagnostic} from "./semantic.js";

export class CSemanticError extends Error{constructor(readonly diagnostics:SemanticDiagnostic[]){super(diagnostics.map(d=>`${d.code}: ${d.message} at ${d.span.start.line}:${d.span.start.column}`).join("\n"));this.name="CSemanticError";}}
export function compileCFrontend(source:string){const tokens=lex(source),ast=parse(source),semantic=analyze(ast);if(semantic.diagnostics.length)throw new CSemanticError(semantic.diagnostics);return{language:"c" as const,tokens,ast,semantic};}
