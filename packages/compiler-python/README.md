# Python pipeline

This is a Python-specific pipeline backed by the installed CPython runtime. It performs real CPython parsing and syntax validation, preserves an attributed AST representation, applies bounded integer constant arithmetic transformations, reparses the generated source, and invokes CPython compilation with `optimize=0`. Assertions, docstrings and control flow are retained. No submitted expressions are evaluated during optimization. Each actual transformation has a description and original source line.

Outputs are optimized Python source and a genuine version-specific `.pyc` artifact. This is intentionally not described as native compilation. The bytecode artifact must run on a compatible CPython version, which is reported with every result.
