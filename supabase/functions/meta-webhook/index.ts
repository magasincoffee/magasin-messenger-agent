import { processInbound } from "../_shared/agent.ts";
import { runtimeConfig } from "../_shared/env.ts";
import { extractInboundMessages, verifyMetaSignature } from "../_shared/meta.ts";
import { OpsClient } from "../_shared/ops.ts";

function textResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

Deno.serve(async (request) => {
  const config = runtimeConfig();
  const url = new URL(request.url);

  if (request.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === config.metaVerifyToken && challenge) {
      return textResponse(challenge);
    }
    return textResponse("Forbidden", 403);
  }

  if (request.method !== "POST") return textResponse("Method Not Allowed", 405);

  const rawBody = await request.text();
  const valid = await verifyMetaSignature(
    rawBody,
    request.headers.get("x-hub-signature-256"),
    config.metaAppSecret,
  );
  if (!valid) return textResponse("Invalid signature", 401);

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return textResponse("Invalid JSON", 400);
  }

  const messages = extractInboundMessages(payload);
  const ops = new OpsClient(config.opsSupabaseUrl, config.opsServiceRoleKey);

  const jobs = messages.map(async (inbound) => {
    if (inbound.pageId !== config.metaPageId) {
      console.warn("Ignoring event for unexpected page");
      return;
    }
    try {
      await processInbound({
        inbound,
        ops,
        meta: {
          graphApiVersion: config.metaGraphApiVersion,
          pageAccessToken: config.metaPageAccessToken,
        },
        ai: {
          apiKey: config.openAiApiKey,
          model: config.openAiModel,
        },
      });
    } catch (error) {
      console.error("Messenger event processing failed", error);
    }
  });

  const background = Promise.all(jobs).then(() => undefined);
  const edgeRuntime = (globalThis as unknown as {
    EdgeRuntime?: { waitUntil: (promise: Promise<unknown>) => void };
  }).EdgeRuntime;

  if (edgeRuntime?.waitUntil) {
    edgeRuntime.waitUntil(background);
  } else {
    await background;
  }

  return textResponse("EVENT_RECEIVED");
});
