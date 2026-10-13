# Isolated execution and evidence-backed reports

User authorizes autonomous implementation of genuine compilation, analysis,
optimization and execution, rejecting fabricated success or measurements.
This extends existing compiler/jobs/artifacts; MySQL and frozen migrations stay.

Design: coordinator executes final supported output inside an owned Docker Linux
container, with no host mount, network, privileges or application secrets. Windows
PE cannot run in Linux: compile actual final C source there and expose the genuine
Linux executable separately, retaining the Windows artifact. Java libraries are
not run. Compilation success is separate from execution success; nonzero exits,
timeouts/output limits and infrastructure failures must not become success claims.
Runtime output, elapsed time and peak child memory are measured, with target and
artifact identity explicit. No universal semantic-equivalence or sandbox guarantee.

Implementation plan (inline; preserve user's instruction not to wait for ordinary
approval):
- [x] Task 1: add failing behavioral report tests for real execution/failure,
  diagnostic-specific recommendations, correct primary artifact size; implement
  shared report types and rendering without changing the ten-section structure.
- [x] Task 2: add Docker sandbox runner/controller and real tests for C/Python/Java,
  nonzero exit, timeout, output flood, no network/no privileges/read-only filesystem;
  use 512 MB memory, 64 processes, one CPU, 64 KB combined runtime output,
  ten-second execution, bounded temporary files, no inherited host credentials.
- [x] Task 3: integrate final job execution and UI output, preserve artifact owner
  authorization, report unavailable image honestly, ignore stale result finalization.
- [x] Task 4: verify all workspaces and isolated MySQL/native-worker/download
  success/failure flows; inspect generated PDFs; review, document scope, commit/push.

Interfaces: `executeIsolated({language,sourceName,generatedSource,artifact,runnableJar})`
returns typed execution evidence and optional actual Linux artifact. Reports accept
this evidence; coordinator never accepts worker-supplied execution claims as proof.
Docker runner accepts JSON over stdin and returns bounded validated JSON, not shell
commands. Image build is a local reproducible prerequisite, never a public deployment.

Review focus: Windows-vs-Linux identity; Java library false success; infrastructure
vs program error; hostile output/processes; stale worker result publication. Tests
must demonstrate failure before implementation and actual container behavior later.
Hardware/device/package releases and task-engine lease/cancellation remain distinct.

Review additions: rebuild native publication from stored source; verify C IR against
the authoritative optimizer, not worker-reported transformation counts. Coordinator
toolchains are required and this duplicate verification cost is not hidden. Separate
the trusted controller identity from nonprivileged submitted children; otherwise
`/proc/<parent>/fd/1` allowed output tampering. Detect oversized Linux executables
before reading bytes; normalize dotted source basenames. Run finalization outside
the serialized worker-message queue so execution cannot block heartbeats. A real
integration test reproduced blocked heartbeat before this change. These changes
do not add durable leases/cancellation/restart recovery or a full compiler sandbox.
