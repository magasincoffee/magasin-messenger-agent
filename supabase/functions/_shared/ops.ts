import type {
  ConfirmOrderPayload,
  ConversationMessage,
} from "./types.ts";

export class OpsClient {
  constructor(
    private readonly baseUrl: string,
    private readonly serviceRoleKey: string,
  ) {}

  private async rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.baseUrl}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        "apikey": this.serviceRoleKey,
        "authorization": `Bearer ${this.serviceRoleKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`OPS RPC ${name} failed: ${response.status} ${text}`);
    }
    if (!text) return null as T;
    return JSON.parse(text) as T;
  }

  recordInboundEvent(args: {
    pageId: string;
    psid: string;
    eventId: string;
    eventType: string;
    payload: unknown;
  }): Promise<boolean> {
    return this.rpc("messenger_record_inbound_event", {
      p_page_id: args.pageId,
      p_psid: args.psid,
      p_event_id: args.eventId,
      p_event_type: args.eventType,
      p_payload: args.payload,
    });
  }

  appendMessage(args: {
    pageId: string;
    psid: string;
    messageId: string;
    direction: "INBOUND" | "OUTBOUND";
    text: string | null;
    attachments?: unknown;
    raw?: unknown;
  }): Promise<string> {
    return this.rpc("messenger_append_message", {
      p_page_id: args.pageId,
      p_psid: args.psid,
      p_message_id: args.messageId,
      p_direction: args.direction,
      p_message_text: args.text,
      p_attachments: args.attachments ?? [],
      p_raw_payload: args.raw ?? {},
    });
  }

  conversationContext(pageId: string, psid: string, limit = 20): Promise<ConversationMessage[]> {
    return this.rpc("messenger_get_conversation_context", {
      p_page_id: pageId,
      p_psid: psid,
      p_limit: limit,
    });
  }

  catalogSearch(query: string, limit = 8): Promise<unknown[]> {
    return this.rpc("messenger_catalog_stock_search", {
      p_query: query,
      p_limit: limit,
    });
  }

  quoteLine(args: {
    productVariantId: string;
    packagingId?: string | null;
    saleQuantity: number;
    printMode?: "PLAIN" | "PRINTED";
    printColorCount?: number | null;
  }): Promise<unknown> {
    return this.rpc("messenger_quote_line", {
      p_product_variant_id: args.productVariantId,
      p_packaging_id: args.packagingId ?? null,
      p_sale_quantity: args.saleQuantity,
      p_print_mode: args.printMode ?? "PLAIN",
      p_print_color_count: args.printColorCount ?? null,
    });
  }

  confirmOrder(payload: ConfirmOrderPayload): Promise<unknown> {
    return this.rpc("messenger_confirm_order", {
      p_external_order_key: payload.external_order_key,
      p_page_id: payload.page_id,
      p_psid: payload.psid,
      p_customer_display_name: payload.customer_display_name ?? null,
      p_customer_phone: payload.customer_phone ?? null,
      p_customer_address: payload.customer_address ?? null,
      p_requested_due_date: payload.requested_due_date ?? null,
      p_notes: payload.notes ?? null,
      p_items: payload.items,
    });
  }
}
