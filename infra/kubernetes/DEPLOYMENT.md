# Controlled Kubernetes foundation

No cluster/account/domain is configured or approved. Placeholder references cannot
be applied as a release. Local rendering and fake-API tests do not establish live
execution, containment, ingress, storage durability or public availability.

## Images

From repository root, build sequentially:

```powershell
docker build -f infra/containers/coordinator.Dockerfile -t gridx-coordinator:phase9 .
docker build -f infra/containers/web.Dockerfile -t gridx-web:phase9 .
docker build -t gridx-execution:phase9 infra/sandbox
node infra/containers/Verify-Images.mjs
kubectl kustomize infra/kubernetes
```

Coordinator retains tsx because shared packages export TypeScript source. GCC,
Python and JDK support existing coordinator artifact verification, a separate
trusted-native boundary: the execution Job does not sandbox all compilation.
Web serves the built SPA on8080 as UID101. Ingress sends /api and /ws directly to
coordinator; relative same-origin client URLs need no build secret. No Docker
socket/executable, hostPath or privileged Pod is supplied.

Base tags are build inputs. Record build platform, base digests, scan results,
output image digests and compiler versions. Replace all runtime references with
verified registry digests in a protected local overlay. ARM requires actual ARM
builds/tests. Publishing requires separate approval; local build does not publish.

## Execution prerequisites and boundaries

Use Kubernetes>=1.30 for the supplied ValidatingAdmissionPolicy API. Install and
verify a sandbox RuntimeClass named `gvisor`, or change BOTH admission policy and
GRID_X_SANDBOX_RUNTIME_CLASS to the verified class. Inspect the handler and runtime
configuration and run actual containment probes; a name does not prove a sandbox.
Require a CNI enforcing deny-all ingress AND egress in gridx-execution; verify
DNS, services, metadata, internet and node-network denial from a submitted program.
Require kubelet podPidsLimit<=64, or an equally bounded verified runtime setting,
and verify node memory/CPU admission/swap policy. Kubernetes has no per-Pod PID
limit field. These are deployment blockers until measured.

Standard HTTPS API access verifies the projected service-account CA. Coordinator
can create/get/delete Jobs, create ConfigMaps and list Pods/read logs in a separate
namespace containing no app secrets. No Secret read or Pod exec permission exists.
Job-create RBAC alone cannot constrain Pod specs; admission requires the sandbox
class, no token mount, CPU/memory limits and only emptyDir/projected ConfigMaps.
Pod Security baseline rejects privileged, host-network and hostPath workloads.
Review RBAC and admission together; protect cluster-admin/policy mutation.

Payloads are bounded to24MB, chunked into <=400KB binary ConfigMap values and
projected only into the trusted init container. Init assembles an ephemeral memory
workspace. The trusted entry opens and unlinks the request before calling the
existing runner. Programs execute as UID65534; trusted controller remains UID0
with only SETUID/SETGID/CHOWN/KILL, read-only root and RuntimeDefault seccomp.
Programs receive no application secret or API token. ConfigMaps contain user code
and artifact bytes: restrict operator access and audit accordingly.

Existing backpressure permits two active executions/eight queued callers. Each
Job has no retry,45-second active deadline,512MiB/one CPU,memory workspace bounds,
60-second controller deadline and12MB API response bound. Runner enforces20-second
compilation,10-second program lifetime and64KiB combined output. Logs transport
trusted JSON evidence/optional ELF bytes, validated before publication. Abort
deletes only the created Job UID with foreground propagation; ConfigMaps are Job
dependents. TTL120 seconds collects finished Jobs after controller loss. Failed
cleanup is logged. Before untrusted execution, test actual cancellation/controller
death,quota/payload failure,output flood,fork/CPU/memory exhaustion,network denial
and artifact byte integrity in the target cluster.

## Secrets, migrations and rollout

1. Verify context/server version, runtime handler,CNI,admission,PID limit,ingress,
   TLS,retained storage class and external backup destination. Replace DNS,image
   placeholders and exact trusted ingress source CIDRs. Never bypass TLS checks.
2. Create protected `gridx-runtime` with DB_PASSWORD,MYSQL_ROOT_PASSWORD,
   ADMIN_USERNAME and Argon2id ADMIN_PASSWORD_HASH. No plaintext admin password.
   Create separate `gridx-migrations` with DB_USER/DB_PASSWORD for an explicitly
   provisioned schema-migration principal. App principal should have needed DML;
   migrator has needed DDL. Initial MySQL image setup creates only its configured
   user: provision/verify grants with a protected DBA procedure. Neither Job nor
   coordinator receives MySQL root credentials. Require provider encryption at
   rest and restrictive Secret RBAC; Kubernetes Secrets alone are no vault.
