#!/bin/bash
set -euo pipefail

# Loads GeoIntel Reader project memory (CLAUDE.md + STATUS.md) as additional
# context at session start, so Claude can resume work without being briefed.

python3 - << 'PYEOF'
import json, os, pathlib

root = pathlib.Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))
parts = []
for name in ("CLAUDE.md", "STATUS.md"):
    f = root / name
    if f.exists():
        parts.append(f"=== {name} ===\n\n{f.read_text()}")

context = "\n\n---\n\n".join(parts) if parts else ""

print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": context
    }
}))
PYEOF
