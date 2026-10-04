export const USDC_DECIMALS = 6;

export function parseUsdc(input) {
  const raw = String(input ?? "").trim();
  if (!/^\d+(\.\d{1,6})?$/.test(raw)) {
    throw new Error("Amount must be a positive USDC value with at most 6 decimals");
  }
  const [whole, frac = ""] = raw.split(".");
  if (whole.length > 12) throw new Error("Amount is too large");
  const padded = (frac + "000000").slice(0, 6);
  const units = BigInt(whole) * 1_000_000n + BigInt(padded);
  if (units <= 0n) throw new Error("Amount must be greater than zero");
  return units;
}

export function formatUsdc(units) {
  const value = BigInt(units);
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const whole = abs / 1_000_000n;
  const frac = (abs % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole.toString()}${frac ? "." + frac : ""}`;
}

export function isAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(value || ""));
}
