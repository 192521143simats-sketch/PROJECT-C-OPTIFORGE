# Phase 7 Windows worker implementation plan

> **For agentic workers:** Use superpowers:executing-plans inline. Existing user
> instruction authorizes autonomous execution of the preserved master design.

**Goal:** A desktop-controlled, installable Windows worker using the existing
coordinator, protocol v1, compiler pipelines and MySQL authority.
**Architecture:** Extract the existing native agent lifecycle into a reusable
session; the CLI and a bundled worker bridge consume it. Electron owns local
desktop controls, DPAPI-encrypted enrollment persistence and restricted IPC.
NSIS packages the desktop and private Node runtime without global Node/npm.
**Tech stack:** TypeScript, Electron 44.7.2, electron-builder 26.15.3, Node 24.21.0.
**Spec:** specification/MASTER_PROMPT.txt A11, B7, B20 Phase7; DECISIONS R04/R09/R10.

## Global constraints and decisions

- Preserve all existing data, protocol/task history and compiler behavior.
- No credentials in URLs, renderer, logs, plaintext disk or compiler environment.
- No automatic publishing/update execution or signing without real credentials.
- Bundled runtime does not imply bundled GCC/CPython/JDK or compiler containment.
- Clean-profile tests on this host are not clean-machine/VM certification.
- Ruling: retain the existing engineering branch and execute inline as explicitly
  requested; no new scaffold or redundant worker implementation.

## Review focus

Old asynchronous callbacks after reconnect; pause during task execution; untrusted
renderer IPC; corrupt credential storage; installation/upgrade overwriting user data.

## Ordered tasks

### Task 1 — native lifecycle

Files: apps/worker/src/session.ts, session.test.ts, index.ts.
Consumes existing profile/resources, runTaskProcess, versioned contracts.
Produces NativeWorkerSession start/pause/stop and observable credential-free state.
- [x] Test real WebSocket registration, result, pause/cancel, reconnect and policy
  rejection before implementation; record RED then GREEN.
- [x] Preserve developer CLI and actual owned-process/compiler behavior.
- [x] Run worker tests, typechecks and full regression suite before commit.

### Task 2 — secured desktop product

Files: apps/windows-worker/main.cjs, preload.cjs, renderer.*, settings.cjs,
settings.test.mjs, worker-bridge.ts, package.json.
Consumes NativeWorkerSession; renderer receives state only, never credentials.
- [x] Test invalid URLs/settings and encrypted-store roundtrip/corruption RED.
- [x] Implement explicit-consent admission via existing API, persisted identity,
  controls/resource monitoring/activity, diagnostics and update information.
- [x] Validate IPC sender, isolate renderer, prevent external navigation and
  auto-connect only on explicit Connect. Run Electron acceptance where supported.

### Task 3 — package and installation

Files: scripts/Build-Windows-Worker.mjs, Verify-Windows-Worker.mjs; integration runner.
Consumes private Node runtime plus built application; produces ignored NSIS
installer/uninstaller, version, integrity manifest and independent evidence.
- [x] Build executable package; test isolated install/start/enroll/task/pause/
  restart/recovery/revoke/upgrade/uninstall, never developer database by default.
- [ ] Verify signatures honestly; record unavailable clean VM/toolchains/signing
  as blocked, not completed. Continue every independent build/test task.
- [ ] Run compiler, Phase4 and browser regressions, fresh review, evidence and
  commit/push. Seal only when all mapped Phase7 acceptance actually passes.

## Progress ledger

2026-10-14 baseline 693cd579e54a87f060114de75bfe2d92f8859749, clean engineering
branch, existing eight workspaces. No desktop module or installer. GCC, CPython,
JDK installed on this developer host; only Node portable runtime exists in repo.
No signing key, clean Windows VM or deployment is inferred from this inventory.

2026-10-15: actual unsigned 0.1.1 installer, developer-host installation and
0.1.0 upgrade/uninstall passed. Extended fixture `7494431320b61efe` includes
actual coordinator restart, recovered computation, and C/Python/Java native
compiler attempts on the packaged worker with authorized artifact downloads.
Phase4/compiler/browser regressions and all eleven real Docker isolation cases
passed. This is a verified Windows development-host milestone, not a Phase7 seal.

## Remaining Phase7 acceptance work

- Bundle pinned, redistributable GCC/CPython/JDK distributions with licenses and
  validate them without host toolchain PATH dependencies. Only Node is bundled.
- Provide and adversarially verify filesystem/network containment for untrusted
  native compiler workloads. Job Object limits alone do not satisfy that gate.
- Repeat install/upgrade/uninstall on a clean supported Windows host or VM.
  Windows Sandbox is not installed on the current host; no OS features were changed.
- Supply actual approved signing credentials for production release verification;
  the development installer is explicitly unsigned, not falsely certified.
