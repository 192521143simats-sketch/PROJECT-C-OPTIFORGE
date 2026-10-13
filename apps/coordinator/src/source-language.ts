type Language="c"|"python"|"java";

/** Conservative recognition only. The selected real compiler remains authoritative
 * for ambiguous/polyglot source; comments and string contents are not evidence. */
export function sourceLanguageMismatch(selected:Language,source:string):string|null {
  const code=source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|#[^\r\n]*|"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'/g,match=>match.replace(/[^\r\n]/g," "));
  const java=/\b(?:class|interface)\s+[\p{L}_$][\p{L}\p{N}_$]*[^{};:()=]*\{/u.test(code);
  // Java methods are nested; only a top-level C function is C evidence.
  // enum and record are deliberately ambiguous (C enums / typedef names).
  let depth=0;const topLevel=Array.from(code,char=>{const outside=depth===0;if(char==="{")depth++;if(char==="}")depth=Math.max(0,depth-1);return outside?char:char==="\n"?"\n":" ";}).join("");
  const c=/\b(?:void|int|long|short|float|double|char)\s+\**\s*[A-Za-z_]\w*\s*\([^{};]*\)\s*\{/.test(topLevel);
  const python=/^\s*(?:async\s+)?def\s+[\p{L}_]\w*\s*\([^{};]*\)\s*(?:->[^\n{};:]+)?\s*(?::|$)/mu.test(code)||/^\s*class\s+[\p{L}_]\w*(?:\([^{};]*\))?\s*:/mu.test(code);
  const detected:Language|null=java?"java":c?"c":python?"python":null;
  return detected&&detected!==selected?`Language mismatch: ${selected.toUpperCase()} is selected, but the source contains ${detected.toUpperCase()} declarations. Select ${detected.toUpperCase()} and use its source-file extension, or submit ${selected.toUpperCase()} code.`:null;
}
