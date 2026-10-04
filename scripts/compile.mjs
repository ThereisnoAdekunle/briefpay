import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const solc = require("solc");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "contracts/MilestoneEscrow.sol"), "utf8");
const input = {
  language: "Solidity",
  sources: { "MilestoneEscrow.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
if (output.errors?.some((e) => e.severity === "error")) {
  console.error(output.errors);
  process.exit(1);
}
const contract = output.contracts["MilestoneEscrow.sol"].MilestoneEscrow;
const outDir = join(root, "artifacts/build");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "MilestoneEscrow.json"), JSON.stringify({
  abi: contract.abi,
  bytecode: "0x" + contract.evm.bytecode.object,
}, null, 2));
console.log("compiled MilestoneEscrow", contract.evm.bytecode.object.length / 2, "bytes");