3. Take a consistent encrypted backup outside the PVC. Restore into a separate
   database; verify row counts,artifact digests,ledger,enrollment and task flow.
   Confirm PV Retain reclaim policy. Never reset databases/delete existing PVCs.
4. Render reviewed overlays; server dry-run/diff only after deployment approval.
   Apply namespace/config,protected secrets,policies and MySQL first. Do not start
   the new coordinator before migration completes. Stop the prior single active
   coordinator for schema changes.
5. Copy migration-job.yaml into the protected overlay; replace RELEASE with a
   DNS-safe version and use the EXACT coordinator image digest planned for rollout.
   Run one Job with GRID_X_MIGRATION_MODE=apply,wait for Complete,review safe logs.
   migrate.ts starts no server/sockets. Existing advisory lock serializes DDL;
   frozen checksums reject changed,newer or holey history. DDL failure has no
   automatic retry; inspect and explicitly rerun the idempotent procedure.
6. Start one coordinator with GRID_X_MIGRATION_MODE=check. It validates the exact
   ledger without CREATE/ALTER/INSERT migrations. Missing ledger,pending,changed
   or newer history fails startup. Recreate preserves process-local socket
   ownership. Never scale replicas until HA exists.

After approved overlays/prerequisites:

```powershell
kubectl config current-context
kubectl apply --dry-run=server -k PATH_TO_REVIEWED_OVERLAY
kubectl diff -k PATH_TO_REVIEWED_OVERLAY
kubectl -n gridx rollout status statefulset/mysql --timeout=300s
kubectl apply -f PATH_TO_VERSIONED_MIGRATION_JOB
kubectl -n gridx wait --for=condition=complete job/REVIEWED_JOB_NAME --timeout=300s
kubectl apply -k PATH_TO_REVIEWED_OVERLAY
kubectl -n gridx rollout status deployment/coordinator --timeout=300s
kubectl -n gridx rollout status deployment/web --timeout=300s
```

The local image verifier creates only labelled disposable containers, an owned
Docker bridge network and tmpfs MySQL data. Only API/web ports are published on
loopback; MySQL has no host port. It does not read `.env`, mount developer data,
or publish anything. It checks separate migration apply/check processes,
coordinator readiness, admin login, network/pending enrollment and non-root SPA
serving. It is development-mode local container evidence, not production TLS or
Kubernetes evidence.

Local kustomize rendering is not schema/admission validation. No current context
exists; cluster server checks and all-language Kubernetes execution are blocked.
Readiness uses /ready;liveness TCP prevents database faults causing restart loops.
Verify authenticated API/session,browser WSS,Windows/Android enrollment/tasks and
artifact download against approved public DNS. A separately observed external
test with the development laptop off is required for independent availability.

## CI build handoff (no automatic deployment)

Use an approved Linux runner with Docker, Node24 and the documented native
toolchains. Run `npm ci`, `npm run verify`, `npm run verify:artifacts`, and the
three image builds above sequentially. Run `node infra/containers/Verify-Images.mjs`
against disposable fixtures, render `kubectl kustomize infra/kubernetes`, and retain
logs, image IDs, dependency audit results and checksums as restricted CI artifacts.
Windows packaging requires a Windows runner; Android packaging requires the
pinned SDK/JDK/Gradle and separate authorized signing configuration.

This is a build procedure, not evidence that a remote CI pipeline ran. Registry
push, cluster credentials, protected environment approval and an actual deployment
job belong to a separately approved release. Do not attach production secrets to
untrusted pull-request jobs. A local image tag is not an immutable registry digest.
After approval, use a protected runner to execute the migration/check/rollout and
acceptance sequence in this document, recording actual target-cluster results.

## Rollback procedure

Retain prior digests,reviewed overlays,backup and migration evidence. `kubectl -n
gridx rollout undo deployment/coordinator` and web undo restore app revisions only.
Check schema compatibility first: older code rejects unknown/newer ledger entries.
Rollout undo does not roll back schema/data. Restore verified backup into a
separate database and validate before an explicitly approved cutover. Never edit
ledger rows/delete PVCs to force old code to start. Signatures,provider costs,
distribution hosting and public publishing remain separate gates.
