import json
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

AI_DIR = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = AI_DIR / "scripts"

CHAT_SCRIPT = SCRIPTS_DIR / "chat_api.py"
RESUME_SCRIPT = SCRIPTS_DIR / "resume_pipeline_api.py"

HOST = "0.0.0.0"
PORT = 8001


def run_northstar_script(script_path, payload, timeout):
    process = subprocess.run(
        [sys.executable, str(script_path)],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        cwd=str(AI_DIR),
        timeout=timeout,
    )

    if process.returncode != 0:
        raise RuntimeError(
            process.stderr.strip()
            or process.stdout.strip()
            or f"NorthStar AI exited with code {process.returncode}"
        )

    output = process.stdout.strip()

    # First try the complete output as JSON.
    try:
        return json.loads(output)
    except json.JSONDecodeError:
        pass

    # Some model libraries may print informational lines.
    # Find the last valid JSON line.
    for line in reversed(output.splitlines()):
        line = line.strip()
        if not line:
            continue

        try:
            return json.loads(line)
        except json.JSONDecodeError:
            continue

    raise RuntimeError(
        "NorthStar AI returned output that was not valid JSON."
    )


class NorthStarAIHandler(BaseHTTPRequestHandler):

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()

        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self.send_json(
                200,
                {
                    "success": True,
                    "service": "northstar-ai",
                    "mode": "mlx-v5",
                },
            )
            return

        self.send_json(
            404,
            {
                "success": False,
                "error": "Not found",
            },
        )

    def do_POST(self):
        try:
            content_length = int(
                self.headers.get("Content-Length", "0")
            )

            raw_body = self.rfile.read(content_length)

            payload = (
                json.loads(raw_body.decode("utf-8"))
                if raw_body
                else {}
            )

            if self.path == "/chat":
                result = run_northstar_script(
                    CHAT_SCRIPT,
                    payload,
                    timeout=180,
                )

                self.send_json(200, result)
                return

            if self.path == "/resume":
                result = run_northstar_script(
                    RESUME_SCRIPT,
                    payload,
                    timeout=360,
                )

                self.send_json(200, result)
                return

            self.send_json(
                404,
                {
                    "success": False,
                    "error": "Not found",
                },
            )

        except subprocess.TimeoutExpired:
            self.send_json(
                504,
                {
                    "success": False,
                    "error": "NorthStar AI request timed out.",
                },
            )

        except Exception as exc:
            print(
                f"[NorthStar AI Server] ERROR: {exc}",
                file=sys.stderr,
                flush=True,
            )

            self.send_json(
                500,
                {
                    "success": False,
                    "error": str(exc),
                },
            )

    def log_message(self, format, *args):
        print(
            "[NorthStar AI Server] "
            + (format % args),
            flush=True,
        )


if __name__ == "__main__":
    print()
    print("====================================")
    print("NorthStar AI V5 Server")
    print("====================================")
    print(f"AI directory: {AI_DIR}")
    print(f"Python: {sys.executable}")
    print(f"Listening: http://{HOST}:{PORT}")
    print()
    print("Endpoints:")
    print("  GET  /health")
    print("  POST /chat")
    print("  POST /resume")
    print("====================================")
    print()

    server = ThreadingHTTPServer(
        (HOST, PORT),
        NorthStarAIHandler,
    )

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping NorthStar AI server...")
        server.server_close()
