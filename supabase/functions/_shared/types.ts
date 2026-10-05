export type MetaAttachment = {
  type?: string;
  payload?: { url?: string; [key: string]: unknown };
};

export type InboundMessage = {
  pageId: string;
  psid: string;
  eventId: string;
  text: string;
  attachments: MetaAttachment[];
  timestamp: number | null;
  raw: unknown;
};

export type ConversationMessage = {
  direction: "INBOUND" | "OUTBOUND";
  message_text: string | null;
  attachments: unknown;
  created_at: string;
};

export type OrderItem = {
  product_variant_id: string;
  packaging_id?: string | null;
  sale_quantity: number;
  print_mode?: "PLAIN" | "PRINTED";
  print_color_count?: number | null;
  print_specification?: string | null;
  artwork_reference?: string | null;
  requested_due_date?: string | null;
};

export type ConfirmOrderPayload = {
  external_order_key: string;
  page_id: string;
  psid: string;
  customer_display_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  requested_due_date?: string | null;
  notes?: string | null;
  items: OrderItem[];
};

export type AgentDecision = {
  action: "REPLY" | "SEARCH" | "QUOTE" | "CONFIRM_ORDER" | "HANDOFF";
  reply_text?: string;
  search_query?: string;
  product_variant_id?: string;
  packaging_id?: string | null;
  sale_quantity?: number;
  print_mode?: "PLAIN" | "PRINTED";
  print_color_count?: number | null;
  explicit_customer_confirmation?: boolean;
  handoff_reason?: string;
  order?: {
    customer_display_name?: string | null;
    customer_phone?: string | null;
    customer_address?: string | null;
    requested_due_date?: string | null;
    notes?: string | null;
    items: OrderItem[];
  };
};
