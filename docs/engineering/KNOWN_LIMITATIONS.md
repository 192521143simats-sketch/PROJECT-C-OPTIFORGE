# Known limitations and blockers

- Browser and Android cannot execute native GCC/CPython/JDK processes; portable IR/compute only. Native/compiler execution must use compatible trusted, eventually contained workers.
- Host compiler temporary directories/timeouts are not a full sandbox. Arbitrary user execution must not be enabled before containment controls/tests.
- Native Windows desktop/installer and Android application do not exist at baseline.
- Physical Redmi M2004J19C is now detected by ADB (Android API 29, arm64); native APK is not yet built/installed/tested. No clean target Windows installation or production-signing evidence. These remain unverified release gates, not reasons to stop independent coding.
- Docker Linux engine is running after diagnostic startup. Developer DB table/row counts were read only; backups/SQLite value inspection remains pending. Isolated live verifiers now run without touching developer records/volume.
- Node installed is non-LTS 26.8.1. Supported LTS clean-install verification still required.
- Historical SQLite files and backup remain protected pending value inspection and deletion approval.
- Baseline automated coverage is narrow relative to the cumulative master, with Java concurrency-sensitive timeout and compiler semantic/security findings recorded in PROJECT_STATUS.
- Live provider configuration, real email permission, code-signing credentials and production publishing authorization have not been established.
