import { sendMetaText } from "./meta.ts";
import { OpsClient } from "./ops.ts";
import type {
  AgentDecision,
  ConversationMessage,
  InboundMessage,
} from "./types.ts";

export function isExplicitOrderConfirmation(text: string): boolean {
  const normalized = text.toLocaleLowerCase("vi").replace(/\s+/g, " ").trim();
  return /(xác nhận đặt|xác nhận đơn|chốt đơn|ok chốt|đồng ý đặt|đặt đơn|chốt nha|chốt nhé)/i.test(
    normalized,
  );
}

function extractOutputText(payload: any): string {
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content?.text === "string") {
        return content.text;
      }
    }
  }
  throw new Error("AI response did not contain output_text");
}

function parseDecision(text: string): AgentDecision {
  const cleaned = text.trim().replace(/^\`\`\`json\s*/i, "").replace(/\`\`\`$/, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!["REPLY", "SEARCH", "QUOTE", "CONFIRM_ORDER", "HANDOFF"].includes(parsed.action)) {
    throw new Error("AI returned unsupported action");
  }
  return parsed as AgentDecision;
}

async function decide(args: {
  apiKey: string;
  model: string;
  conversation: ConversationMessage[];
  latestText: string;
  toolContext: string;
}): Promise<AgentDecision> {
  const system = `
You are the sales assistant for Xưởng In Ly Magasin Cup Cần Thơ.
Reply in Vietnamese unless the customer uses another language.
You must output ONLY one JSON object.

Allowed actions:
REPLY: when you can answer safely from conversation/tool facts.
SEARCH: search canonical OPS catalog/stock before answering product availability.
QUOTE: request canonical OPS price for one exact product_variant_id and quantity.
CONFIRM_ORDER: only after all required line items are known AND the customer explicitly confirms the final order.
HANDOFF: discounts, complaints, disputes, exceptional custom production, ambiguous high-value orders, or missing canonical data.

Rules:
- Never invent stock, price, lead time, product mapping, discount, cost, margin or payment facts.
- Stock facts come only from OPS tool context.
- Price comes only from OPS quote tool context.
- Do not expose purchase cost or margin.
- A customer inquiry never reserves or issues stock.
- A confirmed order reserves inventory. It never physically issues stock.
- Never choose CONFIRM_ORDER for a mere question or soft intent.
- Printed items need print_mode PRINTED, print_color_count, due date, and any known artwork reference. Ask for missing facts.
- Plain items use print_mode PLAIN and print_color_count null.
- For CONFIRM_ORDER set explicit_customer_confirmation=true only if the latest customer message itself explicitly confirms/chốt the order.
- Never create a discount. Order items do not carry discount.
- If multiple catalog matches exist, ask the customer to clarify instead of guessing.

JSON shape:
{
 "action":"REPLY|SEARCH|QUOTE|CONFIRM_ORDER|HANDOFF",
 "reply_text":"string",
 "search_query":"string",
 "product_variant_id":"uuid",
 "packaging_id":"uuid|null",
 "sale_quantity":number,
 "print_mode":"PLAIN|PRINTED",
 "print_color_count":number|null,
 "explicit_customer_confirmation":boolean,
 "handoff_reason":"string",
 "order":{
   "customer_display_name":"string|null",
   "customer_phone":"string|null",
   "customer_address":"string|null",
   "requested_due_date":"YYYY-MM-DD|null",
   "notes":"string|null",
   "items":[{
     "product_variant_id":"uuid",
     "packaging_id":"uuid|null",
     "sale_quantity":number,
     "print_mode":"PLAIN|PRINTED",
     "print_color_count":number|null,
     "print_specification":"string|null",
     "artwork_reference":"string|null",
     "requested_due_date":"YYYY-MM-DD|null"
   }]
 }
}
`.trim();

  const transcript = args.conversation.slice(-20).map((m) =>
    `${m.direction === "INBOUND" ? "KHÁCH" : "MAGASIN"}: ${m.message_text ?? "[attachment]"}`
  ).join("\n");

  const input = `
Conversation:
${transcript}

Latest customer message:
${args.latestText || "[attachment only]"}

Canonical tool context:
${args.toolContext || "[none]"}
`.trim();

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${args.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: args.model,
      input: [
        { role: "system", content: [{ type: "input_text", text: system }] },
        { role: "user", content: [{ type: "input_text", text: input }] },
      ],
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return parseDecision(extractOutputText(body));
}

export async function processInbound(args: {
  inbound: InboundMessage;
  ops: OpsClient;
  meta: {
    graphApiVersion: string;
    pageAccessToken: string;
  };
  ai: {
    apiKey: string;
    model: string;
  };
}): Promise<void> {
  const { inbound, ops } = args;

  const isNew = await ops.recordInboundEvent({
    pageId: inbound.pageId,
    psid: inbound.psid,
    eventId: inbound.eventId,
    eventType: "MESSAGE",
    payload: inbound.raw,
  });
  if (!isNew) return;

  await ops.appendMessage({
    pageId: inbound.pageId,
    psid: inbound.psid,
    messageId: inbound.eventId,
    direction: "INBOUND",
    text: inbound.text || null,
    attachments: inbound.attachments,
    raw: inbound.raw,
  });

  const conversation = await ops.conversationContext(inbound.pageId, inbound.psid, 20);
  let toolContext = "";
  let reply = "";

  for (let step = 0; step < 4; step++) {
    const decision = await decide({
      apiKey: args.ai.apiKey,
      model: args.ai.model,
      conversation,
      latestText: inbound.text,
      toolContext,
    });

    if (decision.action === "SEARCH") {
      if (!decision.search_query) {
        reply = "Dạ, anh/chị cho em xin tên hoặc quy cách sản phẩm cần kiểm tra nhé.";
        break;
      }
      const rows = await ops.catalogSearch(decision.search_query, 8);
      toolContext += `\nCATALOG_SEARCH(${JSON.stringify(decision.search_query)}): ${JSON.stringify(rows)}`;
      continue;
    }

    if (decision.action === "QUOTE") {
      if (!decision.product_variant_id || !decision.sale_quantity || decision.sale_quantity <= 0) {
        reply = "Dạ, anh/chị cho em xin đúng sản phẩm và số lượng cần in/đặt để em kiểm tra giá nhé.";
        break;
      }
      const quote = await ops.quoteLine({
        productVariantId: decision.product_variant_id,
        packagingId: decision.packaging_id ?? null,
        saleQuantity: decision.sale_quantity,
        printMode: decision.print_mode ?? "PLAIN",
        printColorCount: decision.print_color_count ?? null,
      });
      toolContext += `\nCANONICAL_QUOTE: ${JSON.stringify(quote)}`;
      continue;
    }

    if (decision.action === "CONFIRM_ORDER") {
      const deterministicConfirmation = isExplicitOrderConfirmation(inbound.text);
      if (!decision.explicit_customer_confirmation || !deterministicConfirmation || !decision.order?.items?.length) {
        reply = decision.reply_text ||
          "Dạ, em đã tổng hợp đơn. Anh/chị nhắn “Xác nhận đơn” hoặc “Chốt đơn” để em giữ hàng và tạo đơn trên hệ thống nhé.";
        break;
      }

      const result = await ops.confirmOrder({
        external_order_key: `${inbound.pageId}:${inbound.psid}:${inbound.eventId}`,
        page_id: inbound.pageId,
        psid: inbound.psid,
        customer_display_name: decision.order.customer_display_name ?? null,
        customer_phone: decision.order.customer_phone ?? null,
        customer_address: decision.order.customer_address ?? null,
        requested_due_date: decision.order.requested_due_date ?? null,
        notes: decision.order.notes ?? null,
        items: decision.order.items,
      });
      toolContext += `\nCONFIRM_ORDER_RESULT: ${JSON.stringify(result)}`;
      continue;
    }

    if (decision.action === "HANDOFF") {
      reply = decision.reply_text ||
        "Dạ, trường hợp này em chuyển bộ phận phụ trách kiểm tra và phản hồi chính xác cho anh/chị nhé.";
      break;
    }

    reply = decision.reply_text?.trim() ||
      "Dạ, anh/chị cho em thêm thông tin sản phẩm và số lượng cần đặt để em kiểm tra nhé.";
    break;
  }

  if (!reply) {
    reply = "Dạ, em đã ghi nhận. Em cần kiểm tra thêm dữ liệu trước khi trả lời để tránh báo sai cho anh/chị.";
  }

  const sent = await sendMetaText({
    graphApiVersion: args.meta.graphApiVersion,
    pageAccessToken: args.meta.pageAccessToken,
    pageId: inbound.pageId,
    psid: inbound.psid,
    text: reply,
  });

  await ops.appendMessage({
    pageId: inbound.pageId,
    psid: inbound.psid,
    messageId: sent.message_id ?? `out:${inbound.eventId}`,
    direction: "OUTBOUND",
    text: reply,
    attachments: [],
    raw: sent,
  });
}
