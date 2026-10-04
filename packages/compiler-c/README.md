# C frontend

This package is the language-specific C frontend. It currently supports `int` and `void` functions, typed parameters and local variables, integer expressions, assignment, calls, blocks, `if`/`else`, `while`, and `return`.

It performs real lexical, syntax, and semantic analysis and reports source locations. It is deliberately described as a documented C subset, not a complete ISO C implementation. Pointers, arrays, structs, preprocessor expansion, floating-point types, global declarations, and full C conversions remain explicit future frontend work.

The validated AST lowers to a versioned, C-specific three-address IR with explicit calls, labels, branches, jumps, and returns. Local optimization currently includes constant propagation/folding, safe algebraic identity elimination, and dead pure-temporary removal. Distributed orchestration remains outside this package.

The coordinator decomposes an IR module into independent per-function `C_OPTIMIZE_IR` tasks. These tasks are accepted only by workers reporting a C toolchain capability; returned optimized functions and measured task times are persisted by the shared orchestration layer.

Completed batches are structurally validated and adaptively select the lowest-cost acceptable function candidates. The selected IR is emitted as C11 and passed to the real GCC compiler/linker; the coordinator build endpoint returns the resulting native executable and labels its platform-specific media type.
