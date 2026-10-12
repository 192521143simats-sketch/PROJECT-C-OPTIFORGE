# Actual compiler outputs and scope

Use `START-C-OPTIFORGE.bat` from the project root. MySQL and its existing volume
remain authoritative. Sign in as admin, create an invoked network and enroll a
compatible native worker through the existing scoped onboarding. The current
developer Node agent command remains `npm run worker -- --coordinator <URL> --credential
<scoped credential>`; installer/on-device onboarding is a later phase, not claimed
complete here. Do not put that credential in a URL, source file or committed script.
Browser workers perform supported C IR optimization, not GCC/CPython/JDK execution.

Users select C/Python/Java, provide a safe source basename with the corresponding
extension, upload/paste source, and submit. Existing resource/history-based network
selection and network isolation remain. Source submissions are one file, at most
1 MB; external multi-file projects/dependency resolution are not implemented.

## C

The custom frontend retains function-level distributed C IR optimization for its
documented signed-int/void subset. Headers, pointers, structs, arrays and other
source beyond that grammar go to actual GCC C11 on a native C-source-capable
worker. Full-source compilation uses GCC `-O2 -Wall -Wextra`; explicit IR output
uses `-O0`. No arbitrary source-text splitting or fake optimization candidates.
Successful outputs include original source, actual compiled/generated source,
native Windows PE `.exe` or Linux ELF according to the compiling machine, and
JSON/PDF reports. A Windows executable is not relabelled as Linux or vice versa.
Derived source/bytecode names are bounded to the database's 255-character limit;
C executable stems use at most 120 characters for Windows toolchain path safety.
Very long C display filenames use a short internal compiler filename only.

## Python

Actual CPython parses, validates, transforms bounded integer arithmetic, reparses
the final generated source, and compiles genuine `.pyc` bytes. Assertions,
docstrings, annotation expressions and branch binding semantics are preserved.
No submitted expression is evaluated by an optimizer. Power/repetition and unsafe
control-flow elimination are not performed. Outputs include original `.py`,
`compiled_<name>.py`, compatible-version `.pyc` and JSON/PDF reports.

## Java

Actual JDK `javac` validates and compiles source; `javap` inspects compiled methods
and descriptors; `jar` packages all produced classes. Supported single-file
constructs include packages, classes, records, enums and interfaces. Real public
static `main(String[])` (including varargs and compiled-class inheritance) creates
a runnable manifest. Libraries get valid library JARs, not fake runnable labels.
Generated source is the actual source javac processed; javac is not claimed to
rewrite Java source. Outputs include `.java`, actual package-path `.class` files,
JAR and reports. Source filenames in the web API are ASCII safe basenames;
Unicode identifiers/package names within the source are supported. Individual
artifact paths are limited to the existing storage model's 255 characters.
Preview features, external-superclass entry-point discovery and external
dependencies are not enabled.

## Reports and failure

All languages use the requested ten-section user-facing structure. Actual source
size/lines, artifact names, errors/warnings and their locations are job-specific.
Recommendations reference actual diagnostics; only performed transformations
are listed. JSON includes actual generated source where transformation occurred;
downloadable source is authoritative. Failure reports contain real errors and no
executable, bytecode or JAR placeholders. The failed stage remains visible.
Failures/report artifacts are committed atomically and remain owner/admin-only.
Java library reports explain that they are not standalone runnable programs.

Processing time measures actual job wall time (including distributed waiting),
not claimed CPU time or acceleration. Memory usage remains `Not available` without
a genuine per-build measurement. Reports explicitly say execution was not
performed: compiling code is not permission to run arbitrary uploaded programs.

## Verification and remaining release gates

`npm run verify`: all workspace typechecks, unit tests, script safety tests/builds.
`npm run verify:artifacts`: owned temporary MySQL, real coordinator/native worker,
original and advanced language fixtures, downloadable outputs, negative programs.
Trusted fixtures are deliberately executed during tests to check real output;
that is separate from user-build execution. No developer database is reset.

Subprocess/source/output/time limits and disabled Java annotation processors do
not constitute a production OS sandbox. Arbitrary-program execution, independently
verified malicious-worker results, task leases/cancellation, packaged Windows and
native Android applications, signatures and physical-device acceptance remain
separate master requirements. This phase does not claim the entire platform ready.
