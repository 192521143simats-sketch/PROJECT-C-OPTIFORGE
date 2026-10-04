# Java pipeline

This package uses a real JDK 21 toolchain. `javac` performs lexical, syntax, semantic, and type analysis and generates JVM bytecode; `javap -c` supplies the inspectable Java-specific bytecode IR; `jar` produces the final JVM artifact. JDK constant folding is observable in the bytecode representation. This package does not claim native machine-code generation.
