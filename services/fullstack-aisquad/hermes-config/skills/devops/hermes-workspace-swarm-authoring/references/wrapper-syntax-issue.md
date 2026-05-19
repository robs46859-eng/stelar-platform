# Wrapper Syntax Issue Resolution

## Problem
When creating CLI wrappers for Hermes Workspace swarm workers, I initially tried to pass prompts directly as arguments:
```
llm:integrate "Let's start by auditing the current Gemma implementation..."
```
This resulted in errors because the wrapper passes all arguments directly to `hermes`, which interprets the first argument as a command.

## Root Cause
The wrapper script:
```sh
#!/bin/sh
exec hermes -p llm-integrator "$@"
```
When called with `llm:integrate "some text"`, it executes:
```
hermes -p llm-integrator "some text"
```
Hermes then tries to interpret `"some text"` as a command (like `chat`, `model`, etc.), which fails.

## Solution
Use the proper Hermes CLI syntax when invoking through wrappers:
- For chat prompts: `hermes -p <profile-id> chat -z "your prompt here"`
- For other commands: `hermes -p <profile-id> <command> [options]`

## Correct Usage Examples
```bash
# Correct: Chat with a prompt
llm:integrate chat -z "Let's start by auditing the current Gemma implementation in fscompanion..."

# Correct: Check status
llm:integrate status

# Correct: List skills
llm:integrate skills
```

## Prevention
When documenting wrapper usage in skills or runbooks, always specify the full command structure including the required subcommand (`chat`, `model`, etc.) and appropriate flags.