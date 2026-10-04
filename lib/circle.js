const CIRCLE_BASE = "https://api.circle.com/v1/w3s";

export async function circleFetch(path, apiKey, body) {
  if (!apiKey) throw new Error("CIRCLE_API_KEY is not set");
  const response = await fetch(`${CIRCLE_BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.message || payload.error || response.statusText;
    throw new Error(`Circle ${path} failed: ${message}`);
  }
  return payload;
}

export async function createArcWallet({ apiKey, walletSetId, refId }) {
  return circleFetch("/developer/wallets", apiKey, {
    walletSetId,
    blockchains: ["ARC"],
    accountType: "SCA",
    count: 1,
    metadata: [{ name: "Briefpay", refId }],
  });
}
