#!/usr/bin/env python3
"""
GoDaddy Authentication Setup

Prompts for API key/secret and saves to .env file.
"""

import os
import sys
from pathlib import Path


def setup_auth(env_path: str | None = None):
    """Interactive setup for GoDaddy API credentials."""
    if env_path is None:
        env_path = Path(__file__).parent.parent / ".env"

    print("=" * 50)
    print("GoDaddy API Authentication Setup")
    print("=" * 50)
    print()
    print("1. Go to https://developer.godaddy.com/keys")
    print("2. Create a new API key pair (Production or Test)")
    print("3. Copy your Key and Secret below")
    print()

    api_key = input("API Key: ").strip()
    api_secret = input("API Secret: ").strip()

    if not api_key or not api_secret:
        print("\nError: Both API Key and Secret are required.")
        sys.exit(1)

    sandbox = input("Use Sandbox/Test Environment? (y/N): ").strip().lower() == "y"

    env_content = f"""# GoDaddy API Configuration
GO_DADDY_API_KEY={api_key}
GO_DADDY_API_SECRET={api_secret}
GO_DADDY_SANDBOX={"1" if sandbox else "0"}
"""

    with open(env_path, "w") as f:
        f.write(env_content)

    print(f"\nCredentials saved to: {env_path}")
    print("Run 'python3 test_connection.py' to verify.")


if __name__ == "__main__":
    setup_auth()
