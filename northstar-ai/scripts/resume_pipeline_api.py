import contextlib
import io
import json
import sys

from resume_pipeline import run_pipeline


def main():
    try:
        raw = sys.stdin.read()

        if not raw.strip():
            raise ValueError("No resume data received.")

        confirmed = json.loads(raw)

        if not isinstance(confirmed, dict):
            raise ValueError("Resume data must be a JSON object.")

        # resume_pipeline prints progress messages.
        # Capture them so stdout contains ONLY the final JSON response
        # expected by server.js.
        logs = io.StringIO()

        with contextlib.redirect_stdout(logs):
            result = run_pipeline(confirmed)

        debug_output = logs.getvalue()

        if debug_output:
            print(debug_output, file=sys.stderr, end="")

        print(json.dumps(result))

    except Exception as error:
        print(
            json.dumps({
                "success": False,
                "error": str(error),
            })
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
