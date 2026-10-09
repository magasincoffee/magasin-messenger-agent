# MAGASIN Messenger Agent — SOURCE OF TRUTH

> Project: `magasincoffee/magasin-messenger-agent`  
> Architecture Generation: 2  
> Status: EXISTING_CHANNEL_EXTERNAL_CONFIGURATION_REQUIRED / PCOM_LAUNCH_APPROVED  
> Last authoritative update: 2026-10-09

## 0. Authority

This file is the sole authority for this project. New implementation sessions must read it from the beginning. Do not infer live connection state from README or chat history.

## 1. Objective

Operate an AI-assisted sales channel for the Facebook Page **Xưởng In Ly Magasin Cup Cần Thơ**:

`Messenger customer -> Meta webhook -> Messenger Agent -> OPS-WebApp canonical RPC boundary -> customer reply / confirmed OPS sales order`.

## 2. Locked architecture

1. Source code lives in this repository.
2. Runtime is Supabase Edge Functions over HTTPS.
3. Meta webhook signature must be verified with `X-Hub-Signature-256`.
4. Only customer-initiated inbound messages are eligible for automatic `RESPONSE` replies.
5. OPS-WebApp remains the source of truth for product, package conversion, pricing, customers, sales orders and inventory.
6. Messenger Agent must not directly mutate OPS business tables.
7. OPS access is server-side only through dedicated service-role-only RPCs introduced by OPS Architecture Generation 5.
8. Inquiry uses `available_quantity`; no stock promise may be invented.
9. Confirmed customer order creates/resolves the OPS customer, creates a sales order, confirms it and creates `SALES_RESERVATION` movements atomically.
10. Chat confirmation does **not** create `SALES_ISSUE`. Existing OPS warehouse issuance reduces on-hand stock only when goods physically leave.
11. Duplicate webhook events and duplicate order confirmations are idempotent.
12. AI cannot grant discounts, invent prices, invent lead times, expose cost/margin data, or bypass stock checks.
13. Complaints, exceptional discounts, unmapped custom production, legal/safety issues and ambiguous high-value orders hand off to a human.
14. Secrets must exist only in Supabase/GitHub secret stores, never tracked files.

## 3. Conversation behavior

The agent communicates in Vietnamese by default, concise and sales-oriented.

The agent may:
- identify product/size/print need;
- ask for missing quantity, material/variant, print colors, due date and artwork;
- search the OPS catalog;
- check available stock;
- quote only from OPS pricing;
- ask for explicit final confirmation;
- create a confirmed/reserved OPS order only after explicit confirmation;
- tell the customer when stock is insufficient and ask whether to choose another SKU/quantity;
- capture name/phone/address when needed.

The agent must hand off instead of guessing when:
- a discount is requested;
- the requested product/print specification is not mapped;
- the customer disputes a prior order/payment;
- stock or price data is unavailable;
- the customer requests a non-standard exception.

## 4. Data and privacy

- Store only conversation/order data needed for service, audit and follow-up.
- Meta PSID is operational data and must never be committed to Git.
- Raw webhook payloads stay in the database, not repository logs.
- Do not place payment credentials or secret tokens in prompts.
- Public repo content is treated as internet-visible.

## 5. Task ledger

- MMSG-001 Repository scaffold + CI — DONE
- MMSG-002 Meta webhook verification/signature/event parser — DONE
- MMSG-003 Durable event/message idempotency bridge — DONE (requires paired OPS Gen 5 migration applied)
- MMSG-004 AI sales decision loop + deterministic confirmation guard — DONE
- MMSG-005 OPS catalog/stock/quote/confirmed-order reservation integration — DONE (requires paired OPS Gen 5 migration applied)
- MMSG-006 Production deployment and secret injection — OWNER_REQUIRED
- MMSG-007 Meta App/Page webhook subscription and required permissions/Advanced Access — OWNER_REQUIRED
- MMSG-008 Live end-to-end test with a real Page test conversation — BLOCKED_BY MMSG-006/MMSG-007
- MMSG-009 Enable automatic customer replies — BLOCKED_BY MMSG-008 GREEN

## 6. Live enablement gate

Automatic replies must remain disabled until:
1. OPS Gen 5 migration is merged/applied after OPS-075;
2. Edge Functions are deployed;
3. required secrets are configured;
4. Meta webhook verification succeeds;
5. the Page is subscribed to message events;
6. a real test message is received, stored and replied to;
7. an inquiry proves stock lookup uses OPS;
8. a test confirmed order proves exactly one sales order and exactly one reservation set is created under duplicate webhook replay.

## 7. External configuration values

