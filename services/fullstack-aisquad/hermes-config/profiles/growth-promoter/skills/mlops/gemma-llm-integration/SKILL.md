---
name: Gemma LLM Integration Layer
description: Structured integration with Google Gemma via Gemini API — streaming, embeddings, routing, safety filters, and response scoring.
tags: [gemma, gemini-api, llm, streaming, embeddings, safety, routing, scoring]
created: 2026-05-13
---

# Gemma LLM Integration Layer (fscompanion)

## Architecture

```
User Request → Gemma Router (model + tone selection)
              → Safety Filters (input/output moderation)
              → Gemma Client (Gemini API call, streaming enabled)
              → Response Scoring (A–F quality grade)
              → Structured output back to agent
```

## Components

### 1. Gemma Client (`src/gemma/client.py`)

- Wraps Google Gemini API via `google-generativeai` SDK
- Supports **streaming** responses for real-time UX
- Supports **embeddings** via `models/embedding-001` for semantic search
- Centralized error handling with retry on rate limits

### 2. Prompts (`src/gemma/prompts.py`)

Six structured prompt templates covering the core use cases:

| Template | Purpose |
|----------|---------|
| `intake_prompt` | Initial family assessment and data gathering |
| `support_prompt` | Emotional + practical support response generation |
| `safety_prompt` | Risk assessment and alert generation |
| `routine_prompt` | Daily schedule and task generation |
| `memory_prompt` | Memory retrieval and summarization |
| `escalation_prompt` | When/how to escalate a concern |

Each template uses a `<persona>` injection point so the Tone Agent can swap styles without rebuilding the prompt.

### 3. Routing (`src/gemma/routing.py`)

- **Model selection** — picks the right Gemma variant (flash vs. 1T) based on complexity and latency requirements
- **Tone routing** — selects tone-appropriate prompt template based on the person's communication profile
- **Fallback** — if primary model is unavailable, degrades gracefully to a lighter variant

### 4. Safety Filters (`src/gemma/safety_filters.py`)

- Input moderation: flags harmful, self-harm, or crisis language
- Output moderation: checks generated content before returning to user
- Automatic escalation trigger when safety filter fires
- Uses both keyword patterns and model-based classification

### 5. Response Scoring (`src/gemma/response_scoring.py`)

- Grades every LLM response A–F on: relevance, accuracy, tone, safety
- Score feeds back into routing — low scores trigger model swap or human review
- Thresholds configurable per agent type (safety agents need higher bar than logistics)

## Key Design Decisions

- **Streaming by default** — users see progress, not a blank screen
- **Embeddings for memory search** — semantic retrieval beats keyword lookup
- **Safety before scoring** — a filtered response is never scored for quality
- **Routing is stateless** — decisions based on request context, not conversation history
- **Centralized client** — all agents share one gemma client instance, not per-agent connections

## When to Use

- Any agent needs LLM-generated text (support responses, summaries, suggestions)
- You need structured prompting with persona injection
- Safety is critical (healthcare, family care contexts)
- Latency matters — routing picks fast models for simple tasks

## Pitfalls

- Don't embed user PII directly in prompts — use anonymized references
- Streaming requires frontend support — fallback to non-streaming if needed
- Safety filters can be overly aggressive — tune thresholds per context
- Response scoring is subjective — calibrate thresholds with real usage data