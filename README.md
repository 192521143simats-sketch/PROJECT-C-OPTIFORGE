# C-OptiForge

C-OptiForge is being built from the authoritative [master specification](./C-OptiForge_MASTER_BUILD_SPEC.md). The current implementation targets the first required milestone: consent-based worker enrollment through an admin-generated link, registration, heartbeat, live node state, resource-aware assignment of a real bounded test task, and measured result return.

Compiler pipelines are not implemented yet and the UI labels them accordingly.

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer

## One-command Windows startup

```powershell
START-C-OPTIFORGE.bat
```

The script initializes `.env` with random local credentials on first use, launches Docker Desktop when necessary, waits for Docker Engine, starts the Compose-managed MySQL service, waits for its healthcheck, and then starts the coordinator and dashboard. It is safe to run again while the environment is already running.

Open `http://localhost:5173/admin`. The generated development admin key is stored in the ignored `.env` file as `ADMIN_API_KEY`.

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
6. Send a SHA-256 or prime-count task and inspect the actual result and execution time.

For another device, set `PUBLIC_BASE_URL` to the browser-reachable web address and `COORDINATOR_PUBLIC_URL` to the worker-reachable coordinator address. When `COORDINATOR_PUBLIC_URL` is omitted, the coordinator derives it from the request host and standard forwarded headers.

## Verification

```powershell
npm run typecheck
npm test
npm run build
```

Architecture and phase details are in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) and [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md).
