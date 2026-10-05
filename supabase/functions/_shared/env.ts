export function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function runtimeConfig() {
  return {
    metaVerifyToken: requiredEnv("META_VERIFY_TOKEN"),
    metaAppSecret: requiredEnv("META_APP_SECRET"),
    metaPageId: requiredEnv("META_PAGE_ID"),
    metaPageAccessToken: requiredEnv("META_PAGE_ACCESS_TOKEN"),
    metaGraphApiVersion: requiredEnv("META_GRAPH_API_VERSION"),
    opsSupabaseUrl: requiredEnv("OPS_SUPABASE_URL").replace(/\/$/, ""),
    opsServiceRoleKey: requiredEnv("OPS_SUPABASE_SERVICE_ROLE_KEY"),
    openAiApiKey: requiredEnv("OPENAI_API_KEY"),
    openAiModel: requiredEnv("OPENAI_MODEL"),
  };
}
