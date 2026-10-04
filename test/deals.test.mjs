import test from "node:test";
import assert from "node:assert/strict";
import { parseUsdc, formatUsdc } from "../lib/money.js";
import { createDealInput, allowedActions } from "../lib/deals.js";

test("parses and formats 6-decimal USDC", () => {
  assert.equal(parseUsdc("50"), 50_000_000n);
  assert.equal(parseUsdc("1.5"), 1_500_000n);
  assert.equal(formatUsdc(1_500_000n), "1.5");
  assert.throws(() => parseUsdc("0"));
  assert.throws(() => parseUsdc("1.1234567"));
});

test("rejects a short brief and a bad worker", () => {
  assert.throws(() => createDealInput({ worker: "0x123", amount: "10", brief: "too tiny" }));
  const deal = createDealInput({
    worker: "0x1111111111111111111111111111111111111111",
    amount: "25.5",
    brief: "Ship the revised homepage.",
  });
  assert.equal(deal.amount, "25500000");
});

test("review window gates the worker claim and the client dispute", () => {
  const deadline = 1_000;
  assert.deepEqual(allowedActions("delivered", "worker", 999, deadline), []);
  assert.deepEqual(allowedActions("delivered", "worker", 1000, deadline), ["claimAfterReview"]);
  assert.ok(allowedActions("delivered", "client", 999, deadline).includes("dispute"));
  assert.equal(allowedActions("disputed", "worker", 2000, deadline).includes("claimAfterReview"), false);
  assert.deepEqual(allowedActions("disputed", "arbiter", 2000, deadline), ["resolve"]);
});
