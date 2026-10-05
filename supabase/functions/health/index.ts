const required = [
  "META_VERIFY_TOKEN",
  "META_APP_SECRET",
  "META_PAGE_ID",
  "META_PAGE_ACCESS_TOKEN",
  "META_GRAPH_API_VERSION",
  "OPS_SUPABASE_URL",
  "OPS_SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
];

Deno.serve(() => {
  const missing = required.filter((name) => !Deno.env.get(name)?.trim());
  return Response.json(
    {
      ok: missing.length === 0,
      configured: required.length - missing.length,
      required: required.length,
      missing,
    },
    { status: missing.length ? 503 : 200 },
  );
});
