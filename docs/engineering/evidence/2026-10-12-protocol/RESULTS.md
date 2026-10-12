# Versioned protocol foundation evidence

Clean source archive of `4988f0f960b8be6ca03a94603f5cb45741c68da3` extracted to a separate owned temporary test checkout. `npm ci --no-audit --no-fund`: exit 0, 194 packages installed. LTS `node --version`: v24.21.0 (isolated PATH; global runtime unchanged). `npm run verify`: exit 0, 57 unit tests, 3 script tests, all workspace typechecks/builds. npm warned about Argon2 install-script approval metadata; Argon2 real hash/verification tests passed. No developer env/database copied.

Protocol TDD: three new tests first failed against legacy code (missing version accepted, no coordinator decoder/encoder), then passed after implementation. Worker envelopes now require v1; coordinator messages validate operation/declared kind, identifiers/attempts/heartbeat interval and bounded payloads. IR operators are restricted to the supported operator list.

`npm run verify`: exit 0, 60 unit tests in 21 files, 3 engineering-script tests, all workspace typechecks/builds. `npm run verify:integration`: exit 0, isolated instance `2657565984f13960`, all four suites passed:

- Genuine MySQL deadlock recovery.
- `/version`, missing/unsupported protocol rejection with code and close 1008, cookie-origin enforcement, node revocation closes authenticated connection, coordinator remains ready.
- Existing auth/reset/network isolation/capacity/stable numbering/reassignment and C artifact regression.
- Native worker real C/Python/Java six samples, actual artifacts/authorized downloads and trusted fixture execution.

Protocol client in the boundary verifier is a labelled logical fixture, not Android/native installation or browser visual evidence. Compiler native agent is an actual separate Node process. Developer database/volume unchanged; only labelled owned temporary MySQL fixtures removed.

Missing: atomic single-use admission, migration ledger/races, full independent worker result validation, leases/cancellation/background policies, installer, native Android, signatures, device and heterogeneous release evidence. None is marked complete by this protocol milestone.
