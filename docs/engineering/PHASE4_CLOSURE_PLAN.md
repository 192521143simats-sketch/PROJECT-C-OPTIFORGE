# Phase 4 closure implementation plan

> Execute using superpowers:executing-plans; independent catalogue/policy tasks use superpowers:dispatching-parallel-agents. Behavioral RED → GREEN gates apply.

Goal: satisfy the preserved master Phase 4 task-engine exit criteria without replacing MySQL, worker authentication, compiler pipelines or protocol v1.
Spec: specification/MASTER_PROMPT.txt M2 phase map, A:16–24/29/67, B:6/B:11–12/B:20 Phase4; later reusable-admission override remains authoritative.
Tech: existing TypeScript monorepo, Fastify, MySQL8.4, Docker, React/browser Web Worker, native Node executor.

## Design / scope rulings

This is architectural closure of existing flows. The user explicitly directs autonomous implementation now; no repeated planning approval is requested. Extend existing transactions and append migrations only. Keep the engineering branch, developer data, credentials and volume. No installer/APK or physical-device success is inferred from coordinator logical fixtures (those have separate Phase7–9 acceptance).

Acceptance is versioned evidence against the master requirements, not a promise that future defects never need maintenance. No seal is issued before every Phase4 gate below passes. Platform-specific client UI, installer and native Android foreground lifecycle remain their explicitly ordered later phases; coordinator enforces advertised lifecycle/mobile policy now.

## Ordered checklist and interfaces

1. [x] Cancellable native finalization. RED: abort before/mid actual coordinator compilation must reject and leave no publishable bytes. Extract existing owned child-process lifecycle into orchestration once; worker uses a wrapper, coordinator uses its own entry with existing compilers. Carry AbortSignal through verify/generate, stop on DB-cancel, process-close waits and no secret inheritance. Test actual process descendants and genuine C/Python/Java output.
2. [x] Scheduling policy/reliability. RED: wrong-network/native-spoof/stale/mobile-policy/limits/affinity nodes rejected. Existing selectNode consumes validated policy + task requirements, retains explainable score. Add admin policy API to existing configuration_json; persist decision and observed reliability rather than fabricate measurements. Store assignment rechecks scope/current status/deadline atomically.
3. [x] Persist task policy/retry state. Append 0006 for immutable task deadline/timeout/priority/max attempts and next eligible time, artifact digest. RED: failed task not immediately assignable; reopen preserves backoff. Exponential bounded jitter from stable identity, MySQL time owns eligibility, all timeout/disconnect paths consistent. No-compatible policy has persisted absolute deadline, not reset-on-restart JS state.
4. [x] Portable catalogue. RED: matrix/benchmark unsupported or forged result accepted. Add schema-bounded exact integer matrix and deterministic benchmark to existing worker/browser/verifier. Export actual catalogue requirements, costs as estimates, limits and schemas. Gate new operations by advertised capability; independent reference verification, no shell workloads.
5. [x] Artifact integrity and fault acceptance. RED: altered blob/length/digest must not download; failed publication rolls back. Existing artifacts gain SHA256 and size validation. Owned persistent MySQL fixture tests actual database restart, coordinator restart, cancellation intersecting outage, leases/reassignment/corruption/ownership. Do not mutate developer database or remove any developer volume.
6. [x] Full type checks/tests/builds, isolated compiler/protocol/recovery/enrollment regressions, one fresh whole-change review and fix pass. Map all Phase4 obligations to exact acceptance evidence, then commit/push and verify remote hashes/clean tree. Issue seal only if every gate is genuinely green.

## Closure

All six gates passed. Phase 4 v1 sealed on 2026-10-14 against implementation commit 01f3bd4397613b37e9e894106691113e7dd0ea4d, verified at the requested GitHub origin. See PHASE4_ACCEPTANCE.md and evidence/2026-10-14-phase4-seal/RESULTS.md. Next is Phase 5 web-product implementation/actual browser acceptance, followed by Phase 6 browser lifecycle acceptance.

## Review focus

- Cancellation before finalizer registration or while native child/descendant is alive.
- Retry/absolute deadline expiry during SQL row-lock contention and DB restart.
- Unknown telemetry vs explicit restrictive policy; spoofed native toolchain/browser profiles.
- Forged deterministic result and artifact corruption/partial transaction.
- Ownership, network isolation and policy update racing assignment.

Each requires real behavioral tests. User-requested consent/pause/server faults are not blamed on worker reliability. Production has no fault-control endpoints; fixtures prove their isolated target and container ownership first.