Required secret names:
- `META_VERIFY_TOKEN`
- `META_APP_SECRET`
- `META_PAGE_ID`
- `META_PAGE_ACCESS_TOKEN`
- `META_GRAPH_API_VERSION`
- `OPS_SUPABASE_URL`
- `OPS_SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Do not record their real values here.

## 8. Definition of done

Project is production-ready only when MMSG-001 through MMSG-009 are DONE and the paired OPS Gen 5 integration boundary is deployed.

## 9. Separate Facebook Page commerce launch — Owner approved 2026-10-09

### 9.1 Approved decision and authority
- Owner approved a NEW **separate Facebook Page** for plastic cups, food containers and packaging in urban Can Tho. Existing **Xưởng In Ly Magasin Cup Cần Thơ** Page remains unchanged: no renaming, repurposing, unauthorized posting, shared token, cross-Page data or account identity.
- Working name for NEW Page: **MAGASIN CUP – Ly Nhựa & Bao Bì Cần Thơ**, subject to Owner branding approval before public release. Page ID, URL and admin grants: **NOT YET VERIFIED**.
- Organic marketing only. **NO ads, boosting, paid budgets, unsolicited DMs, mass unsolicited comments, fabricated product claims or prices**. Schedule only reviewed content with rights-cleared real product imagery.
- Target work period: **2026-10-10 through 2026-10-16** Asia/Ho_Chi_Minh, no safety/permission gate bypass on deadline.
- This root SOT is sole authority for PCOM as well as legacy MMSG. Issue tracker/docs are supporting execution records, never competing authority.
- Approved new channel architecture extends Architecture Generation to 2 without changing original MMSG live status or OPS ownership. Runtime remains Supabase Edge Functions; OPS remains canonical for products, quote and inventory. Any multi-Page routing must be scoped by verified recipient Page ID and valid per-Page credentials, default deny.

### 9.2 Mandatory hard release gates
- **G0 governance**: approved decision, root SOT task ledger, dated evidences and no impact on original printing Page.
- **G1 Page**: authorized Meta admin creates new Page; URL/ID, ownership, correct brand/assets/contact and isolation recorded.
- **G2 catalog**: verified real SKU/material/capacity, packaging quantity conversion, canonical price, stock availability, legal/food-contact evidence and delivery zones; unknown values => human.
- **G3 Meta**: new Page-specific grant, app permission/advanced access where required, signature-verified inbound webhook, test of Messenger send and any comment replies within policy; old Page connection is not evidence for new Page.
- **G4 OPS**: OPS-075 DONE on OPS SOT AND paired Generation-5 RPC deployed/applied; read actual availability, price and package conversion; duplicate callbacks create exactly one confirmed sale and reservation, never SALES_ISSUE until warehouse dispatch; explicit customer confirmation and Owner live-order go-ahead required.
- **G5 content**: Owner-approved caption, verified claims, properly licensed real media, new Page permission before publication.
- **G6 UAT**: controlled new Page live test inbound, out-of-stock, ambiguous quote, handoff, permission denial, duplicate replay, privacy and rollback PASS.
- **G7 operations**: dashboard, bounded retries, dead-letter/alerts, resource limits, daily reports, final Go/No-Go.
- **FAIL-CLOSED:** no live automatic reply or production sales order writes without all relevant green gates. Paid spend permanently disallowed under this authorization.
- No service-role API key in browser or GitHub. No disclosure of PSIDs/customer PII in public evidence.

### 9.3 PCOM seven-day task ledger (legacy MMSG-001..009 unchanged)
| ID | Target ICT | Deliverable | Status | Issue |
|---|---|---|---|---|
| PCOM-001 | 2026-10-10 | Create new Page, branding/permissions, isolate existing Page (G1) | READY / META ACCESS REQUIRED | https://github.com/magasincoffee/magasin-messenger-agent/issues/2 |
| PCOM-002 | 2026-10-11 | SKU/price/stock/food-contact and packaging reconciliation (G2) | READY / OPS DEPENDENCY | https://github.com/magasincoffee/magasin-messenger-agent/issues/3 |
| PCOM-003 | 2026-10-12 | Messenger/comments scopes, signed webhook, routing tests (G3) | READY / META DEPENDENCY | https://github.com/magasincoffee/magasin-messenger-agent/issues/4 |
| PCOM-004 | 2026-10-13 | Staging canonical quote/order/reservation/idempotency (G4) | PRODUCTION BLOCKED BY OPS-075+GEN5 | https://github.com/magasincoffee/magasin-messenger-agent/issues/5 |
| PCOM-005 | 2026-10-14 | Approved organic content queue, publish only when G1/G3/G5 green | DRAFT READY / PUBLICATION LOCKED | https://github.com/magasincoffee/magasin-messenger-agent/issues/6 |
| PCOM-006 | 2026-10-15 | Controlled Page/UAT safety suite and rollback (G6) | BLOCKED BY G1-G4 | https://github.com/magasincoffee/magasin-messenger-agent/issues/7 |
| PCOM-007 | 2026-10-16 | Dashboard, error recovery, report and final Owner Go/No-Go (G7) | DESIGN READY / FINAL GATES PENDING | https://github.com/magasincoffee/magasin-messenger-agent/issues/8 |

### 9.4 Current state and execution evidence
- **Current task: PCOM-001**; earliest safe action: inspect Meta Page creation capability and grant readiness, prepare approved naming/brand. **Page created: NOT VERIFIED.**
- Existing **MMSG-006/007 OWNER_REQUIRED, MMSG-008/009 BLOCKED** remain; do not promote without proof.
- Checked OPS SOT on 2026-10-09: Architecture Generation 4 and **OPS-075 IN_PROGRESS**. Production inventory cutover and Generation-5 RPC readiness are not verified.
- Existing Windsor Facebook Organic connected Page list includes only Magasin Coffee and Xưởng In Ly Magasin Cup Cần Thơ. It supports post creation, but that does not prove ability to create new Pages, reply to Messenger or comment.
- For each task record sanitized evidence: commit SHA, CI/workflow run/conclusion, real Page URL if available, scoped token/permission result without secrets, stage test trace, and Owner signoff. Mark DONE only after proven checks and exact-main read-back.
- Supporting documents: `docs/PAGE_COMMERCE_7_DAY_RUNBOOK.md`, `docs/PAGE_COMMERCE_ORGANIC_DRAFTS.md`. They are non-authoritative.
