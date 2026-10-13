# Phase 4 — portable result integrity

Goal: extend the existing version-1 task/result flow, not replace it. The coordinator must independently recompute the three existing portable operations before publishing a result. Scope: master A:24 and B:6.6. No schema migration, protocol version bump, compiler changes, database reset, or device/package claims.

## Ordered checklist

### Task 1: Verify portable results end-to-end

- [x] Add an isolated MySQL/WebSocket regression that sends a deliberately wrong answer and expects rejection, immutable failed attempts, and no result record. Run it against the unchanged coordinator and record the behavioral failure.
- [x] Implement `verifyPortableResult(payload: unknown, result: unknown): Promise<unknown>` in `apps/coordinator/src/portable-verification.ts`: validate bounded existing task inputs and result shapes, independently recompute SHA-256, hash chains and prime counts, return canonical results with coordinator-generated verification metadata. Yield during expensive recomputation rather than blocking heartbeats.
- [x] Integrate with `Store.completeTask`, checking node/task/attempt/network scope before computation and again atomically before committing. Handle rejected answers through the existing three-attempt retry policy and secret-free audit events; keep stale results distinct from incorrect answers.
- [x] Keep portable verification off the socket's ordered heartbeat queue; reject duplicate concurrent submissions, and retain transaction guards against disconnect/revocation during verification.
- [x] Test real worker execution for valid answers, malformed/forged answers, stale/duplicate and cross-network submissions, retry completion and terminal rejection. Unit tests cover UTF-8, prime boundaries, chain semantics and event-loop responsiveness.
- [x] Run type checks, full tests/builds, the new isolated results suite, and existing platform/compiler integration regressions. Expected: all pass; only owned temporary test fixtures are cleaned up.
- [x] Obtain a fresh code review; fix important findings with reproducing tests. Update status, requirement ledger and evidence; commit and push on the existing engineering branch.

Interfaces: existing bounded `testTaskSchema`, `Store.completeTask`, authenticated protocol-v1 `task_result`, existing `results` JSON and immutable `task_attempts`. The verifier adds evidence to accepted result JSON; it never trusts worker-supplied verification metadata. Rejection reasons go into attempts/audit, never include submitted secrets.

Review focus: replay while verification is in flight; revocation/disconnect during recomputation; malformed metadata; socket heartbeat starvation; transaction failure after verification. Preserve the compiler result path and all existing API contracts.

## Explicit remaining work

This bounded stage does not complete Phase 4: durable leases/cancellation, restart/MySQL-interruption recovery, broader scheduling policies and workload catalogue remain. Recomputed results do not prove worker timing/resource claims, physical-device execution, Byzantine fault tolerance or arbitrary-program equivalence.
