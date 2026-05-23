"""pytest configuration — prints a compact security test summary table after all tests run."""

import pytest


def pytest_terminal_summary(terminalreporter, exitstatus, config):
    """Print a results table after all tests complete."""
    passed = len(terminalreporter.stats.get("passed", []))
    failed = len(terminalreporter.stats.get("failed", []))
    skipped = len(terminalreporter.stats.get("skipped", []))
    errors = len(terminalreporter.stats.get("error", []))
    total = passed + failed + skipped + errors

    terminalreporter.section("SECURITY TEST SUMMARY", sep="=", blue=True)

    # Group results by test class
    classes = {}
    for nodeid in terminalreporter.stats.get("passed", []):
        cls = _get_class(nodeid.nodeid)
        classes.setdefault(cls, {"passed": 0, "failed": 0}).update(
            {"passed": classes.get(cls, {}).get("passed", 0) + 1}
        )
    for nodeid in terminalreporter.stats.get("failed", []):
        cls = _get_class(nodeid.nodeid)
        classes.setdefault(cls, {"passed": 0, "failed": 0}).update(
            {"failed": classes.get(cls, {}).get("failed", 0) + 1}
        )

    # Determine column widths
    max_name = max((len(k) for k in classes.keys()), default=30)
    max_name = max(max_name, 40)

    # Header
    terminalreporter.write_line(
        f"  {'TEST CATEGORY'.ljust(max_name)} {'PASSED':>6} {'FAILED':>6} {'STATUS'}"
    )
    terminalreporter.write_line(
        f"  {'-' * max_name} {'-' * 6} {'-' * 6} {'-' * 8}"
    )

    all_passed = 0
    all_failed = 0
    for cls_name, counts in sorted(classes.items()):
        p = counts.get("passed", 0)
        f = counts.get("failed", 0)
        all_passed += p
        all_failed += f
        status = "✓ PASS" if f == 0 else "✗ FAIL"
        terminalreporter.write_line(
            f"  {cls_name.ljust(max_name)} {str(p).rjust(6)} {str(f).rjust(6)}  {status}"
        )

    # Footer
    terminalreporter.write_line(f"  {'-' * max_name} {'-' * 6} {'-' * 6} {'-' * 8}")
    terminalreporter.write_line(
        f"  {'TOTAL'.ljust(max_name)} {str(all_passed).rjust(6)} {str(all_failed).rjust(6)}  "
        f"{'✓ ALL PASS' if all_failed == 0 else '✗ SOME FAILED'}"
    )
    terminalreporter.write_line("")

    # Print individual failures for reference
    if failed > 0:
        terminalreporter.section("FAILED TESTS", sep="-", red=True)
        for nodeid in terminalreporter.stats.get("failed", []):
            terminalreporter.write_line(f"  ✗ {nodeid.nodeid}")


def _get_class(nodeid: str) -> str:
    """Extract test class name from nodeid like tests/test_security.py::TestAuth::test_func."""
    parts = nodeid.split("::")
    if len(parts) >= 2:
        for p in parts:
            if p.startswith("Test"):
                return p
    return parts[0] if parts else nodeid
