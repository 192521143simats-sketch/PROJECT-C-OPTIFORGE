# Phase 6 browser worker implementation plan

**Goal:** Extend the existing browser worker, not a second worker system, with
bounded contribution, truthful lifecycle controls and actual coordinator results.
**Architecture:** Existing protocol v1, HttpOnly enrollment cookie, Web Worker,
MySQL task leases and independently verified results remain authoritative.
Extract only BrowserNode lifecycle from main.tsx into a focused component and
controller so connection/attempt cleanup can be tested without a running UI.
**Spec:** MASTER_PROMPT.txt B20 lines 5501–5511 and B9 browser obligations.
**Execution:** Inline autonomous implementation per user's explicit direction.

## Constraints

- Preserve developer records, credentials, volumes, compiler pipelines and Phase 4.
- Browser supports portable compute and C IR only, never native toolchains.
- Background tabs are deliberately withdrawn; OS suspension cannot be prevented.
- Internet support means same-origin HTTPS/WSS behind a reachable host. No public
  deployment, certificate issuance, credential creation or firewall changes.
- Physical Android acceptance is blocked when ADB has no authorized device;
  mobile emulation must never be recorded as a physical test.

## Review focus

Stale worker callbacks after cancellation; duplicate connections across tabs;
pause/background during assignment; task timer surviving disconnect; unavailable
secure context/resource APIs. Each needs behavioral tests and actual-browser checks.

## Ordered checklist

- [x] Controller: test reconnect/pause/background/offline/registration deadline,
  stale attempts and timer cleanup RED, implement browser-session.ts, rerun GREEN.
- [x] Execution: test native rejection, bounded timeout/progress and existing
  hand-derived compute outputs; extend browser-worker.ts with yielded checkpoints.
- [x] UI: integrate browser-node.tsx controls/progress/truthful estimates, restore
  enrolled join page on refresh using authenticated worker scope endpoint.
- [x] Integration: isolated browser suite with desktop/mobile contexts and actual
  Web Workers: all portable operations, cancellation, page reload, tab close,
  reconnect, coordinator restart, eligibility and revocation. No mock results.
- [x] Regression: workspace tests/typechecks/builds, Phase 4/compiler/web suites,
  independent review and fix/retest; record exact results and remaining gates.
- [x] Documentation: internet deployment requirements and browser/platform limits,
  requirement evidence, commit/push; seal only acceptance actually demonstrated.

## Execution rulings and remaining external gates

User directed autonomous execution of the preserved master architecture; no
replacement subsystem or speculative design approval was introduced. A small
coordinator connection-serialization fix was required by the actual reload race;
it preserves durable task/attempt semantics, with Phase 4 regressions passed.
Headless Page.freeze did not suspend reliably: use actual renderer Debugger pause
for heartbeat fallback and component freeze/resume tests, not a fabricated OS pass.
Physical Android is detected; MIUI input permission blocks automated phone UI.
The user chose manual taps; fixture 836139ed765adc44 passed all actual
coordinator/MySQL assertions and owned-device cleanup, exit 0.
Public host/DNS/trusted TLS deployment is not authorized/configured.
