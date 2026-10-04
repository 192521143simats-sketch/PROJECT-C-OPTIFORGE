# Operations guide

## Start and stop

From the repository root, run `START-C-OPTIFORGE.bat`. It locates or starts Docker Desktop, polls `docker info`, starts the existing Compose services, waits for the MySQL healthcheck, and starts the application only after its dependency is healthy. Repeated starts reuse healthy services. Run `STOP-C-OPTIFORGE.bat` to stop application processes and containers without deleting the named database volume.

MySQL is `c_optiforge` on host port 3307 by default. Container-to-container clients must use Compose service hostname `mysql` and port 3306; host processes use the configured `DB_HOST` and `DB_PORT`. Credentials stay in ignored `.env` variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.

## Normal workflow

Create an active session in `/admin`, open the participation link on the worker, accept the disclosure, and run its generated command. Confirm the node is `AVAILABLE`, then submit source from `/compile`. A successful job exposes its genuine artifact download. The admin view reports real heartbeat resources, attempts, scheduler score, measured execution time, results, and failures.

## Troubleshooting

- Docker timeout: open Docker Desktop once and inspect its engine error, then rerun the start script.
- MySQL unhealthy: run `docker compose ps` and `docker compose logs mysql`; do not remove the named volume.
- No eligible worker: confirm the worker is online and its profiler reports the required C, Python, or Java toolchain.
- JDK unavailable: set `COPTIFORGE_JDK_HOME` or `JAVA_HOME` to the JDK 21 directory and restart the worker.
- Stale worker: the coordinator marks it unavailable/offline and requeues unfinished work; restart the agent with a new enrollment if its token is no longer valid.

Run `npm run verify` after changes. Never use `docker compose down -v` during normal operation because it deletes persistent database data.
