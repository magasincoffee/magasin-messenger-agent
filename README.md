# MAGASIN Messenger Agent

AI sales assistant for the Facebook Page **Xưởng In Ly Magasin Cup Cần Thơ**.

This repository receives customer-initiated Messenger events from Meta, consults the canonical OPS-WebApp product/pricing/inventory boundary, replies to customers, and converts an explicitly confirmed conversation into an OPS sales order with inventory reservation.

## Core invariant

- Inquiry: read **available stock** only.
- Quote: use canonical OPS pricing rules only.
- Explicit customer confirmation: create the sales order and **reserve** inventory atomically.
- Physical shipment: existing OPS warehouse flow performs **SALES_ISSUE**. The bot never reduces on-hand inventory at chat time.
- No direct table writes from a browser or Meta client.
- No service-role key in Git or frontend assets.
- Duplicate Meta events cannot create duplicate orders.

See `SOURCE_OF_TRUTH.md` for authoritative scope and state.

## Runtime

Supabase Edge Functions:
- `meta-webhook` — Meta verification + inbound Messenger webhook + background processing.
- `health` — non-secret configuration health check.

## Required secrets

```
META_VERIFY_TOKEN
META_APP_SECRET
META_PAGE_ID
META_PAGE_ACCESS_TOKEN
META_GRAPH_API_VERSION
OPS_SUPABASE_URL
OPS_SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
OPENAI_MODEL
```

Never commit real values. Use `.env.example` only as a name reference.

## Local checks

```bash
deno fmt --check
deno lint
deno check supabase/functions/meta-webhook/index.ts
deno test -A
```

## Production dependency

OPS integration is implemented in the paired OPS-WebApp PR that introduces Architecture Generation 5 messenger-channel RPCs. Do not enable live order confirmation until that OPS migration is merged/applied and OPS-075 cutover is complete.
