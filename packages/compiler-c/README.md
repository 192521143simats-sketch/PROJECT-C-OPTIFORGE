# C frontend

This package preserves the language-specific C frontend and adds actual full single-translation-unit GCC compilation. The custom distributed frontend supports `int` and `void` functions, typed parameters and local variables, signed 32-bit integer expressions, assignment, calls, blocks, `if`/`else`, `while`, and `return`. Logical operators short-circuit; code generation emits function prototypes.

It performs real lexical, syntax, and semantic analysis and reports source locations. It is deliberately described as a documented C subset, not a complete ISO C implementation. Pointers, arrays, structs, preprocessor expansion, floating-point types, global declarations, and full C conversions remain explicit future frontend work.

The validated AST lowers to a versioned, C-specific three-address IR with explicit calls, labels, branches, jumps, and returns. Local optimization currently includes constant propagation/folding, safe algebraic identity elimination, and dead pure-temporary removal. Distributed orchestration remains outside this package.

The coordinator decomposes a supported IR module into independent per-function `C_OPTIMIZE_IR` tasks. Browser and native workers advertising IR optimization can perform these tasks; a browser does not need or receive GCC. Returned candidates and measured task times are persisted by the shared orchestration layer. Straight-line dead-temporary removal is disabled on control-flow functions until CFG-aware liveness is implemented.

Completed batches are structurally validated and adaptively select the lowest-cost acceptable function candidates. The selected IR is emitted as C11 and passed to the real GCC compiler/linker; the coordinator build endpoint returns the resulting native executable and labels its platform-specific media type.

Source outside the custom grammar is sent as a `C_COMPILE` task to a native worker
advertising both a C runtime and `operations.nativeCSource`. `compileCSource`
uses actual GCC C11, `-O2 -Wall -Wextra`, including headers, pointers, arrays,
structures, globals and floating point supported by the installed toolchain.
IR-generated source is compiled with `-O0` so its own explicit optimizations remain
separate from GCC's. GCC warnings do not automatically become errors. Both paths
produce actual generated source and native executable bytes, with located
diagnostics. Set `GCC_EXECUTABLE` when GCC is not on PATH.

Scope is one translation unit with installed standard libraries: no uploaded
multi-file project/linker options/dependency manager. Source, time and output
bounds are not OS sandbox containment. Compilation never runs submitted binaries.
