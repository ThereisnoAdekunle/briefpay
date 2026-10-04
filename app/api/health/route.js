export function GET() {
  return Response.json({
    ok: true,
    app: "briefpay",
    chainId: Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || 5042),
    escrowConfigured: Boolean(process.env.NEXT_PUBLIC_ESCROW_ADDRESS),
  });
}
