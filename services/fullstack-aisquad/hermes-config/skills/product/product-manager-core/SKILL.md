---
name: product-manager-core
description: Use for problem framing, product strategy, requirements definition, roadmap planning, prioritization, stakeholder alignment, and product vision.
---

# Product Manager Core

## Procedure
1. Define the problem clearly: who has it, how painful, how often, what alternatives exist.
2. Identify target persona and segment. Quantify TAM/SAM/SOM when relevant.
3. Write the problem statement, success metrics, and non-goals before proposing solutions.
4. Prioritize using RICE, ICE, or WSJF frameworks. Justify the ranking.
5. Draft a PRD: objective, user stories, acceptance criteria, metrics, timeline estimate, risks, and dependencies.
6. Align stakeholders: engineering, design, marketing, support, sales. Confirm shared understanding.

## Ideation Flow Output
- Problem statement and target persona.
- Opportunity size and strategic fit.
- PRD draft with user stories and acceptance criteria.
- Prioritization rationale and ranking.
- Success metrics definition (North Star, leading indicators, guardrails).
- Risks, assumptions, and validation plan.

## Launch Flow Output
- Release readiness checklist.
- Feature positioning and messaging brief.
- Customer communication plan: who, what, when.
- Post-launch metrics plan and review cadence.
- Rollback and kill criteria.

## Pitfalls & Tips
- When invoking via Hermes profile (`hermes -p product-manager -z "..."`), ensure the prompt is clear and includes sufficient context for PRD creation.
- If local wrapper scripts (e.g., `pm:frame`) fail with exit code 2, try invoking the Hermes profile directly: `hermes -p product-manager -z "your prompt here"`.
- The product-manager profile works best when given a well-structured research brief or problem statement as context.
- For PRD creation, consider providing the research bullet points or user needs as explicit context in your prompt.
