# Security and execution isolation

C-OptiForge workers accept only the versioned, schema-validated operations defined in `@c-optiforge/contracts`. There is no shell-command task and unknown fields or operations do not become executable commands. Source payloads are limited to 1 MB; synthetic test workloads and C IR structures also have explicit bounds.

The compiler boundary does not run submitted applications. C input is parsed into validated C-OptiForge IR and workers optimize that IR; GCC only compiles coordinator-generated C. Python runs its compiler pipeline with isolated mode (`-I`) and without `site` initialization (`-S`), producing bytecode without importing or executing the submitted module. Java uses `javac`, `javap`, and `jar` to produce bytecode and does not invoke the resulting class or JAR. Compiler subprocesses have a 30-second deadline and an 8 MB diagnostic-output ceiling. Each compilation uses a uniquely created temporary directory which is removed in a `finally` block.

Participation credentials are time-limited, one-use enrollment credentials. Persisted invitation and worker credentials are hashes, not reusable plaintext tokens. Worker messages and results are schema checked, attempts are matched to their assigned node and attempt number, WebSocket payload size is limited, and stale nodes/tasks are recovered by the coordinator. Logs avoid source bodies and credentials.

## Deployment boundary

The current native Windows worker is a trusted-development-node agent, not an OS-level sandbox for hostile multi-tenant code. It does not yet enforce kernel CPU/memory quotas or deny network access at the process level. Because submitted applications are never executed, this is a meaningful baseline, but operators handling hostile input should run each worker inside a disposable container or VM with network disabled, read-only base filesystem, non-root identity, CPU/memory limits, and an isolated temporary volume. That production isolation layer remains an explicit deployment hardening item rather than a simulated feature.

Secrets belong only in the ignored `.env` file or a deployment secret manager. MySQL volumes, database dumps, generated binaries, dependencies, and environment files are excluded from Git.
