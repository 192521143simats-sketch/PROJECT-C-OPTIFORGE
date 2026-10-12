# Phase 2: atomic invitation admission

Authority: preserved master M2 R03 and B:20 phase 2. Existing reusable network URLs remain information-only; a new high-entropy, hashed, expiring, revocable invitation admits exactly one consenting device. Admin issues another invitation for another device. Existing enrolled workers retain their identities/credentials until normal expiry/revocation; no database reset.

Implementation order/checklist:

- [x] Add live failing tests for issuance/consent/replay/concurrent acceptance, existing public-link rejection, expiry/revocation and scope.
- [x] Append frozen `0002_worker_invitations` migration, unique node-enrollment/network-code constraints and serialized network-code allocation. Preflight conflicts stop startup without deleting/renaming records.
- [x] Implement invitation issuance/inspection/consumption using existing NetworkService and transactional retries. Lock network then invitation/enrollment/node. Pending enrollment reserves a slot for ten minutes; displayed capacity counts connected workers only.
- [x] Register atomically; revalidate scope/type/expiry/revocation under lock, enforce reconnect capacity, preserve node ID/current task and BUSY state. Add Android identity type without claiming an Android implementation exists.
- [x] Update existing admin/join UI and all live verifiers coherently. New network response supplies its first single-use invite and optional public information URL. Fresh invites are issued from each active network row. Browser receives HttpOnly credential cookie; native clients receive only their scoped worker credential.
- [x] Run full verification and isolated migration/auth/worker/compiler regressions, independent review, evidence/ledger update, commit/push engineering branch.

Ruling: user requests autonomous execution of this already specified backlog; proceed with the existing plan instead of another design-approval pause. Cost if wrong: invitation UX would require revision, but no existing data is deleted or credentials rotated.

Ruling: retain `/join/:token` and existing join API shape rather than a duplicate admission subsystem; new invite tokens resolve there, old public tokens explicitly cannot enroll. Cost if wrong: clients with old links need a fresh admin-issued invitation, as required by M2 R03.

Pre-flight: migration/NetworkService/API/browser/verifiers share token semantics; change them together. Existing compiler/task protocol remains v1. Do not modify the frozen baseline migration. Native Windows/Android packaging and full release are outside this phase.
