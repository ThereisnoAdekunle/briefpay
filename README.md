# Briefpay

Milestone USDC escrow for freelance briefs on Arc. The client funds the brief, the worker delivers, and the contract releases once — immediately, after a 3-day review window, or by arbiter ruling.

Built for the [Arc Microgrants mainnet challenge](https://dorahacks.io/hackathon/arc-microgrants/detail). A scored submission needs this public repo plus a live Arc mainnet deployment.

## Product

Freelance invoices in markets with slow wires and frozen accounts need a hold, not another chat thread. Briefpay keeps the fee in Circle USDC on Arc (chain id 5042, USDC gas, instant finality) until the brief is delivered.

## Stack

Next.js, ethers v6, Solidity 0.8.26, Supabase for the brief index, Circle Programmable Wallets optional.

## Run

```bash
cp .env.example .env.local
npm install
npm test
npm run dev
```

## Deploy the contract

```bash
npm run compile
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.mainnet.arc.io \
NEXT_PUBLIC_ARC_CHAIN_ID=5042 \
DEPLOYER_PRIVATE_KEY=0xYOUR_KEY \
ARBITER_ADDRESS=0xYOUR_ARBITER \
node scripts/deploy.mjs
```

Foundry:

```bash
forge create contracts/MilestoneEscrow.sol:MilestoneEscrow \
  --rpc-url https://rpc.mainnet.arc.io \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --constructor-args $ARBITER_ADDRESS
```

Put the deployed address in `NEXT_PUBLIC_ESCROW_ADDRESS`. USDC on Arc is `0x3600000000000000000000000000000000000000`.

Testnet is chain id `5042002`, RPC `https://rpc.testnet.arc.io`, faucet `https://faucet.circle.com`.

## Supabase

Run `supabase/schema.sql` in the SQL editor, then fill the Supabase variables in `.env.example`.

## Submission checklist

- Public GitHub repo with this README
- Live deployment on Arc mainnet
- Short note on how the project uses Arc
- Public builder profile (GitHub, X, or Farcaster)
- DoraHacks form: https://dorahacks.io/hackathon/arc-microgrants/detail
