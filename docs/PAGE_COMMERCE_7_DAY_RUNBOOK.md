# Page Commerce — execution playbook (2026-10-10 to 2026-10-16)
Reference authority: ../SOURCE_OF_TRUTH.md section 9. This file is not a SOT.

## D1 PCOM-001 — Meta asset
Check Meta Business admin authority. Create a separate Page (proposed MAGASIN CUP – Ly Nhựa & Bao Bì Cần Thơ) without changing the pre-existing printing Page. Secure URL, ID and screenshots, approve name/logo/contact, verify access and Page isolation. If tools do not authorize creation, report exact owner action without inventing Page URL. G1.

## D2 PCOM-002 — Commercial truth
Record actual OPS SKU, cups, lids, containers, material and lid fit, carton/bag/piece conversion, canonical price tier, available inventory and sync time. Check food-contact supplier evidence for every specific claim; do not infer that all plastics are approved for all uses. Confirm OPS-075 cutover state and Gen5 RPC state. Unknown => human. G2.

## D3 PCOM-003 — API wiring
Validate new Page credentials and app review, signed X-Hub-Signature-256 webhook, inbox policies, conversation window, page-specific receiving and comment permissions. Test unauthorized/mismatched Page, invalid signature, retry and duplicate events. No general unsolicited outbound messages. G3.

## D4 PCOM-004 — Transactional staged orders
Only staging until OPS-075 DONE and Gen5 applied. Enforce price/availability from OPS, explicit customer confirmation, no negative available stock, idempotent one order + one SALES_RESERVATION, SALES_ISSUE only at warehouse dispatch. Test missing quantity/material and custom printing escalation. No production order writes. G4.

## D5 PCOM-005 — Organic publishing
Seven approved real-product posts, one feed post/day after launch if Page and content permissions GREEN, optional real short-form video. Verify license, SKU, price if stated, no free delivery promises unless verified. Document review signoff and public permalink or failed attempt. NO ad spend, boosting or spam. G5.

## D6 PCOM-006 — End to end UAT
Use Owner-controlled test conversation: cup 700 ml, two cartons, correct lid SKU, deliverability, ambiguous request, stock outage, missing price, duplicate callback and cancellation. Verify correct handoff and isolate new vs printing Page. Record sanitized logs and rollback. If G1-G4 not satisfied: staging only, live UAT BLOCKED. G6.

## D7 PCOM-007 — 24/7 operations readiness
Owner view shows Page metadata, webhook health, pending Messenger and comments, stale SKU data, abandoned/hand-off chats, content approvals, error queue and staging orders. Bounded retries/dead letter, secure secret handling, CPU/RAM limits for local robots, alerts, escalation and final Go/No-Go. G7.

## Evidence register (fill only with verified results)
- New Page ID / URL: UNVERIFIED
- Owner brand identity assets: PENDING
- Meta scopes and webhook subscriptions for new Page: PENDING
- OPS-075 DONE and Gen5 deployed: NOT VERIFIED (OPS-075 IN_PROGRESS as of 2026-10-09)
- Catalog/stock reconciliation: PENDING
- UAT conversation/run IDs: PENDING
- Live order creation switch: LOCKED, never enable from a date-based trigger
- Paid ads: DISALLOWED
- Organic posts published on new Page: NONE VERIFIED
- Final production go-live authority: OWNER REQUIRED
