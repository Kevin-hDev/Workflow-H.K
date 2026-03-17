#!/usr/bin/env python3
"""Phase End Protocol — threat-modeling v1.1.0

Called by hooks/phase_end_hook.sh after each phase report is written.
Validates phase YAML data and provides transition guidance.

Usage:
    python3 phase_data.py --phase-end --phase N --file PATH --root PATH
"""

import argparse
import json
import os
import re
import sys

MAX_PATH_LEN = 4096
VALID_PHASES = {0, 1, 2, 3, 4, 5, 6, 7, 8}

PHASE_YAML_FILES = {
    0: "P0_detection.yaml",
    1: "P1_project_context.yaml",
    2: "P2_dfd_elements.yaml",
    3: "P3_boundary_context.yaml",
    4: "P4_security_gaps.yaml",
    5: "P5_threat_inventory.yaml",
    6: "P6_validated_risks.yaml",
    7: "P7_mitigation_plan.yaml",
    8: "P8_report_manifest.yaml",
}

NEXT_PHASE_QUERIES = {
    0: "--phase-start --phase 1",
    1: "--phase-start --phase 2",
    2: "--phase-start --phase 3",
    3: "--phase-start --phase 4",
    4: "--phase-start --phase 5",
    5: "--phase-start --phase 6",
    6: "--phase-start --phase 7",
    7: "--phase-start --phase 8",
    8: None,
}


def validate_path(path: str) -> str:
    """Validate a filesystem path: no traversal, bounded length."""
    if not path or len(path) > MAX_PATH_LEN:
        raise ValueError("Path is empty or exceeds maximum length")
    if ".." in path.split(os.sep):
        raise ValueError("Path traversal detected")
    normalized = os.path.normpath(path)
    if ".." in normalized.split(os.sep):
        raise ValueError("Path traversal detected after normalization")
    return normalized


def find_session_dir(phase_working_dir: str) -> str | None:
    """Find the most recent session directory containing a data/ subdir."""
    if not os.path.isdir(phase_working_dir):
        return None

    candidates = []
    try:
        entries = os.listdir(phase_working_dir)
    except OSError:
        return None

    for entry in entries:
        if entry.startswith("_") or entry.startswith("."):
            continue
        full = os.path.join(phase_working_dir, entry)
        if os.path.isdir(full) and os.path.isdir(os.path.join(full, "data")):
            candidates.append(full)

    if not candidates:
        return None

    candidates.sort(key=lambda p: os.path.getmtime(p), reverse=True)
    return candidates[0]


def validate_entry_gate(phase_num: int, data_dir: str) -> list[str]:
    """Check that the previous phase's YAML exists."""
    issues = []
    if phase_num < 2:
        return issues

    prev_phase = phase_num - 1
    prev_file = PHASE_YAML_FILES.get(prev_phase)
    if prev_file:
        prev_path = os.path.join(data_dir, prev_file)
        if not os.path.isfile(prev_path):
            issues.append(
                f"Entry gate: P{prev_phase} YAML not found at {prev_file}"
            )
    return issues


def validate_yaml_basic(phase_num: int, data_dir: str) -> list[str]:
    """Basic validation: check current phase YAML exists and is non-empty."""
    issues = []
    yaml_file = PHASE_YAML_FILES.get(phase_num)
    if not yaml_file:
        issues.append(f"Unknown phase number: {phase_num}")
        return issues

    yaml_path = os.path.join(data_dir, yaml_file)
    if not os.path.isfile(yaml_path):
        issues.append(f"Phase {phase_num} YAML not found: {yaml_file}")
        return issues

    try:
        size = os.path.getsize(yaml_path)
        if size == 0:
            issues.append(f"Phase {phase_num} YAML is empty: {yaml_file}")
    except OSError as exc:
        issues.append(f"Cannot read phase {phase_num} YAML: {exc}")

    return issues


