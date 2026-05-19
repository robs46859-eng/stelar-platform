---
name: quora-monitor-core
description: Use for monitoring Quora parenting questions — pregnancy prep, breastfeeding advice, birth planning queries matching Prepared Paige ICP jobs-to-be-done.
---

# Quora Monitor Core

## Role
Monitor Quora for high-intent questions from Prepared Paige demographic — women asking about pregnancy, postpartum, breastfeeding, baby sleep, and birth preparation.

## Target Topics
- Pregnancy (first trimester through delivery)
- Breastfeeding / Nursing
- Baby sleep / Sleep training
- Birth planning
- Postpartum recovery
- Newborn care
- Pregnancy registry / hospital bag

## Buy Signal Patterns
- Direct questions matching ICP jobs-to-be-done:
  - "How to prepare for labor?"
  - "What to put on a baby registry?"
  - "How to breastfeed without pain?"
  - "Baby won't sleep at night — what to do?"
  - "What to pack in hospital bag?"
  - "How to write a birth plan?"
- Questions from users who mention being first-time moms
- Questions with 0-2 answers (opportunity for helpful response)

## Procedure
1. Monitor via Quora RSS feeds for relevant topics
2. RSS format: https://www.quora.com/topic/{Topic}/rss
3. Parse feed for new questions
4. Score against ICP (direct questions = high commercial intent, +25 pts)
5. Flag signals 40+ (questions are inherently high-intent on Quora)
6. Prioritize unanswered questions (more visible, higher impact)

## Technical Notes
- Quora RSS is free and reliable
- Topics map well to ICP jobs-to-be-done
- Question format inherently signals information-seeking (= buying intent proxy)
- Quora users are often highly educated (70% bachelor's+ matches ICP)

## Data Format
Output to ~/hermes-workspace/memory/signal-engagement/raw-signals/quora-{timestamp}.json


## Checkpoint
Return STATE, QUESTIONS_FOUND, SIGNALS_FLAGGED, TOPICS_MONITORED, BLOCKER, NEXT_ACTION.
