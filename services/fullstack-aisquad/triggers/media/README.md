# Media Triggered Swarm

This directory contains local trigger payloads for the media pipeline swarm.

Run a trigger without dispatching:

```bash
cd ~/fullstack-aisquad
node scripts/media-trigger-dispatch.mjs --dry-run triggers/media/templates/content-idea.json
```

Dispatch it to live swarm sessions:

```bash
cd ~/fullstack-aisquad
node scripts/media-trigger-dispatch.mjs triggers/media/templates/content-idea.json
```

Supported trigger types: `content_idea`, `trend_alert`, `production_request`, `editorial_deadline`, `publish_ready`, `performance_review`, `channel_update`, `content_audit`.

External publishing, platform posts, ad campaigns, customer-facing messages, and account changes remain human-greenlight actions.