def validate_count_conservation(data_dir: str) -> list[str]:
    """For P6, check that count conservation can be verified (basic check)."""
    issues = []
    p5_path = os.path.join(data_dir, "P5_threat_inventory.yaml")
    p6_path = os.path.join(data_dir, "P6_validated_risks.yaml")

    if not os.path.isfile(p5_path) or not os.path.isfile(p6_path):
        return issues

    try:
        with open(p5_path, "r", encoding="utf-8") as fh:
            p5_content = fh.read()
        with open(p6_path, "r", encoding="utf-8") as fh:
            p6_content = fh.read()
    except OSError:
        return issues

    total_match = re.search(r"total:\s*(\d+)", p5_content)
    if not total_match:
        return issues

    p5_total = int(total_match.group(1))

    counts = {"total_verified": 0, "total_theoretical": 0, "total_pending": 0, "total_excluded": 0}
    for label in counts:
        m = re.search(rf"{label}:\s*(\d+)", p6_content)
        if m:
            counts[label] = int(m.group(1))

    verified = counts["total_verified"]
    theoretical = counts["total_theoretical"]
    pending = counts["total_pending"]
    excluded = counts["total_excluded"]

    p6_sum = verified + theoretical + pending + excluded
    if p6_sum > 0 and p6_sum != p5_total:
        issues.append(
            f"Count conservation violation: P5 total={p5_total}, "
            f"P6 sum={p6_sum} "
            f"(verified={verified} + theoretical={theoretical} "
            f"+ pending={pending} + excluded={excluded})"
        )

    return issues


def run_phase_end(phase_num: int, _file_path: str, root_path: str) -> dict:
    """Execute phase-end validation and return structured result."""
    issues: list[str] = []

    phase_working_candidates = [
        os.path.join(root_path, "audit", "Risk_Assessment_Report", ".phase_working"),
        os.path.join(root_path, ".phase_working"),
    ]

    session_dir = None
    for pw_dir in phase_working_candidates:
        session_dir = find_session_dir(pw_dir)
        if session_dir:
            break

    if not session_dir:
        return {
            "overall_status": "warning",
            "validation": {
                "status": "skipped",
                "issues": ["No session directory found in .phase_working/"],
            },
            "next_phase": {
                "number": phase_num + 1 if phase_num < 8 else None,
                "query_command": NEXT_PHASE_QUERIES.get(phase_num),
            },
        }

    data_dir = os.path.join(session_dir, "data")

    gate_issues = validate_entry_gate(phase_num, data_dir)
    issues.extend(gate_issues)

    yaml_issues = validate_yaml_basic(phase_num, data_dir)
    issues.extend(yaml_issues)

    if phase_num == 6:
        conservation_issues = validate_count_conservation(data_dir)
        issues.extend(conservation_issues)

    if any("Entry gate" in i for i in issues):
        overall = "blocking"
        status = "failed"
    elif issues:
        overall = "warning"
        status = "issues_found"
    else:
        overall = "success"
        status = "passed"

    next_num = phase_num + 1 if phase_num < 8 else None
    next_query = NEXT_PHASE_QUERIES.get(phase_num)

    return {
        "overall_status": overall,
        "validation": {
            "status": status,
            "issues": issues,
        },
        "next_phase": {
            "number": next_num,
            "query_command": next_query,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Phase data validation for threat-modeling skill"
    )
    parser.add_argument(
        "--phase-end",
        action="store_true",
        help="Run phase-end validation",
    )
    parser.add_argument(
        "--phase-start",
        action="store_true",
        help="Run phase-start preparation",
    )
    parser.add_argument(
        "--phase",
        type=int,
        required=True,
        help="Phase number (1-8)",
    )
    parser.add_argument(
        "--file",
        type=str,
        required=True,
        help="Path to the phase file",
    )
    parser.add_argument(
        "--root",
        type=str,
        required=True,
        help="Project root path",
    )

    args = parser.parse_args()

    if args.phase not in VALID_PHASES:
        result = {
            "overall_status": "blocking",
            "validation": {
                "status": "failed",
                "issues": [f"Invalid phase number: {args.phase}"],
            },
            "next_phase": {"number": None, "query_command": None},
        }
        print(json.dumps(result))
        sys.exit(1)

    try:
        validated_file = validate_path(args.file)
        root_path = validate_path(args.root)
    except ValueError as exc:
        result = {
            "overall_status": "blocking",
            "validation": {
                "status": "failed",
                "issues": [f"Path validation error: {exc}"],
            },
            "next_phase": {"number": None, "query_command": None},
        }
        print(json.dumps(result))
        sys.exit(1)

    if args.phase_end:
        result = run_phase_end(args.phase, validated_file, root_path)
        print(json.dumps(result))
        exit_code = 0 if result["overall_status"] == "success" else 1
        sys.exit(exit_code)

    result = {
        "overall_status": "warning",
        "validation": {
            "status": "skipped",
            "issues": ["No action specified (use --phase-end)"],
        },
        "next_phase": {"number": None, "query_command": None},
    }
    print(json.dumps(result))


if __name__ == "__main__":
    main()
