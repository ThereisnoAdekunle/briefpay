"use client";

import { useMemo, useState } from "react";
import { BrowserProvider, Contract, parseUnits, id } from "ethers";

const USDC = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
const ESCROW = process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "";
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || "5042");
const RPC = process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.mainnet.arc.io";
const EXPLORER = process.env.NEXT_PUBLIC_ARC_EXPLORER || "https://explorer.arc.io";

const escrowAbi = [
  "function fund(address worker, address token, uint256 amount, bytes32 briefHash) returns (uint256)",
  "function markDelivered(uint256 id)",
  "function release(uint256 id)",
  "function claimAfterReview(uint256 id)",
  "function refund(uint256 id)",
  "function dispute(uint256 id)",
  "function nextId() view returns (uint256)",
  "function deals(uint256) view returns (address client, address worker, address token, uint256 amount, uint64 fundedAt, uint64 reviewDeadline, uint8 status, bytes32 briefHash)",
];
const erc20Abi = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

const STATUS = ["none", "funded", "delivered", "released", "refunded", "disputed", "resolved"];

export default function Home() {
  const [account, setAccount] = useState("");
  const [worker, setWorker] = useState("");
  const [amount, setAmount] = useState("50");
  const [brief, setBrief] = useState("Design and deliver the landing page revision.");
  const [dealId, setDealId] = useState("1");
  const [log, setLog] = useState("Connect a wallet on Arc to fund a brief.");
  const [error, setError] = useState("");
  const ready = useMemo(() => Boolean(ESCROW), []);

  async function connect() {
    setError("");
    if (!window.ethereum) {
      setError("No injected wallet found.");
      return;
    }
    const provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== CHAIN_ID) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x" + CHAIN_ID.toString(16),
          chainName: CHAIN_ID === 5042 ? "Arc Mainnet" : "Arc Testnet",
          nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
          rpcUrls: [RPC],
          blockExplorerUrls: [EXPLORER],
        }],
      });
    }
    const signer = await provider.getSigner();
    setAccount(await signer.getAddress());
    setLog("Wallet connected. USDC is the gas token on Arc.");
  }

  async function fund() {
    setError("");
    if (!ready) {
      setError("Set NEXT_PUBLIC_ESCROW_ADDRESS after deployment.");
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const units = parseUnits(amount, 6);
      const token = new Contract(USDC, erc20Abi, signer);
      const escrow = new Contract(ESCROW, escrowAbi, signer);
      const allowance = await token.allowance(await signer.getAddress(), ESCROW);
      if (allowance < units) {
        const approval = await token.approve(ESCROW, units);
        await approval.wait();
      }
      const hash = id(brief);
      const tx = await escrow.fund(worker, USDC, units, hash);
      const receipt = await tx.wait();
      setLog(`Funded in ${receipt.hash}`);
      await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worker,
          amount,
          brief,
          client: await signer.getAddress(),
          txHash: receipt.hash,
        }),
      });
    } catch (err) {
      setError(err.shortMessage || err.message);
    }
  }

  async function act(method) {
    setError("");
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const escrow = new Contract(ESCROW, escrowAbi, signer);
      const tx = await escrow[method](BigInt(dealId));
      const receipt = await tx.wait();
      setLog(`${method} confirmed: ${receipt.hash}`);
    } catch (err) {
      setError(err.shortMessage || err.message);
    }
  }

  return (
    <main>
      <header>
        <div>
          <div className="kicker">Arc mainnet · USDC gas · chain {CHAIN_ID}</div>
          <h1>Briefpay</h1>
        </div>
        <button onClick={connect}>{account ? account.slice(0, 6) + "…" + account.slice(-4) : "Connect wallet"}</button>
      </header>
      <p className="muted">Hold the fee in USDC until the brief is delivered. The worker can claim after a 3-day review window. A dispute freezes the payout for the arbiter.</p>
      <div className="grid">
        <section className="card">
          <h2>Fund a brief</h2>
          <label>Worker address</label>
          <input value={worker} onChange={(e) => setWorker(e.target.value)} placeholder="0x…" />
          <label>Amount (USDC)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} />
          <label>Brief</label>
          <textarea rows={4} value={brief} onChange={(e) => setBrief(e.target.value)} />
          <div className="row">
            <button onClick={fund}>Approve and fund</button>
          </div>
        </section>
        <section className="card">
          <h2>Move a deal</h2>
          <label>Deal id</label>
          <input value={dealId} onChange={(e) => setDealId(e.target.value)} />
          <div className="row">
            <button className="secondary" onClick={() => act("markDelivered")}>Mark delivered</button>
            <button className="secondary" onClick={() => act("release")}>Release</button>
            <button className="secondary" onClick={() => act("claimAfterReview")}>Claim</button>
            <button className="secondary" onClick={() => act("dispute")}>Dispute</button>
            <button className="secondary" onClick={() => act("refund")}>Refund</button>
          </div>
          <p className={error ? "error" : "ok"}>{error || log}</p>
          <p className="muted">Statuses: {STATUS.filter(Boolean).join(", ")}. Contract: {ESCROW || "not deployed yet"}.</p>
        </section>
      </div>
      <section>
        <h2>How a payment clears</h2>
        <ol>
          <li>Client approves USDC and funds the brief. The contract holds the tokens.</li>
          <li>Worker delivers, or refunds the client if the work will not happen.</li>
          <li>Client releases immediately, disputes inside 3 days, or the worker claims when the window ends.</li>
        </ol>
      </section>
    </main>
  );
}
