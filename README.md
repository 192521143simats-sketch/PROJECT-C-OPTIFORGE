# C-OptiForge

C-OptiForge implements the architecture in the authoritative [master specification](./C-OptiForge_MASTER_BUILD_SPEC.md): consent-based distributed workers, persistent MySQL coordinator state, capability- and performance-aware scheduling, failure recovery, and real C, Python, and Java compiler pipelines with downloadable artifacts.

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- Docker Desktop with Docker Compose
- GCC for C artifact generation
- CPython 3 for Python analysis/bytecode generation
- JDK 21 for Java compilation (auto-discovered, or set `COPTIFORGE_JDK_HOME`/`JAVA_HOME`)

## One-command Windows startup

```powershell
START-C-OPTIFORGE.bat
```

The script initializes `.env` with random local credentials on first use, launches Docker Desktop when necessary, waits for Docker Engine, starts the Compose-managed MySQL service, waits for its healthcheck, and then starts the coordinator and dashboard. It is safe to run again while the environment is already running.

Open `http://localhost:5173` for the role selector, `/admin` for coordinator control, `/compile` for compilation, or `/worker` for worker guidance. The generated development admin key is stored in the ignored `.env` file as `ADMIN_API_KEY`.

To stop application processes and the MySQL container without deleting its data:

```powershell
STOP-C-OPTIFORGE.bat
```

MySQL uses database `c_optiforge`, application user `c_optiforge`, host port `3307`, and the Docker named volume `c-optiforge_mysql_data`. Never use `docker compose down -v` unless permanent data deletion is explicitly intended.

1. Create a distributed session.
2. Open the generated participation link in the peer device browser.
3. Review the disclosure and accept.
4. Run the displayed command from a C-OptiForge checkout on that peer device.
5. Wait for the node to become `AVAILABLE` on the dashboard.
6. Use `/compile` to submit C, Python, or Java source, observe the persisted stages, and download the generated artifact.

C jobs lower source into validated function-level IR and distribute optimization before GCC code generation. Python jobs use CPython AST analysis and produce `.pyc`; Java jobs use JDK 21 and produce executable JARs. The scheduler only assigns nodes reporting the required real toolchain and blends current resources with measured historical success and latency.

For another device, set `PUBLIC_BASE_URL` to the browser-reachable web address and `COORDINATOR_PUBLIC_URL` to the worker-reachable coordinator address. When `COORDINATOR_PUBLIC_URL` is omitted, the coordinator derives it from the request host and standard forwarded headers.

## Verification

```powershell
npm run typecheck
npm test
npm run build
# or all three:
npm run verify
```

Architecture and phase details are in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md), [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md), and [docs/MILESTONES.md](./docs/MILESTONES.md). Operational security boundaries are explicit in [docs/SECURITY.md](./docs/SECURITY.md), and verified coverage is recorded in [docs/TEST_REPORT.md](./docs/TEST_REPORT.md).
