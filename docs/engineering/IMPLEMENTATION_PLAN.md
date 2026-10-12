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
- [ ] Remaining task/browser/web phases, compiler sandbox/execution gates, installer/core and native Kotlin/Compose Android.
- [ ] Native builds, connected-device installation/testing, heterogeneous integration, signed packages and full release gates.
