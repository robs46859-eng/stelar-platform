# FullStack AiSquad Agent Contract

This workspace uses semantic Hermes swarm workers, not numbered-only lanes. The source of truth for routing is `swarm.yaml`; each worker also has a matching profile under `~/.hermes/profiles/<worker-id>/`, a role skill `<worker-id>-core`, and a wrapper in `~/.local/bin/`.

## Current semantic roster

### Base Swarm
| Worker | Wrapper | Tools | Skills | MCP |
|---|---|---|---|---|
| `orchestrator` | `orchestrator:plan` | todo, kanban, delegation, terminal, file, gbrain, session_search, cronjob, skills, clarify, web | orchestrator-core, gstack-for-hermes, gbrain, kanban-orchestrator, subagent-driven-development, writing-plans, requesting-code-review, workspace-dispatch | gbrain |
| `km-agent` | `km:health` | gbrain, file, terminal, session_search, skills, todo, cronjob, web | km-agent-core, gbrain, obsidian-markdown, obsidian-cli, obsidian-bases, json-canvas, gstack-for-hermes | gbrain |
| `builder` | `builder:task` | terminal, file, browser, web, gbrain, session_search, skills, todo | builder-core, gstack-for-hermes, test-driven-development, systematic-debugging, github-pr-workflow, requesting-code-review, codebase-inspection | gbrain |
| `reviewer` | `reviewer:gate` | terminal, file, web, gbrain, session_search, skills | reviewer-core, requesting-code-review, github-code-review, systematic-debugging, gstack-for-hermes, gbrain, codebase-inspection | gbrain |
| `qa` | `qa:smoke` | browser, terminal, file, vision, gbrain, session_search, skills, web | qa-core, browser-harness-power-use, dogfood, gstack-for-hermes | gbrain |
| `researcher` | `researcher:quick` | gbrain, web, browser, terminal, file, vision, session_search, skills, todo | researcher-core, gbrain, autoresearch, browser-harness-power-use, gstack-for-hermes, researcher-quick, researcher-autoresearch, arxiv, youtube-content, polymarket | gbrain |
| `ops-watch` | `ops:health` | terminal, cronjob, file, gbrain, skills, session_search, web | ops-watch-core, gbrain, hermes-agent, systematic-debugging, webhook-subscriptions | gbrain |
| `maintainer` | `maintainer:check` | terminal, file, web, browser, gbrain, session_search, skills | maintainer-core, github-repo-management, github-pr-workflow, github-issues, github-code-review, gbrain, gstack-for-hermes, hermes-agent | gbrain |
| `strategist` | `strategist:review` | gbrain, web, session_search, file, skills, todo, clarify | strategist-core, gstack-for-hermes, gbrain, writing-plans, polymarket | gbrain |
| `inbox-triage` | `inbox:triage` | gbrain, web, file, session_search, todo, skills, terminal | inbox-triage-core, gbrain, obsidian-markdown, gstack-for-hermes, defuddle, youtube-content | gbrain |

### Revenue Swarm
| Worker | Wrapper | Tools | Skills | MCP |
|---|---|---|---|---|
| `revenue-orchestrator` | `revenue:orchestrate` | todo, kanban, delegation, terminal, file, session_search, cronjob, skills, web | revenue-orchestrator-core, revenue-trigger-core, compliance-greenlight, gstack-for-hermes, workspace-dispatch | none |
| `market-intel` | `market:scan` | web, browser, terminal, file, session_search, skills, todo | market-intel-core, researcher-core, gbrain, defuddle | none |
| `offer-architect` | `offer:design` | file, terminal, web, session_search, skills, todo | offer-architect-core, gstack-for-hermes, compliance-greenlight | none |
| `solution-builder` | `solution:build` | terminal, file, browser, web, session_search, skills, todo | solution-builder-core, builder-core, test-driven-development, systematic-debugging, codebase-inspection | none |
| `listing-manager` | `listing:publish` | file, web, browser, session_search, skills, todo | listing-manager-core, compliance-greenlight, gstack-for-hermes | none |
| `growth-promoter` | `growth:promote` | file, web, browser, session_search, skills, todo | growth-promoter-core, compliance-greenlight, defuddle | none |
| `sales-closer` | `sales:close` | file, web, browser, session_search, skills, todo | sales-closer-core, compliance-greenlight, offer-architect-core | none |
| `delivery-manager` | `delivery:manage` | terminal, file, web, session_search, skills, todo | delivery-manager-core, solution-builder-core, qa-core, compliance-greenlight | none |
| `customer-success` | `success:followup` | file, web, browser, session_search, skills, todo | customer-success-core, sales-closer-core, compliance-greenlight | none |

### Media Swarm
| Worker | Wrapper | Tools | Skills | MCP |
|---|---|---|---|---|
| `media-orchestrator` | `media:orchestrate` | todo, kanban, delegation, terminal, file, session_search, cronjob, skills, web | media-orchestrator-core, media-trigger-core, compliance-greenlight, gstack-for-hermes, workspace-dispatch | none |
| `content-researcher` | `content:research` | web, browser, terminal, file, session_search, skills, todo | content-researcher-core, youtube-content, defuddle, gbrain | none |
| `content-planner` | `content:plan` | file, terminal, web, session_search, skills, todo | content-planner-core, gstack-for-hermes, writing-plans | none |
| `content-writer` | `content:write` | file, terminal, web, browser, session_search, skills, todo | content-writer-core, humanizer, defuddle | none |
| `content-producer` | `content:produce` | terminal, file, browser, web, session_search, skills, todo, vision | content-producer-core, manim-video, heartmula, p5js | none |
| `visual-designer` | `visual:design` | file, terminal, web, browser, session_search, skills, todo, vision | visual-designer-core, baoyu-infographic, architecture-diagram, excalidraw | none |
| `distribution-manager` | `distribution:manage` | file, web, browser, terminal, session_search, skills, todo | distribution-manager-core, compliance-greenlight | none |
| `analytics-reviewer` | `analytics:review` | file, web, browser, terminal, session_search, skills, todo | analytics-reviewer-core, qa-core, defuddle | none |

