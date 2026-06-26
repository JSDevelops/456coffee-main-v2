#!/usr/bin/env python3
import os
import subprocess

os.chdir("/Users/3designs/456 Coffee/456 Coffee Ecosystem (Version 1.0)")

commands = [
    "git add -A",
    "git commit -m 'docs: add backend troubleshooting and quick fix guides'",
    "git push origin main"
]

for cmd in commands:
    print(f"▶️  Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(f"❌ Error: {result.stderr}")
        break
    print()

print("✅ Done!")
