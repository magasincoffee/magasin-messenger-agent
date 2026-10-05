import assert from "node:assert/strict";
import { isExplicitOrderConfirmation } from "../supabase/functions/_shared/agent.ts";
import {
  extractInboundMessages,
  verifyMetaSignature,
} from "../supabase/functions/_shared/meta.ts";

Deno.test("extractInboundMessages reads customer message and ignores echo", () => {
  const payload = {
    entry: [{
      id: "PAGE",
      messaging: [
        {
          sender: { id: "PSID" },
          recipient: { id: "PAGE" },
          timestamp: 123,
          message: { mid: "m1", text: "In 1000 ly 700ml" },
        },
        {
          sender: { id: "PAGE" },
          recipient: { id: "PSID" },
          message: { mid: "m2", text: "echo", is_echo: true },
        },
      ],
    }],
  };
  const rows = extractInboundMessages(payload);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].eventId, "m1");
  assert.equal(rows[0].pageId, "PAGE");
  assert.equal(rows[0].psid, "PSID");
});

Deno.test("verifyMetaSignature validates sha256 HMAC", async () => {
  const body = JSON.stringify({ object: "page" });
  const secret = "test-secret";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)),
  );
  const hex = [...signature].map((b) => b.toString(16).padStart(2, "0")).join("");
  assert.equal(await verifyMetaSignature(body, `sha256=${hex}`, secret), true);
  assert.equal(await verifyMetaSignature(body + "x", `sha256=${hex}`, secret), false);
});

Deno.test("explicit order confirmation guard is conservative", () => {
  assert.equal(isExplicitOrderConfirmation("Ok chốt đơn giúp mình"), true);
  assert.equal(isExplicitOrderConfirmation("Xác nhận đơn"), true);
  assert.equal(isExplicitOrderConfirmation("1000 ly giá bao nhiêu?"), false);
  assert.equal(isExplicitOrderConfirmation("Mình tham khảo trước"), false);
});
