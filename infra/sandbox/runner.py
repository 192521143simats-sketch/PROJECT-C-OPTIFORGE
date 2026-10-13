"""Trusted container controller. No shell, host mounts, application secrets or network."""
import base64
import json
import os
import re
import selectors
import signal
import subprocess
import sys
import time

LIMIT = 65536
ENV = {"PATH": "/usr/local/bin:/usr/bin:/bin", "HOME": "/work", "LANG": "C.UTF-8"}


def unprivileged_child():
    # The trusted controller and submitted program must not share an OS identity.
    os.setgroups([])
    os.setgid(65534)
    os.setuid(65534)


def stop(process):
    try:
        os.killpg(process.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    _, status, usage = os.wait4(process.pid, 0)
    process.returncode = os.waitstatus_to_exitcode(status)
    return usage


def execute(command, timeout, input_text=""):
    with open("/work/stdin.txt", "w", encoding="utf-8") as stream:
        stream.write(input_text)
    started = time.monotonic()
    with open("/work/stdin.txt", "rb") as stream:
        process = subprocess.Popen(command, stdin=stream, stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE, env=ENV, start_new_session=True,
                                   preexec_fn=unprivileged_child)
    selector = selectors.DefaultSelector()
    selector.register(process.stdout, selectors.EVENT_READ, "stdout")
    selector.register(process.stderr, selectors.EVENT_READ, "stderr")
    chunks = {"stdout": bytearray(), "stderr": bytearray()}
    size, status, usage = 0, None, None
    while selector.get_map():
        if time.monotonic() - started >= timeout:
            status = "TIMED_OUT"
            usage = stop(process)
            break
        for key, _ in selector.select(0.05):
            data = os.read(key.fileobj.fileno(), 4096)
            if not data:
                selector.unregister(key.fileobj)
                continue
            remaining = LIMIT - size
            chunks[key.data].extend(data[:remaining])
            size += min(len(data), remaining)
            if len(data) > remaining:
                status = "OUTPUT_LIMIT"
                usage = stop(process)
                break
        if status:
            break
    selector.close()
    if status is None:
        while True:
            pid, child_status, usage = os.wait4(process.pid, os.WNOHANG)
            if pid:
                process.returncode = os.waitstatus_to_exitcode(child_status)
                break
            if time.monotonic()-started >= timeout:
                status = "TIMED_OUT"
                usage = stop(process)
                break
            time.sleep(0.01)
    elapsed = (time.monotonic()-started)*1000
    return {"status": status or ("SUCCEEDED" if process.returncode == 0 else "FAILED"),
            "stdout": chunks["stdout"].decode("utf-8", "replace"),
            "stderr": chunks["stderr"].decode("utf-8", "replace"),
            "exitCode": process.returncode, "durationMs": elapsed,
            "peakMemoryBytes": usage.ru_maxrss*1024 if usage else None}


def main():
    request = json.loads(sys.stdin.buffer.read(24000000))
    language = request["language"]
    generated = request.get("generatedSource", "")
    artifact_name, linux_artifact = None, None
    if language == "python":
        artifact_name = "compiled_" + request["sourceName"]
        with open("/work/program.py", "w", encoding="utf-8") as stream:
            stream.write(generated)
        command = ["python3", "-I", "/work/program.py"]
    elif language == "java":
        artifact_name = request["artifactName"]
        with open("/work/program.jar", "wb") as stream:
            stream.write(base64.b64decode(request["artifactBase64"], validate=True))
        command = ["java", "-Xmx256m", "-XX:ActiveProcessorCount=1", "-jar", "/work/program.jar"]
    elif language == "c":
        original = base64.b64decode(request.get("artifactBase64", ""), validate=True)
        if original.startswith(b"\x7fELF"):
            artifact_name = request["artifactName"]
            with open("/work/program", "wb") as stream:
                stream.write(original)
        else:
            with open("/work/program.c", "w", encoding="utf-8") as stream:
                stream.write(generated)
            built = execute(["gcc", "-std=c11", "-O2", "/work/program.c", "-o", "/work/program"], 20)
            if built["status"] != "SUCCEEDED":
                built.update(status="UNAVAILABLE", peakMemoryBytes=None, artifactName=None,
                             target="Linux container", input="", message="The target Linux rebuild failed; the original compiled artifact is preserved.")
                print(json.dumps({"execution": built}))
                return
            artifact_name = re.sub(r"[^A-Za-z0-9_-]", "_", request["sourceName"].rsplit(".", 1)[0][:120]) + "-linux"
            if os.stat("/work/program").st_size > 8000000:
                raise ValueError("Linux executable exceeds the artifact limit")
            with open("/work/program", "rb") as stream:
                linux_artifact = {"fileName": artifact_name, "contentBase64": base64.b64encode(stream.read(8000000)).decode("ascii")}
        os.chown("/work/program", 0, 0)
        os.chmod("/work/program", 0o700)
        os.chown("/work/program", 65534, 65534)
        command = ["/work/program"]
    else:
        raise ValueError("Unsupported execution language")
    result = execute(command, 10, request.get("input", ""))
    # wait4 measures this execution, not an earlier compiler invocation.
    result.update(target="Linux container", artifactName=artifact_name, input=request.get("input", ""),
                  message={"SUCCEEDED": "The program exited successfully in the isolated Linux environment.",
                           "FAILED": "The program exited unsuccessfully; review its runtime diagnostics and exit code.",
                           "TIMED_OUT": "Execution exceeded the ten-second time limit and was terminated.",
                           "OUTPUT_LIMIT": "Execution exceeded the output limit and was terminated."}[result["status"]])
    print(json.dumps({"execution": result, "artifact": linux_artifact}))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        print(json.dumps({"error": "Isolated execution controller failed."}))
        sys.exit(1)
