# C-OptiForge research project

The application is named **GRID-X**. C-OptiForge remains the repository and academic project identity: a distributed, resource-aware compiler for hardware-adaptive optimization.

GRID-X provides authenticated administrator and user roles, reusable isolated distributed networks, consent-based browser and native workers, capability-aware scheduling, failure/retry history, and real C, Python, and Java artifact pipelines backed by one Docker-managed MySQL database.

## Start

Requirements: Node.js 22+, npm 10+, Docker Desktop, GCC, CPython 3, and JDK 21 for native Java workers. The browser-worker path requires only a modern browser and cannot provide native compiler toolchains.

```bat
START-C-OPTIFORGE.bat
```

Open `http://localhost:5173`. On the first start, the ignored `.env` receives a random `ADMIN_PASSWORD`; sign in with `ADMIN_USERNAME` and that password. Production deployments should replace the plaintext development fallback with an Argon2id `ADMIN_PASSWORD_HASH` and remove `ADMIN_PASSWORD`.

For a phone or another computer on the same Wi-Fi/LAN, use the `Mobile/LAN` URL printed by `START-C-OPTIFORGE.bat` (for example, `http://192.168.0.5:5173`). Never replace its host with `localhost`: on a phone, `localhost` means the phone itself. The startup process uses the active LAN address when it generates reusable worker join links.

Users select only the language and supply a source filename plus pasted or uploaded source. GRID-X chooses an active compatible network using the same resource-aware score and measured execution history used for worker scheduling. Network choice and compilation history are administrative concerns and are shown in the Admin dashboard. New worker identities are network-scoped (`NODE-A001`, `NODE-A002`, `NODE-B001`, and so on).

```bat
STOP-C-OPTIFORGE.bat
```

Shutdown preserves the `c-optiforge_mysql_data` named volume. Never use `docker compose down -v` during normal operation.

## Workflows

Administrator: sign in → create a distributed network → copy its reusable join link → inspect/revoke workers → monitor paginated tasks/jobs/audit events.

Worker: open `/join/<network-token>` → inspect network and browser permissions → click **Become a Worker** → remain on the worker console. Multiple devices use the same network link and receive separate enrollments/node IDs. No command prompt is needed for browser workers.

User: sign up/sign in → choose an active network → submit C, Python, or Java source → follow persisted progress → download the owned artifact. C IR optimization can use browser workers. Python bytecode and Java compilation require compatible native workers.

## Verification

```powershell
npm run verify
npm run verify:platform   # requires the running Docker/MySQL/coordinator stack
npm audit
```

See [production architecture](./docs/PRODUCTION_PLATFORM.md), [security](./docs/SECURITY.md), [operations](./docs/OPERATIONS.md), and the authoritative [master build specification](./C-OptiForge_MASTER_BUILD_SPEC.md).
