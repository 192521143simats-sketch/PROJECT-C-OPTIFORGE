# Dependency-ordered implementation backlog

The source-qualified line ledger is the conservative obligation inventory, not a checklist of presumed successes. Refine each entry with exact tests/evidence during its phase. All M2 resolutions and both source prompts remain mandatory.

| B:20 phase | A:86 sprint mapping | Implementation and exit gate |
|---|---|---|
| 0 Audit | 0 | Full source/environment inventory, protected baseline, granular backlog and decisions. Runtime data target inspection still pending. |
| 1 Runtime | relevant runtime work | Supported LTS Node/toolchain matrix, bounded verification, secure environment/origins/proxies, DB readiness, isolated MySQL test infrastructure; clean installation/build. |
| 2 Contracts | 1–2 | Versioned messages/capabilities, atomic single-use invitations, stable device identity, migration ledger, lifecycle/ownership validation; backward compatibility and race tests. |
| 3 Compiler | 9 | Correct C subset semantics, safe Python transformations/pyc, javap/entrypoint-correct JAR; diagnostics, artifact integrity, safe measured execution and differential tests. |
| 4 Task engine | 5–8 | Policies, explainable selection, immutable leases/attempts, cancellation, independently verified results, portable matrix/benchmark catalogue, durable restart/DB fault recovery. |
| 5 Web | associated UI work | Full landing/auth/user history/settings/Compute Tasks, admin detail and pagination, onboarding/accessibility, Resend/PostHog privacy-safe integrations. |
| 6 Browser | associated browser work | Explicit consent, bounded cancellable portable execution, background/pause/reconnect/stale handling and truthful resource estimates. |
| 7 Windows | 3 and packaging | Desktop controls + core, bundled runtime/toolchains, encrypted credentials/resource policy, installer/uninstaller/update; real clean Windows evidence. |
| 8 Android | 4 | Kotlin Compose, compatible wrapper/AGP/JDK/SDK, foreground/WorkManager policy, Keystore, network/battery/thermal controls, shared deterministic tasks; APK/AAB and physical evidence. |
| 9 Heterogeneous | integration work | Real native/Android/browser combinations, failures/retry/cancel/determinism/artifacts, bounded labelled load tests. |
| 10 Security/ops | 10–12 | Threat model/isolation, CI/audit/secret/container scans/SBOM, retention, backups and actual isolated restore. |
| 11 Release | 13–16 | Real signatures/package compatibility, install/upgrade/uninstall, docs/notes, TLS/monitoring/migrations/rollback and separately authorized publishing. |

Iterate implementation → unit tests → isolated integration → build → evidence → commit on engineering branch. Do not skip a failed gate or run destructive data reset. Keep later phases explicitly incomplete while independent work progresses.

## Current execution checklist

- [x] Phase9 local integration increment: reusable approval-gated enrollment,
  credential rotation/import, real checked local downloads, layout-preserving
  terminal polish, controlled migrations, container recipes and Kubernetes Job
  adapter. Real web fixture `690dd0a356b83756` and browser/packaged-Windows mixed
  fixture `d5d8f191c2def565` passed. See PHASE9_LOCAL_ACCEPTANCE.md for exact scope.
- [ ] Phase9 remaining gates: updated Android rotation/lifecycle and simultaneous
  three-platform acceptance (phone absent; user requested continuing without it),
  authorized public Kubernetes deployment, separate-internet joining and service
  independence with the development PC off. No paid/public action authorized.

- [x] Phase8 functional v1: native APK installed on physical Xiaomi/API29,
  actual supported computation and C IR results, coordinator recovery,
  cancellation, lifecycle/leave, protected identity and automatic device theme.
  Final 25 JVM tests, 5 physical tests, Android build/lint and isolated acceptance
  6f90f70b244a9fa2 passed. Release artifacts built unsigned; production certification
  is not inferred. See PHASE8_VERIFICATION.md.
- [ ] Next: Phase9 heterogeneous browser/Windows/Android combinations and fault,
  cancellation, capability filtering and artifact verification scenarios.

- [x] Phase7 functional Windows native worker: actual installer, protected identity,
  native tasks/results and C/Python/Java attempts, controls/recovery/diagnostics,
  upgrade/uninstall/reinstall passed. User explicitly excludes production-only
  installations/development; see PHASE7_FUNCTIONAL_ACCEPTANCE.md. Fresh 327 tests,
  15 script/settings checks and all nine builds/typechecks passed. Next: Phase8
  native Android worker/APK; production certification is not inferred from this seal.

