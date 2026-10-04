import { readFileSync } from "node:fs";
import { JsonRpcProvider, Wallet, ContractFactory } from "ethers";

const artifact = JSON.parse(readFileSync(new URL("../artifacts/build/MilestoneEscrow.json", import.meta.url)));
const rpc = process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.mainnet.arc.io";
const key = process.env.DEPLOYER_PRIVATE_KEY;
const arbiter = process.env.ARBITER_ADDRESS;
if (!key || !arbiter) {
  console.error("Set DEPLOYER_PRIVATE_KEY and ARBITER_ADDRESS");
  process.exit(1);
}
const provider = new JsonRpcProvider(rpc, Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || 5042));
const wallet = new Wallet(key, provider);
const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
const contract = await factory.deploy(arbiter);
await contract.waitForDeployment();
console.log("MilestoneEscrow", await contract.getAddress());
