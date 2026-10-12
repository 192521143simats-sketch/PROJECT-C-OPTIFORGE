# Runtime foundation verification

Date: 2026-10-12. Baseline commit c099807; engineering branch changes described in PROJECT_STATUS.

## Commands and results

- Initial `npm run verify`: typechecks passed; Java analysis exceeded 5 s; 45/46 tests passed. Failure retained in baseline record.
- `npx vitest run --maxWorkers=2`: 46/46 passed. No production timeout/assertion weakened.
- After runtime implementation `npm run verify`: all workspace typechecks/builds passed; 53/53 Vitest tests plus 2 script tests passed. Subsequent ledger/privacy tests add coverage; final counts are recorded after the final rerun.
- `node --test scripts/*.test.mjs`: 3 tests passed, including lossless source inventory/evidence preservation/source-change rejection.
- `npm run verify:integration`: both platform and artifact verifiers passed in an isolated MySQL 8.4 temporary container, not the development volume.
- Node 24.21.0 LTS binary verified against official HTTPS SHASUMS256.txt: SHA-256 `ba4e6d110e8c1592a1ecd390f6b05f3da124b13871a5be62b341a07a853c6c32`. Official release policy: https://nodejs.org/en/about/previous-releases . Existing Node 26 is Current, not the selected LTS release.
- LTS repeat: all workspace typechecks/builds passed; 53 Vitest + 2 then-current script tests passed; both isolated integration verifiers passed. Instance `447bb908bedd6b6b`; checked-in summary and outputs adjacent.
- Health/readiness DB-failure test first reproduced incorrect HTTP 200 from `/health`; after dependency probe, both routes return safe 503 on failure and recover to 200.

## Scope of live evidence

Platform verifier uses explicitly synthetic logical browser clients/resource profiles, not physical browser/Android evidence. It tests auth/reset, reused legacy network consent, network filtering, stable node IDs/capacity, 10-row page size, interrupted-attempt reassignment and genuine C artifacts. Reusable admission is regression-tested legacy behavior, NOT compliance with M2 R03; single-use invitation redesign remains open.

Artifact verifier starts a real native Node agent, compiles all six supplied samples through actual toolchains, downloads actual persisted artifacts and executes trusted fixture outputs. C: source/native binary/JSON/PDF. Python: source/processed source/pyc/JSON/PDF. Java: source/class/JAR/JSON/PDF. Invalid submissions and missing/unauthorized downloads are checked. This does not prove all language semantics or safe arbitrary-user execution.

Developer DB inventory was read-only (2 users, 2 networks, 3 enrollments/nodes, 5 tasks, 4 jobs, 8 artifacts). Existing SQLite/WAL/SHM and backup preserved. Temporary fixtures were removed only after verifying runner ownership label; no `down -v` or development DB reset occurred.

## Open gates

Clean lockfile install evidence, exhaustive API/security/concurrency coverage, semantic differential tests, versioned protocol/invitations, native execution containment, Windows/Android packaging/signing/hardware, backup restore and deployment remain open. This is a tested foundation milestone, not platform completion.

## Actual failure found during repeat and recovery

Repeat instance `ca23fc8c965b321a`: platform passed, then artifacts failed with connection refused because simultaneous worker closes produced `ER_LOCK_DEADLOCK` (MySQL 1213) in `Store.failOrRequeueNodeTasks`; an unhandled close-handler rejection exited the coordinator. This failure is not discarded.

Added `retryTransaction`: at most three attempts for InnoDB deadlock/lock-wait errors, rollback and release before retry, no retries for constraints/application failures. Background disconnect, task-deadline, heartbeat recovery and admin snapshot promises now have rejection handlers. This avoids process termination, not a claim of comprehensive DB-fault recovery.

Unit coverage checks rollback/release ordering, recovered return values, bounded failures, non-transient rejection, and synchronous/asynchronous background failures. A genuine two-connection opposite-lock-order InnoDB integration forces a deadlock and verifies both final row values are exactly 2 after retry.

After fix: instance `8c51fdf0a465352b` platform/artifacts passed. Instance `91f30acb68366d31` actual InnoDB concurrency + platform + all six artifact cases passed. Safe temporary test ownership/cleanup remained enforced. ADB recheck now detects Redmi M2004J19C, Android API 29, arm64; no native APK installation or device tests have yet occurred.

Final foundation `npm run verify`: exit 0, 57/57 Vitest tests in 20 files, 3/3 script tests, all eight workspace typechecks/builds. No failing test was skipped. Tests explicitly record logical test clients rather than physical workers.
