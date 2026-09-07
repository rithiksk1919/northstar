import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from resume_validator import validate_resume


MODEL = "mlx-community/Qwen3-4B-4bit"
ADAPTER = "adapters/northstar-v5-2900"

SYSTEM_PROMPT = """
You are NorthStar AI.

Create truthful, ATS-friendly resumes using only confirmed user information.

Rules:
- Never invent employers, titles, dates, durations, metrics, achievements, certifications, languages, duties, or skills.
- Explicit user-provided tasks may be rewritten professionally without adding facts.
- Alternate contacts such as shelters, case workers, support centers, or service organizations should not appear on the resume unless the user explicitly asks.
- Certification does not prove operating experience.
- Inventory & Storage Organization does not automatically mean Inventory Management.
- Use a clean single-column resume structure.
- When enough confirmed information exists, generate the actual resume.
- Use standard sections such as SUMMARY, CERTIFICATIONS, RELEVANT EXPERIENCE, and SKILLS when applicable.
"""


def generate(prompt: str, max_tokens: int = 1000) -> str:
    cmd = [
        sys.executable,
        "-m",
        "mlx_lm.generate",
        "--model", MODEL,
        "--adapter-path", ADAPTER,
        "--system-prompt", SYSTEM_PROMPT,
        "--prompt", prompt,
        "--max-tokens", str(max_tokens),
    ]

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        check=True,
    )

    output = result.stdout

    # mlx_lm.generate prints text between separator lines.
    parts = output.split("==========")

    if len(parts) >= 3:
        generated = parts[1].strip()
    else:
        generated = output.strip()

    # Remove empty Qwen thinking block if present.
    generated = generated.replace("<think>\n\n</think>", "").strip()

    return generated


def build_resume_prompt(confirmed):
    return f"""
NORTHSTAR_RESUME_WIZARD

Confirmed user information:

{json.dumps(confirmed, indent=2)}

TASK:
Generate the complete final resume.

Use only the confirmed facts above.
Do not include the alternate contact.
Do not invent missing facts.

When confirmed content exists, use this section order:

NAME / CONTACT
SUMMARY
CERTIFICATIONS
RELEVANT EXPERIENCE
SKILLS

Important:
- Include confirmed skills in the SKILLS section.
- Include confirmed certifications in CERTIFICATIONS.
- Convert confirmed tasks into truthful action-oriented bullets under RELEVANT EXPERIENCE.
- Do not omit a confirmed section merely to make the resume shorter.
- Do not create an EDUCATION section unless education was actually confirmed.
"""


def build_repair_prompt(original_resume, confirmed, validation):
    issues = validation["issues"]

    issue_text = "\n".join(
        f"- {issue['type']}: {issue['text']} — {issue['reason']}"
        for issue in issues
    )

    return f"""
The following resume failed NorthStar's factuality validator.

CONFIRMED USER INFORMATION:
{json.dumps(confirmed, indent=2)}

RESUME THAT FAILED:
{original_resume}

VALIDATION PROBLEMS:
{issue_text}

TASK:
Repair the resume and return the COMPLETE corrected resume.

Fix every validation problem, but preserve all valid confirmed content and sections from the original resume.

REQUIRED REPAIR BEHAVIOR:
- Do not shorten the resume just because one item failed validation.
- Preserve valid summary content.
- Preserve valid certifications.
- Preserve valid relevant experience and valid bullets.
- Preserve valid skills.
- Only remove or rewrite content that directly causes a validation problem.
- If confirmed skills exist, include a SKILLS section.
- If confirmed certifications exist, include a CERTIFICATIONS section.
- If confirmed experience or tasks exist, include a RELEVANT EXPERIENCE section.
- If enough confirmed facts exist, include a SUMMARY section.
- Return the entire corrected resume from the name/header through the final section.

Rules:
- Use only confirmed facts.
- Do not invent anything.
- Do not include alternate contacts.
- Do not add unconfirmed employers, job titles, dates, durations, metrics, certifications, languages, duties, or skills.
- Do not remove confirmed information unless it is itself the validation problem.
- Return the full corrected resume, not an explanation.
"""


def run_pipeline(confirmed, max_repairs=2):
    print("\nGenerating resume...\n")

    resume = generate(build_resume_prompt(confirmed))

    for attempt in range(max_repairs + 1):
        validation = validate_resume(resume, confirmed)

        print(f"Validation attempt {attempt + 1}:")
        print(json.dumps(validation, indent=2))

        if validation["valid"]:
            return {
                "success": True,
                "resume": resume,
                "validation": validation,
                "repairs": attempt,
            }

        if attempt >= max_repairs:
            break

        print("\nResume failed validation. Regenerating...\n")

        resume = generate(
            build_repair_prompt(
                resume,
                confirmed,
                validation,
            )
        )

    return {
        "success": False,
        "resume": None,
        "last_generated_resume": resume,
        "validation": validation,
        "repairs": max_repairs,
    }


if __name__ == "__main__":
    confirmed = {
        "name": "Maya Reed",
        "phone": "(555) 610-1820",
        "location": "Tacoma, WA 98402",

        "alternate_contact": "Harbor Outreach Desk",

        "experience_categories": [
            "Kitchen & Food Prep",
            "Janitorial & Cleaning",
        ],

        "tasks": [
            "Washed dishes",
            "Wiped counters",
            "Swept floors",
            "Took out trash",
        ],

        "employers": [],
        "possible_employers": [
            "Harbor Outreach Desk",
        ],

        "job_titles": [],
        "unconfirmed_job_titles": [
            "Forklift Operator",
        ],

        "dates": [],
        "durations": [],

        "confirmed_numbers": [],
        "contact_numbers": [
            "555",
            "610",
            "1820",
        ],

        "certifications": [
            "Food Handler Card",
        ],

        "languages": [],

        "skills": [
            "Kitchen Support",
            "Cleaning",
            "Sanitation",
            "Reliability & Punctuality",
        ],

        "target_jobs": [
            "Kitchen Staff & Prep",
            "Sanitation & Custodial",
        ],
    }

    result = run_pipeline(confirmed)

    print("\n" + "=" * 70)

    if result["success"]:
        print("FINAL APPROVED RESUME")
        print("=" * 70)
        print(result["resume"])
    else:
        print("RESUME BLOCKED")
        print("=" * 70)
        print("NorthStar could not produce a resume that passed validation.")
        print(json.dumps(result["validation"], indent=2))
