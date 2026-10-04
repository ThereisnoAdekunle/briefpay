import { createArcWallet } from "../../../lib/circle.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const refId = String(body.refId || "").trim();
    if (refId.length < 3) {
      return Response.json({ ok: false, error: "refId is required" }, { status: 400 });
    }
    const wallet = await createArcWallet({
      apiKey: process.env.CIRCLE_API_KEY,
      walletSetId: process.env.CIRCLE_WALLET_SET_ID,
      refId,
    });
    return Response.json({ ok: true, wallet });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 400 });
  }
}
