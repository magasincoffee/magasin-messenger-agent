# OPS-WebApp integration contract

Messenger Agent never writes OPS tables directly.

It calls service-role-only RPCs supplied by OPS Architecture Generation 5:

- `messenger_record_inbound_event`
- `messenger_append_message`
- `messenger_get_conversation_context`
- `messenger_catalog_stock_search`
- `messenger_quote_line`
- `messenger_confirm_order`

## Inventory semantics

Customer inquiry:
`inventory_stock_snapshot.available_quantity` is the only customer-facing availability source.

Customer confirms:
`messenger_confirm_order` creates the OPS sales order and full `SALES_RESERVATION` movements atomically. Available stock drops immediately so another channel cannot sell the same quantity.

Warehouse dispatch:
existing OPS `issue_inventory_reservation` creates `SALES_ISSUE`, reducing on-hand stock. Messenger Agent cannot call physical issue.

## Idempotency

- Meta message event is unique by Page + event ID.
- Outbound/inbound messages are unique by Page + message ID + direction.
- Confirmed order is unique by `external_order_key`.
- Replayed webhook calls must return the existing order, never create another reservation.

## Pricing

The integration uses the same `private.resolve_quotation_price` path as canonical OPS quotation/sales-order workflows. Purchase cost and margin are not returned.
