# C-OptiForge Architecture

## Repository assessment

At project start the repository contained only `C-OptiForge_MASTER_BUILD_SPEC.md`. There was no application code, package/build configuration, database, container configuration, test suite, or Git metadata to preserve.

The master specification is the source of truth. The implementation deliberately starts with the real coordinator-to-worker path before any compiler integration.

## Selected stack

- TypeScript monorepo managed with npm workspaces.
- Fastify coordinator with REST APIs and WebSocket channels.
- MySQL 8.4 in Docker Compose with an InnoDB schema and a named persistent volume.
- React and Vite for separate admin, worker-enrollment, and compilation-user routes.
- A Node.js worker agent for honest host capability discovery and task execution.
- Vitest for unit/integration tests and Playwright for later browser end-to-end coverage.
- Structured JSON logging through Fastify/Pino.

The installed host currently has Node.js 26, Python 3.13, Docker, GCC 15, and CMake. It has a Java 8 runtime but no `javac`; Java output generation therefore remains explicitly unavailable until a JDK is installed or supplied through the controlled build container.

## Architectural boundaries

```text
apps/web
  admin UI | worker consent UI | compilation user UI
                         |
                         v
apps/coordinator
  HTTP API | WebSocket gateway | session/node/task services
                         |
              shared orchestration layer
                         |
        scheduler | task manager | result manager
                         |
                         v
apps/worker
  enrollment | capability profiler | heartbeat | executor

packages/compiler-c       C-specific frontend, IR, passes, codegen
packages/compiler-python  Python-specific frontend, IR/bytecode, passes, output
packages/compiler-java    Java-specific frontend, IR, passes, bytecode output
packages/contracts        shared wire/domain contracts only
packages/database         migrations and persistence repositories
```

Compiler representations and passes are not collapsed into a universal compiler. Only distributed task envelopes, scheduling, node management, results, and performance records are shared.

## First milestone protocol

1. Admin creates an active distributed session through an authenticated admin API.
2. Coordinator creates a random, expiring participation token and returns a join URL.
3. Peer opens the join URL; this performs no registration.
4. Peer reads the disclosure and explicitly accepts.
5. Coordinator exchanges the participation token for a short-lived, single-use enrollment credential.
6. The worker agent redeems that credential over WebSocket, reports its real profile, and receives a Node ID plus a scoped worker credential.
7. The worker heartbeats with current resource data. Stale nodes are marked unavailable/offline.
8. Admin creates an allow-listed test task. The scheduler selects a capable available node.
9. Coordinator assigns the task; worker acknowledges, executes the bounded operation, and returns its measured result.
10. Coordinator persists the result and broadcasts real state changes to the dashboard.

The first test executor is deliberately allow-listed (for example SHA-256 or bounded prime counting). It is genuine remote computation, not arbitrary source execution and not presented as compiler optimization.

## Security model for milestone one

- Participation and enrollment tokens are high-entropy, stored as hashes, expire, and are scoped.
- Opening a link never registers a node; acceptance is persisted before enrollment can be redeemed.
- Worker credentials are distinct from admin and compilation-user identities.
- Worker task kinds are allow-listed and payloads are schema-validated.
- Task timeouts and payload limits are enforced.
- Source compilation/execution is not enabled until the sandbox phase; no unrestricted command task exists.
- Source contents and secrets are excluded from logs.

## Open implementation decisions

These are intentionally deferred without changing the required architecture:

- Production MySQL deployment topology and backup policy remain open; the database engine is fixed as MySQL.
- Production sandbox: Linux container isolation with disabled network, cgroup resource limits, read-only base filesystem, and disposable workspaces is the intended baseline. Windows-host production workers require an equivalent container/VM boundary.
- C frontend/IR: likely Clang/LLVM tooling or a deliberately scoped custom frontend plus LLVM IR; decide after the distributed foundation is stable.
- Python representation is now implemented with the installed CPython AST/compiler APIs, bounded AST transformations, optimized-source regeneration, and version-specific `.pyc` output. Distributed Python task integration remains part of the later shared user-to-worker workflow milestone.
- Java frontend: JDK compiler APIs or a parser/analysis library plus real `javac` output generation; a JDK is required.
- Authentication provider and deployment topology remain open. Development uses explicit local admin credentials and scoped worker credentials.

## Genuine constraints, not specification conflicts

- The project originally had no Docker configuration and used a local SQLite file. The persistence layer now uses the required Docker-backed MySQL service; the old SQLite file is preserved but inactive.
- Browser consent cannot safely or accurately profile toolchains or execute native compiler workloads. A native agent is therefore required after browser acceptance.
- No JDK compiler is installed on the current machine. Java compilation must report the missing capability until that prerequisite exists.
- Strong CPU, memory, filesystem, and network isolation is substantially better on a Linux container host than directly on Windows. Compiler execution will not be advertised as safe before that sandbox is implemented and verified.

