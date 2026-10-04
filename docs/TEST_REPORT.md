# Verification report

Verification date: 2026-10-04

Run the complete repeatable check from the repository root with:

```powershell
npm run verify
```

The automated suite contains 42 passing tests in 14 test files. It covers contract/state validation, rejection of arbitrary and oversized worker workloads, capability/resource scheduling, historical-performance scoring, C lexing/parsing/semantic analysis/lowering/optimization/aggregation/native code generation, Python AST optimization and genuine `.pyc` execution, Java `javac` diagnostics/bytecode/JAR execution, worker profiling, and allow-listed execution.

Integration and failure scenarios verified against MySQL and real coordinator/worker processes include consent acceptance and one-time enrollment, node registration and heartbeat, task assignment/result persistence, interrupted-worker task requeue and assignment to another node, stale heartbeat recovery, C function-level distributed optimization and native executable download, and Python/Java distributed compilation with genuine downloadable artifacts. No fake workers, timings, or artifacts were used.

Windows startup was verified with Docker already available, with MySQL stopped, with MySQL already healthy, and by repeated invocation. Compose reuses the named MySQL volume and does not use `down -v`.

The final link-to-download demonstration is recorded separately in `FINAL_DEMO.md` after its final run. Browser layout checks remain manual; API and compiler behavior are automated or integration-tested.
