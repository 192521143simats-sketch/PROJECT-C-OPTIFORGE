# Verification report

Latest verification date: 2026-10-06

Run the complete repeatable check from the repository root with:

```powershell
npm run verify
```

The automated suite contains 45 passing tests in 15 source test files. It covers Argon2id/password policy, contract/state validation, rejection of arbitrary and oversized worker workloads, browser/native capability separation, resource scheduling, historical-performance scoring, C lexing/parsing/semantic analysis/lowering/optimization/aggregation/native code generation, Python AST optimization and genuine `.pyc` execution, Java `javac` diagnostics/bytecode/JAR execution, worker profiling, and allow-listed execution.

`npm run verify:platform` performs a live MySQL/coordinator protocol test: anonymous/invalid/cross-role authentication rejection, admin login, two network creation, different links, reuse of one link by multiple enrollments/nodes, cross-network assignment exclusion, user signup/login, distributed C optimization, genuine artifact download, user history ownership, password reset, old-password rejection, and 10-row server pagination. It produced a genuine 135,922-byte executable in the latest run.

Windows startup was verified with Docker already available, with MySQL stopped, with MySQL already healthy, and by repeated invocation. Compose reuses the named MySQL volume and does not use `down -v`.

`npm audit` reports zero known dependency vulnerabilities. Browser layout remains a manual/device check; security, API, database, scheduler, compiler, and worker-protocol behavior are automated or live integration-tested.
