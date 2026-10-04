import { parseUsdc, isAddress } from "./money.js";

export const STATUS = {
  0: "none",
  1: "funded",
  2: "delivered",
  3: "released",
  4: "refunded",
  5: "disputed",
  6: "resolved",
};

export const REVIEW_WINDOW_SECONDS = 3 * 24 * 60 * 60;

export function createDealInput(body) {
  const worker = String(body.worker || "");
  const brief = String(body.brief || "").trim();
  if (!isAddress(worker)) throw new Error("Worker must be a 20-byte hex address");
  if (brief.length < 8 || brief.length > 280) {
    throw new Error("Brief must be between 8 and 280 characters");
  }
  const amount = parseUsdc(body.amount);
  return { worker, brief, amount: amount.toString() };
}

export function allowedActions(status, role, now, reviewDeadline) {
  const actions = [];
  if (status === "funded" && role === "worker") actions.push("markDelivered", "refund");
  if ((status === "funded" || status === "delivered") && role === "client") actions.push("release");
  if (status === "delivered" && role === "client" && now < reviewDeadline) actions.push("dispute");
  if (status === "delivered" && role === "worker" && now >= reviewDeadline) actions.push("claimAfterReview");
  if (status === "disputed" && role === "arbiter") actions.push("resolve");
  return actions;
}
