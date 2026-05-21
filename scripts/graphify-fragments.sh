#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="${1:-$ROOT/graphify-fragments.json}"

cd "$ROOT"

python3 - "$MANIFEST" <<'PY'
import fnmatch
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

root = Path.cwd()
manifest_path = Path(sys.argv[1])
manifest = json.loads(manifest_path.read_text())
out_root = root / manifest.get("outputRoot", "graphify-out/fragments")
excludes = manifest.get("exclude", [])

def excluded(rel: str) -> bool:
    return any(fnmatch.fnmatch(rel, pattern) for pattern in excludes)

def copy_path(src_rel: str, dest_root: Path) -> None:
    src = root / src_rel
    if not src.exists():
        return
    if src.is_file():
        rel = src.relative_to(root).as_posix()
        if excluded(rel):
            return
        dest = dest_root / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        return
    for path in src.rglob("*"):
        rel = path.relative_to(root).as_posix()
        if excluded(rel):
            continue
        dest = dest_root / rel
        if path.is_dir():
            dest.mkdir(parents=True, exist_ok=True)
        elif path.is_file():
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, dest)

out_root.mkdir(parents=True, exist_ok=True)

for fragment in manifest["fragments"]:
    name = fragment["name"]
    target = out_root / name
    if target.exists():
        shutil.rmtree(target)
    target.mkdir(parents=True)

    (target / "FRAGMENT.md").write_text(
        f"# {name}\n\n"
        f"Phase: `{fragment.get('phase', 'unknown')}`\n\n"
        f"{fragment.get('description', '')}\n\n"
        "Included paths:\n"
        + "".join(f"- `{p}`\n" for p in fragment.get("paths", []))
    )

    for src_rel in fragment.get("paths", []):
        copy_path(src_rel, target)

    print(f"[graphify-fragments] built {target.relative_to(root)}")

    if os.environ.get("SKIP_GRAPHIFY") == "1":
        continue

    try:
        subprocess.run(["graphify", "update", "."], cwd=target, check=True)
    except FileNotFoundError:
        print("[graphify-fragments] graphify not found; copied fragment only", file=sys.stderr)
    except subprocess.CalledProcessError as exc:
        print(f"[graphify-fragments] graphify failed for {name}: {exc}", file=sys.stderr)
PY
