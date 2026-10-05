import type { InboundMessage } from "./types.ts";

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return new Uint8Array();
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export async function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const supplied = hexToBytes(signatureHeader.slice("sha256=".length));
  if (supplied.length !== 32) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    supplied.buffer as ArrayBuffer,
    new TextEncoder().encode(rawBody),
  );
}

export function extractInboundMessages(payload: any): InboundMessage[] {
  const out: InboundMessage[] = [];
  for (const entry of payload?.entry ?? []) {
    for (const event of entry?.messaging ?? []) {
      const message = event?.message;
      if (!message?.mid || message?.is_echo) continue;
      const pageId = String(event?.recipient?.id ?? entry?.id ?? "");
      const psid = String(event?.sender?.id ?? "");
      if (!pageId || !psid) continue;
      out.push({
        pageId,
        psid,
        eventId: String(message.mid),
        text: String(message.text ?? "").trim(),
        attachments: Array.isArray(message.attachments) ? message.attachments : [],
        timestamp: Number.isFinite(event?.timestamp) ? Number(event.timestamp) : null,
        raw: event,
      });
    }
  }
  return out;
}

export async function sendMetaText(args: {
  graphApiVersion: string;
  pageAccessToken: string;
  pageId: string;
  psid: string;
  text: string;
}): Promise<{ message_id?: string }> {
  const url = `https://graph.facebook.com/${encodeURIComponent(args.graphApiVersion)}/me/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${args.pageAccessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      messaging_type: "RESPONSE",
      recipient: { id: args.psid },
      message: { text: args.text.slice(0, 2000) },
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Meta Send API failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return body;
}
