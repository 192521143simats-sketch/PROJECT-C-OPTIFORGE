# Python pipeline

This is a Python-specific pipeline backed by the installed CPython runtime. It performs real CPython parsing and syntax validation, preserves an attributed AST representation, applies bounded AST-level constant/control-flow simplifications, reparses the generated source, and invokes CPython compilation with optimization enabled.

Outputs are optimized Python source and a genuine version-specific `.pyc` artifact. This is intentionally not described as native compilation. The bytecode artifact must run on a compatible CPython version, which is reported with every result.
