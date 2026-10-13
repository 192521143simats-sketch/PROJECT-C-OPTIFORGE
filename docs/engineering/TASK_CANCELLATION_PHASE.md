# Phase 4 — durable cancellation implementation plan

Authority: MASTER_PROMPT.txt B:6.5–6.7 and B:20 Phase 4, existing task/recovery plans. Execute inline using superpowers:executing-plans and test-driven-development. Preserve the dedicated engineering branch and all developer records.

## Design

Extend the existing MySQL task engine with a terminal CANCELLED state. Cancellation must atomically preserve attempt history and prevent assignment, late result publication, retries and compiler finalization. An authenticated owner or administrator can cancel a compilation; administrators can cancel portable tasks. Workers are quarantined and their connection closed after cancellation. Updated native workers terminate an owned child process tree; browser workers terminate their dedicated Web Worker before reconnecting. Protocol v1 receives an additive, capability-negotiated cancellation message, not a second protocol.

## Ordered tasks and acceptance

1. Add real isolated-MySQL cancellation regressions first. Expect failure against the unchanged Store. Append migration 0005 (terminal statuses); implement owner-scoped transactions and publication guards. Test queued/running/completed/idempotent/foreign-owner cases, immutable deadlines/history, stale result and restart.
2. Implement protocol cancellation, controlled native execution cancellation and browser termination. Test actual bounded compute interruption and process-tree cleanup; retain real compiler results and diagnostics. Integrate API and compiler cancel control.
3. Run type checks, unit tests, builds, isolated cancellation/recovery and compiler regressions. Obtain one fresh review, fix important findings with reproducing tests, record evidence, commit and push.

Interfaces: migrations → Store terminal predicates → authenticated cancellation APIs → worker sockets → native/browser executors → existing compiler UI. All consumers recognize CANCELLED. Transaction code has no external side effects; network sends follow commit. Cancellation versus creation/publication must lock the same job row.

Review focus: cancellation before decomposition, result publication racing cancellation, terminal-state overwrite, retry resurrection, owned child descendants, reconnect advertising availability before termination, authorization, protocol compatibility.

## Remaining full-Phase-4 backlog

This stage alone does not close the full master phase: broader resource/network policies, durable jitter/backoff, deterministic matrix/benchmark catalogue, artifact integrity and database-restart acceptance remain independently verifiable gates. Phase 5 is the web product; Phase 6 is full browser-worker lifecycle acceptance.

## Cleanup / rulings

- Ruling: work in the existing dedicated engineering branch as directed by DECISIONS.md; no replacement checkout or dependency duplication.
- Project-only cleanup identified reproducible preview PDFs/PNGs under .runtime. The execution policy rejected the removal command; no deletion occurred. Preserve source tests, samples, evidence, backups, runtime/toolchains, .env and MySQL volumes. No C-drive-wide cleanup is authorized.

## Progress and review rulings

- Durable cancellation, owner/admin APIs, protocol negotiation, native/browser propagation and compiler cancel control implemented. Cancelled jobs cannot create more tasks or publish final artifacts. Completed history remains unchanged.
- Fresh review found an Important Windows termination defect: a PATH-dependent taskkill failure killed only the Node parent. A genuine GCC-built descendant fixture reproduced it. Explicit System32 tree termination now passes; unconfirmed termination/cleanup stops the worker. Four native-controller tests and the full 182-test suite pass.
- The failure-command fixture initially corrupted child startup by changing SystemRoot before launch. Moving that change until the child reports started exercises the actual termination failure instead. No production assertion was weakened.
- MySQL row-lock contention now tests cancellation racing final artifact publication; only one consistent terminal outcome is allowed.
- Ruling: coordinator native verification/code-generation processes remain bounded, not immediately abortable. Durable publication is prevented, but this is an open cancellation acceptance gate, not full phase completion.
- Ruling: logical browser WebSocket fixtures verify transport only; physical browser lifecycle, packaged Windows and Android device tests remain unverified later-phase gates.
- Ruling: real MySQL pause/resume recovery is not actual database restart; cancellation during a database outage remains a separate fault-intersection test. Do not relabel prior evidence.
- Ruling: push this verified subset on the existing authorized engineering branch without merging or publishing a release. Full Phase 4 remains open for resource/network/mobile policy, durable retry jitter/backoff, portable catalogue and further integrity/fault gates.

Final serial integration verification and commit/push evidence are recorded in evidence/2026-10-13-task-cancellation/RESULTS.md.
