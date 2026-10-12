# Phase 3 — genuine compiler correctness

The next dependency-ordered phase is compiler completeness (M2 R06). The user's
2026-10-12 instruction authorizes autonomous execution and one agent per language.
Preserve the existing custom C IR/distributed optimization path; extend single-file
C support using actual GCC on compatible native workers. CPython remains the real
Python parser/compiler and javac/javap/jar remain the actual Java tooling.

Ordered checklist:
- [x] Inspect current repository, architecture, instructions and toolchains.
- [x] C: semantic differential tests, genuine full-source GCC path, diagnostics.
- [x] Python: semantics-preserving bounded transformations and real bytecode.
- [x] Java: real declarations, packages, class diagnostics and main detection.
- [x] Integrate native tasks through the existing versioned worker protocol.
- [x] Produce program-specific success/failure reports and real artifacts.
- [x] Verify toolchain unit tests, all workspace checks/builds and isolated MySQL
  coordinator/native-worker/download flows for all three languages.
- [x] Record evidence, supported scope and remaining gates.

Ownership: each language agent edits only its compiler package. The main agent
owns contracts, coordinator, native worker, report/UI integration and evidence.
No database reset, credential rotation or migration rewrite is authorized.
Task kind is already a VARCHAR: the additive C native task needs no schema change.

Acceptance: actual source/executable/bytecode/JAR bytes, filename and diagnostics
are tied to the submitted job. Failures have useful reports but no counterfeit
usable output. Library Java archives are not labelled runnable. Build reports
never imply submitted programs ran; differential/runtime tests execute only
curated trusted fixtures. Full multi-file builds, external dependencies and
secure arbitrary-program execution are separate capabilities, not implied.