- [x] Phase 6 browser core: bounded real Web Workers, lifecycle/progress/reconnect,
  cancellation fences and narrow coordinator connection-race repair. Desktop and
  mobile-emulated HTTPS/WSS, compiler/web/Phase 4 regressions passed. See
  PHASE6_ACCEPTANCE.md; physical Android passed with manual taps and independently
  verified results. Public-host deployment remains a separate external gate.

- [x] Read both complete prompts and M2 resolutions; inspect existing workspace and toolchains.
- [x] Preserve developer DB/volume/secrets; establish engineering branch and granular ledger.
- [x] Diagnose concurrency-sensitive baseline; bounded verification and dependency-backed readiness.
- [x] Add explicit production origin/proxy/password/TLS policy and cookie-WebSocket origin guards.
- [x] Isolate live MySQL/API/worker/compiler verifiers from developer records.
- [x] Reproduce real disconnect/deadlock crash, add bounded transactional retries/background rejection handling, verify genuine InnoDB contention and live regression.
- [x] Verify clean LTS lockfile install from engineering commit.
- [x] Version worker protocol and validate coordinator/worker envelopes end-to-end (v1 foundation; broader cancellation/leases/capability negotiation still open).
- [x] Adopt existing schema under a migration ledger; verify concurrent startup, interrupted DDL recovery and incompatible history rejection in isolated MySQL.
- [x] Atomic single-use invitations, append-only migration and identity/capacity concurrency, with real isolated admission/reconnect/revocation tests. Native installation/device and broader lifecycle acceptance remain separate gates.
- [x] Compiler correctness iteration: real GCC/CPython/JDK outputs, semantic differential cases, program-specific diagnostics/reports and authorized artifact downloads. See COMPILER_PHASE.md; this is not arbitrary-program sandboxing or independent malicious-worker result verification.
- [x] Genuine bounded Linux Docker execution and evidence-backed reports, independent native publication and C IR checks, responsive heartbeat during finalization. See EXECUTION_PHASE.md. This is not a host compiler sandbox or all-task semantic verification.
- [x] Correct compiler-vs-execution report outcomes and real diagnostic counts; reject known foreign-language content/extensions; render persisted compiler-screen errors. All original samples, repaired industrial variants and 36 mismatch cases passed isolated execution; 156 tests and workspace builds passed. See evidence/2026-10-13-report-diagnostics/RESULTS.md; no physical UI or universal language-classifier claim.
- [ ] Remaining task/browser/web phases, host compiler containment, installer/core and native Kotlin/Compose Android.
- [x] Phase 4 subset: independently verify all three existing portable result types, reject forged/replayed/foreign results, preserve retry history, keep verification off heartbeat queue, fix atomic heartbeat and overlapping attempt races. Fresh full verification: 175 tests, three script tests, eight type checks/builds; isolated MySQL/protocol/task/platform/artifact suite passed. See TASK_ENGINE_PHASE.md and evidence/2026-10-13-portable-results/RESULTS.md.
- [x] Phase 4 durable recovery subset: persisted attempt deadlines, stale-result rejection, bounded restart/outage/disconnect recovery and resumed compiler publication; verified real isolated faults and compiler regressions. See TASK_RECOVERY_PHASE.md and evidence/2026-10-13-task-recovery/RESULTS.md.
- [x] Phase 4 cancellation subset: persisted terminal state, owner/admin APIs, capability-negotiated worker propagation, owned native process-tree interruption, late publication/creation guards and compiler cancel control. Evidence: TASK_CANCELLATION_PHASE.md and evidence/2026-10-13-task-cancellation/RESULTS.md. This does not close immediate coordinator-native finalization abort or physical-browser acceptance.
- [x] Phase 4 closure gates: coordinator-native cancellation/parent-loss cleanup; cancellation intersecting actual MySQL pause and actual retained-data database restart; durable backoff/jitter; resource/network/mobile eligibility policy, portable matrix/benchmark catalogue, digest/publication rollback and post-lock expiry races. 252 tests, all workspace builds/type checks and actual isolated fault/compiler/admission suites passed. Sealed Phase 4 v1 against pushed implementation 01f3bd4; PHASE4_ACCEPTANCE.md and evidence/2026-10-14-phase4-seal/RESULTS.md are authoritative.
- [x] Phase 5 web product and actual browser end-to-end acceptance sealed v1; see PHASE5_ACCEPTANCE.md. Preserve user UI/history overrides; native packages, live external provider delivery and physical devices are not inferred.
- [ ] Next: Phase 6 browser worker lifecycle/actual browser acceptance.
- [ ] Native builds, connected-device installation/testing, heterogeneous integration, signed packages and full release gates.