### Product Swarm
| Worker | Wrapper | Tools | Skills | MCP |
|---|---|---|---|---|
| `product-orchestrator` | `product:orchestrate` | todo, kanban, delegation, terminal, file, session_search, cronjob, skills, web | product-orchestrator-core, product-trigger-core, compliance-greenlight, gstack-for-hermes, workspace-dispatch | none |
| `product-manager` | `pm:frame` | file, terminal, web, browser, session_search, skills, todo | product-manager-core, gstack-for-hermes, writing-plans | none |
| `product-experience-director` | `ped:vision` | file, terminal, web, browser, vision, session_search, skills, todo | product-experience-director-core, excalidraw, sketch, design-md | none |
| `product-engineer` | `pe:build` | terminal, file, browser, web, session_search, skills, todo, delegation | product-engineer-core, builder-core, test-driven-development, systematic-debugging, codebase-inspection, architecture-diagram | none |
| `product-marketing-manager` | `pmm:launch` | file, terminal, web, browser, session_search, skills, todo | product-marketing-core, compliance-greenlight, defuddle | none |
| `project-manager` | `md:track` | todo, kanban, terminal, file, web, session_search, skills | project-manager-core, gstack-for-hermes, kanban-orchestrator | none |
| `product-qa` | `qa:verify` | browser, terminal, file, vision, web, session_search, skills, todo | product-qa-core, qa-core, browser-harness-power-use | none |
| `brand-visionary` | `bv:brand` | file, terminal, web, browser, vision, session_search, skills, todo | brand-visionary-core, humanizer, defuddle | none |


### Engagement Swarm

| Worker | Wrapper | Tools | Skills | MCP |
|---|---|---|---|---|
| `signal-orchestrator` | `signal:orchestrate` | file, terminal, todo, session_search, skills, cronjob | signal-orchestrator-core, icp-prepared-paige, kanban-orchestrator | none |
| `reddit-monitor` | `reddit:monitor` | web, browser, file, terminal, session_search, skills | reddit-monitor-core, icp-prepared-paige, humanizer | none |
| `youtube-monitor` | `yt:monitor` | web, browser, file, terminal, skills | youtube-monitor-core, icp-prepared-paige, humanizer | none |
| `linkedin-monitor` | `linkedin:monitor` | browser, web, file, skills | linkedin-monitor-core, icp-prepared-paige, humanizer | none |
| `quora-monitor` | `quora:monitor` | browser, web, file, terminal, skills | quora-monitor-core, icp-prepared-paige, humanizer | none |
| `instagram-monitor` | `ig:monitor` | browser, web, file, skills, vision | instagram-monitor-core, icp-prepared-paige, humanizer | none |
| `engagement-writer` | `engage:write` | file, browser, web, session_search, skills, todo | engagement-writer-core, humanizer, icp-prepared-paige | none |
| `compliance-reviewer` | `compliance:review` | file, browser, web, terminal, session_search, skills | compliance-reviewer-core, icp-prepared-paige | none |
| `funnel-manager` | `funnel:nurture` | file, web, browser, terminal, session_search, skills, todo | funnel-manager-core, icp-prepared-paige, humanizer | none |
| `partnership-scout` | `partner:scout` | web, browser, file, session_search, skills, todo | partnership-scout-core, icp-prepared-paige, humanizer | none |


### LLM Integration Swarm
|| Worker | Wrapper | Tools | Skills | MCP ||
||---|---|---|---|---||
|| `llm-integrator` | `llm:integrate` | terminal, file, web, session_search, skills, gbrain, todo | llm-integration-core, gstack-for-hermes | none ||

### Family Companion Ship Swarm
| Worker | Wrapper | Tools | Skills | MCP |
|---|---|---|---|---|
| `family-backend-integrator` | `fc:backend` | terminal, file, web, session_search, skills, todo | family-backend-integrator-core, builder-core, systematic-debugging, codebase-inspection | none |
| `family-android-integrator` | `fc:android` | terminal, file, web, session_search, skills, todo | family-android-integrator-core, builder-core, test-driven-development, codebase-inspection | none |
| `family-db-migration` | `fc:db` | terminal, file, web, session_search, skills, todo | family-db-migration-core, systematic-debugging, test-driven-development | none |
| `family-qa-smoke` | `fc:qa` | browser, terminal, file, web, session_search, skills, todo | family-qa-smoke-core, qa-core, browser-harness-power-use, systematic-debugging | none |
| `family-release-docs` | `fc:release` | terminal, file, web, session_search, skills, todo | family-release-docs-core, writing-plans, gstack-for-hermes | none |

## Operating rules

- Keep `swarm.yaml`, profile `config.yaml`, profile core skills, and wrappers aligned when changing a worker.
- Prefer GBrain-first lookup for context-sensitive RAZSOC/Hermes/workflow decisions.
- Builder implements; Reviewer gates; QA verifies behavior; Orchestrator routes and enforces greenlight.
- Revenue, Media, and Product swarms operate as independent pipelines with their own orchestrators, triggers, and approval gates.
- Do not enable optional Hermes plugins globally unless the task explicitly needs them; record plugin/toolset alignment in `swarm.yaml` first.
