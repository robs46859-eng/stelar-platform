#!/usr/bin/env python3
"""Setup Dynadot API key by prompting user."""

import os
import sys

def main():
    print("=== Dynadot API Setup ===\n")
    print("1. Log in at https://www.dynadot.com/")
    print("2. Go to Account → Settings → API Access")
    print("3. Generate an API key\n")
    
    api_key = input("Enter your Dynadot API key: ").strip()
    
    if not api_key:
        print("No API key entered. Exiting.")
        return
    
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    
    with open(env_path, "w") as f:
        f.write(f"DYNADOT_API_KEY={api_key}\n")
    
    print(f"\n[OK] Saved API key to {env_path}")
    print("You can now run: python3 scripts/test_connection.py")

if __name__ == "__main__":
    main()
