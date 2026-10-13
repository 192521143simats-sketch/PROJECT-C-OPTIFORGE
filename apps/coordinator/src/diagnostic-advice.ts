/** Suggestions are conditional advice derived from actual diagnostics, never a claimed fix. */
export function diagnosticAdvice(message:string):string{
  if(/division by zero|ZeroDivisionError|\/ by zero/i.test(message))return "Check that the divisor or denominator is nonzero before dividing.";
  if(/undeclared|cannot find symbol|not defined|unresolved/i.test(message))return "Check the reported identifier's declaration, spelling and scope; add the required import or dependency if applicable.";
  if(/unused|not used/i.test(message))return "Remove the reported unused value if it is unnecessary, or use it in the intended calculation.";
  if(/uninitialized|might not have been initialized/i.test(message))return "Initialize the reported value on every control-flow path before reading it.";
  if(/SyntaxError|expected|illegal start|invalid syntax|unterminated/i.test(message))return "Check the indicated location and preceding line for missing delimiters or invalid language syntax.";
  if(/IndexError|out of bounds/i.test(message))return "Check the index against the collection length before accessing the element.";
  if(/EOFError/i.test(message))return "The program requested input after standard input ended. Supply the required input or handle end-of-input.";
  if(/ClassNotFound|NoClassDefFound|ModuleNotFound/i.test(message))return "Provide the named runtime dependency in the target environment; compilation alone does not provide external dependencies.";
  return "Review the specific diagnostic and indicated source location; the system has not applied an automatic correction.";
}
