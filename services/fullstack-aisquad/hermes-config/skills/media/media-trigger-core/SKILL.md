---
name: media-trigger-core
description: Use when processing local, cron, webhook, social, inbox, or manual events that should launch a media-pipeline swarm mission.
---

# Media Trigger Core

```json
{
  "type": "content_idea | trend_alert | production_request | editorial_deadline | publish_ready | performance_review | channel_update | content_audit",
  "source": "manual | cron | webhook | social | inbox",
  "content": {},
  "channel": "",
  "notes": ""
}
```

Rules:
- Missing fields are blockers only when needed for the next step.
- Preserve source links, URLs, and raw notes.
- Draft publishing and distribution actions; do not post, publish, or send without greenlight.
- Write artifacts under `memory/media/` or the assigned repo path.
