export async function insertBrief(env, row) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return { stored: false, reason: "supabase_not_configured" };
  }
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/briefs`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Supabase insert failed");
  }
  return { stored: true, row: Array.isArray(payload) ? payload[0] : payload };
}
