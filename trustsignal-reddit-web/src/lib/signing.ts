import { createHmac, createHash } from "crypto";

const getSigningKey = () => {
  const key = process.env.TS_SIGNING_KEY;
  if (!key) throw new Error("TS_SIGNING_KEY is not set");
  return key;
};

export function hashPayload(payload: Record<string, unknown>): string {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash("sha256").update(canonical).digest("hex");
}

export function signPayload(contentHash: string): string {
  return createHmac("sha256", getSigningKey())
    .update(contentHash)
    .digest("hex");
}

export function verifySignature(
  contentHash: string,
  signature: string
): boolean {
  const expected = signPayload(contentHash);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}
