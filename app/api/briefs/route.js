import { createDealInput } from "../../../lib/deals.js";
import { insertBrief } from "../../../lib/supabase.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const deal = createDealInput(body);
    const stored = await insertBrief(
      {
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      {
        client_address: body.client || null,
        worker_address: deal.worker,
        amount_usdc: body.amount,
        brief: deal.brief,
        tx_hash: body.txHash || null,
      }
    );
    return Response.json({ ok: true, deal, stored });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 400 });
  }
}
