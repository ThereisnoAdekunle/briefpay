import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const solc = require("solc");

test("MilestoneEscrow compiles and exposes the settlement functions", () => {
  const source = readFileSync(new URL("../contracts/MilestoneEscrow.sol", import.meta.url), "utf8");
  const output = JSON.parse(solc.compile(JSON.stringify({
    language: "Solidity",
    sources: { "MilestoneEscrow.sol": { content: source } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
  })));
  const errors = (output.errors || []).filter((e) => e.severity === "error");
  assert.equal(errors.length, 0, JSON.stringify(errors));
  const abi = output.contracts["MilestoneEscrow.sol"].MilestoneEscrow.abi;
  const names = abi.filter((item) => item.type === "function").map((item) => item.name);
  for (const name of ["fund", "markDelivered", "release", "claimAfterReview", "refund", "dispute", "resolve"]) {
    assert.ok(names.includes(name), name);
  }
});
