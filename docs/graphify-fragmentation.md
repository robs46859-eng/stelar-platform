# Graphify Fragmentation

This repo is large enough that whole-repo `graphify update .` can be slow or hang after AST extraction. Use domain fragments instead of graphing generated/vendor-heavy paths.

## Build Fragments

```bash
./scripts/graphify-fragments.sh
```

The fragment manifest is `graphify-fragments.json`. Each fragment is copied to `graphify-out/fragments/<name>/` and graphified independently.

If graphify itself is hanging, materialize the fragments without running graphify:

```bash
SKIP_GRAPHIFY=1 ./scripts/graphify-fragments.sh
```

Preferred query pattern:

```bash
graphify query "how does auth reach the gateway?" --graph graphify-out/fragments/gateway/graphify-out/graph.json
graphify path "stelarpeople-api" "fullstack-gateway" --graph graphify-out/fragments/stelarpeople/graphify-out/graph.json
```

## Live Status Artifacts

Capture Azure state after deployments or smoke tests:

```bash
./scripts/capture-live-status.sh
```

Snapshots are written to `graphify-out/live/` and included by the `security-phase7` fragment.

## Fragment Strategy

- `gateway`: inference gateway and its deployment template
- `stelarpeople`: API, web app, and Container Apps modules
- `stelarvacay`: API, web app, and Container Apps modules
- `stelargem`: API, web app, and Container Apps modules
- `arkham`: governance service and deployment module
- `aisquad`: Hermes/AiSquad runtime files
- `infra-azure`: Bicep, scripts, and operational docs
- `security-phase7`: private networking, alerts, and live verification snapshots

Keep generated outputs, package directories, caches, and prior graphify cache files out of fragments. Add narrow fragments when a phase grows instead of widening a single graph.
