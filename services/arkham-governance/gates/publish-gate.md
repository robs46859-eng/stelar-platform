# Arkham Governance — Publish Gate

No content from FullStack AiSquad reaches any external channel without passing this gate.

## Gate Sequence

```
Agent drafts content
  → Compliance Reviewer (automated claim scan)
  → Arkham hard-block check (rules/hard-blocks.yaml)
  → Human review queue (publish-approval-queue on Service Bus)
  → Human approves or rejects
  → Approved: routed to distribution-manager for scheduling
  → Rejected: returned to agent with rejection reason, not retried without new draft
```

## Approval Table

| Content Type | Drafted By | Reviewed By | Approved By |
|---|---|---|---|
| Manuscript / guide copy | `content:write` | RN/IBCLC + compliance-reviewer | You |
| Disclaimer + refund policy | `compliance:review` | Lawyer | You |
| Stan / Etsy / Gumroad listings | `listing:publish` | compliance-reviewer | You |
| Pricing changes | `offer:design` | — | You |
| Email sends | `funnel:nurture` | compliance-reviewer | You |
| Social posts | `distribution:manage` | compliance-reviewer | You |
| Engagement comments | `engage:write` | compliance-reviewer | You |
| Partner outreach | `partner:scout` | compliance-reviewer | You |
| Affiliate payouts | `partner:scout` | — | You |
| Any public health claim | `compliance:review` | RN/IBCLC | You |

## Hard Limits (No Override)

- No auto-posting in first 90 days from any swarm
- No medical, legal, financial, or safety claim without full review chain
- No outreach send without human approval
- No affiliate link creation without partner approval
- No scraped private data in any published content
- No platform spam or burner-account automation
