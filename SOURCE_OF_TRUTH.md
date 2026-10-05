# MAGASIN Messenger Agent — SOURCE OF TRUTH

> Project: `magasincoffee/magasin-messenger-agent`  
> Architecture Generation: 1  
> Status: IMPLEMENTED / EXTERNAL_CONFIGURATION_REQUIRED  
> Last authoritative update: 2026-10-05

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
