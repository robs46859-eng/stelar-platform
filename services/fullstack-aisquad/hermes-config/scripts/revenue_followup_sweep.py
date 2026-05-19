#!/usr/bin/env python3
import subprocess
from pathlib import Path
repo = Path.home() / 'hermes-workspace'
subprocess.run(['node', str(repo / 'scripts/revenue-trigger-dispatch.mjs'), str(repo / 'triggers/revenue/templates/follow-up-due.json')], check=True)
