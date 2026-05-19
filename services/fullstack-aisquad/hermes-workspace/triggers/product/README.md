# Product Development Triggered Swarm

This directory contains local trigger payloads for the product development swarm.

Run a trigger without dispatching:

```bash
cd ~/fullstack-aisquad
node scripts/product-trigger-dispatch.mjs --dry-run triggers/product/templates/new-feature.json
```

Dispatch it to live swarm sessions:

```bash
cd ~/fullstack-aisquad
node scripts/product-trigger-dispatch.mjs triggers/product/templates/new-feature.json
```

Supported trigger types: `new_feature`, `user_feedback`, `competitive_gap`, `market_opportunity`, `internal_innovation`, `feature_release`, `product_update`, `beta_launch`, `optimization_experiment`.

External releases, announcements, pricing changes, platform deployments, and customer communications require human approval.
