# GRID-X master implementation status

## Verified baseline — 2026-10-12

Repository: existing C-OPTIFORGE workspace, origin `192521143simats-sketch/PROJECT-C-OPTIFORGE`. Baseline `c099807a384a036deebc6f8a4f99963ba52710c4`, clean `main`; implementation branch `engineering/grid-x-release-foundation`.

Both attached texts fully read. Preserved master and SHA-256-backed line ledger retain M0–M4 and both full source bodies. This record supersedes historical completion claims for the new cumulative requirements, without deleting historical evidence.

Eight npm workspaces: Fastify coordinator, React/Vite web, Node worker, contracts, orchestration, C, Python and Java compiler packages. Existing features include Argon2id/MySQL sessions, signup/reset, scoped networks/nodes/tasks/attempts, heartbeat/retries, adaptive historical scoring, real language artifacts and authorized downloads. These are foundations, not full release verification.

Checks before source modification:

- `npm audit --json`: zero advisories.
- `npm ls --depth=0`: dependencies installed without reported invalid workspace dependencies.
- `docker compose config --quiet`: valid existing configuration.
- `npm run verify`: typechecks passed; 45/46 tests passed, Java analysis test exceeded 5 seconds under unrestricted concurrency; build not reached.
- `npm run build`: all eight workspace builds passed separately.
- `npx vitest run --maxWorkers=2`: all 46 tests in 16 files passed, 14.25 seconds. Tests run genuine local GCC/CPython/JDK fixtures, not arbitrary user programs.

Environment: Windows, Node 26.8.1 (not LTS), npm 11.19.0, GCC 15.2.0, CPython 3.14.7, JDK 21.0.12.1. Docker Desktop 29.8.2 installed, Linux engine stopped at baseline. Android Studio/JBR installed; SDK `D:\Android\Sdk`, platforms android-37.0, build-tools 36/37, adb available, no connected device. Roughly 8 GB physical RAM with under 1 GB free during audit; build concurrency must be bounded. No Android module, Windows installer or signing evidence exists.

## Data protection

Existing `.env` remains private and unchanged. Existing Compose MySQL 8.4 service and named `c-optiforge_mysql_data` volume are preserved. After starting Docker Desktop, a read-only inventory found 16 tables: users 2, networks 2, enrollments 3, nodes 3, tasks 5, jobs 4, artifacts 8. An unrelated existing `MYSQL` container on port 3306 was observed and left untouched. Neither existing database was reset. Live verifiers now require an isolated database/port and an instance identity from `/ready` before writes.

Ignored historical SQLite files exist under `apps/coordinator/data/` (database/WAL/SHM), alongside an ignored historical MySQL backup in `.runtime/`. No active SQLite dependency was found. Files may contain valuable data; deletion is NOT authorized by routine cleanup. Inspect/backup and request exact deletion approval later.

## Highest-priority audit findings

1. Broad private-LAN CORS is also active in production; all proxy headers trusted; worker/admin WebSocket origin/session checks incomplete.
2. Enrollment uses a reusable join token as admission credential; required single-use atomic invitations are absent (M2 R03).
3. Schema evolution has no version ledger; network code allocation/index and max-node admission have concurrency risks.
4. Worker result validation is shape/identity based, not independent correctness verification. Arbitrary native compiler invocations lack production sandbox containment.
5. C logical operators eagerly lower both operands, contrary to short-circuit semantics; Python safe folding and optimization semantics need adversarial verification.
6. Task leases, cancellation, durable recovery, diagnostics/stage histories and artifact digests need strengthening.
7. Windows desktop installer, Kotlin/Compose Android, generic Compute Tasks UI, configurable Resend/PostHog, release CI/signing/restore/physical-device gates remain open.

## Exact next iteration

Phase 1 implemented and committed as `4988f0f`: bounded test concurrency; strict production HTTPS/origin/hash policy and explicit trusted proxies; HTTP/cookie-WebSocket origin guards; sanitized request URLs; dependency-backed health/readiness; startup readiness and lockfile install; isolated temporary MySQL verifiers; real deadlock retry and background crash fix. Node 24.21.0 portable binary fetched from official nodejs.org and SHA-256 verified, without changing global installation. Clean archive of that commit passed npm ci, all 57 unit/3 script tests, typechecks and builds under LTS.

Phase 2 v1 protocol foundation now implemented and integration-tested: required protocolVersion on worker messages, validated coordinator envelopes and kind/operation pairing, browser/native coherent send/receive, `/version`, graceful incompatible-version close, credential revalidation per message, no endless policy-violation reconnect. Full 60 unit + 3 script tests/build/typechecks passed; isolated InnoDB, protocol, platform and all-language artifact suites passed. Actual result correctness/lease/cancellation gates still open.

Migration foundation implemented: connection-owned MySQL advisory lock, complete frozen artifact checksum/ledger, ordered history validation, rejection of unknown/newer/changed/holey histories, failed migration not marked applied, idempotent existing schema adoption on the lock-owning connection. Full 63 unit + 3 script tests/typechecks/builds and five isolated live suites passed (`70afb29499df1a83`), including concurrent startup and deliberately interrupted actual baseline DDL recovery with data/backfill preservation. Independent review findings fixed and re-reviewed. This is not automatic schema drift detection or transactional DDL rollback; every historical missing-column upgrade path is not yet covered. Developer schema was not migrated; protected 481776-byte dump is retained in `.runtime/backups/gridx-before-domain-migrations-20261012-093442.sql`; restore verification remains open.

Invitation admission foundation implemented: append-only 0002 migration, hashed expiring revocable atomic single-use tokens, explicit consent, information-only old links, per-device scoped cookies/bearers, serialized network/node allocation and capacity reservations. Register/reconnect/leave/revoke share lock order and preserve identity/BUSY state. Review found a real pending-leave/register race; deterministic red/green test and re-review verified the fix. Full 64 unit + 3 script tests, all workspace typechecks/builds and two isolated integration fixtures passed (`1efc1ebdd4df9960`, `6b126f249c94502a`). See `evidence/2026-10-12-invitations/RESULTS.md` for exact scope and limitations. Developer schema/data/secrets remain untouched. Web build is not physical browser acceptance.

Explicit user override subsequently implemented: reusable default link per network, invoked by default, admin revoke/invoke on the same URL, distinct consenting device enrollment and atomic capacity. Revocation closes admission, not private worker authentication. Append-only 0003 fills previously hashed-only networks once without changing worker identities/credentials/data. Full verification and three isolated suites passed; enhanced same-link registration and interrupted token-backfill recovery passed. Admin/join UI built; physical UI/mobile acceptance not claimed. See USER_REQUIREMENT_OVERRIDES.md and evidence/2026-10-12-reusable-links/RESULTS.md. Developer schema was not migrated this turn; normal startup applies 0003.

Exact next task: Phase 3 compiler semantic/differential correctness, beginning with C short-circuit evaluation, then task leases/cancellation/independent result verification and Windows/Android implementations. Append new migration IDs; do not edit adopted artifacts. ADB last detected no device (2026-10-12); earlier Redmi detection does not establish availability now. No APK/package/device installation test or public deployment has occurred. Full platform/release gates remain incomplete.
