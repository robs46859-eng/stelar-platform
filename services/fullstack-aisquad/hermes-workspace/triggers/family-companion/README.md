# Family Companion Triggered Swarm

This directory contains local trigger payloads for the family-companion merger swarm.

Dry-run the ship mission:

```bash
cd /home/azureuser/fullstack-aisquad
node scripts/family-companion-trigger-dispatch.mjs --dry-run triggers/family-companion/templates/ship-merger.json
```

Dispatch it to live swarm sessions:

```bash
cd /home/azureuser/fullstack-aisquad
node scripts/family-companion-trigger-dispatch.mjs triggers/family-companion/templates/ship-merger.json
```

Supported trigger types: `ship_merger`, `backend_smoke`, `android_sync`, `release_gate`.

Production deploys, destructive database actions, credential use, public announcements, and external sends require human approval.
