# C frontend

This package is the language-specific C frontend. It currently supports `int` and `void` functions, typed parameters and local variables, integer expressions, assignment, calls, blocks, `if`/`else`, `while`, and `return`.

It performs real lexical, syntax, and semantic analysis and reports source locations. It is deliberately described as a documented C subset, not a complete ISO C implementation. Pointers, arrays, structs, preprocessor expansion, floating-point types, global declarations, and full C conversions remain explicit future frontend work.

Milestone 16 builds C-specific IR from this validated AST; distributed orchestration remains outside this package.
