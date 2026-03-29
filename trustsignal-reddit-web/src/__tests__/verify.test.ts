import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(),
}));

import { POST } from "@/app/api/verify/route";
import { createServiceClient } from "@/lib/supabase/server";

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TS_SIGNING_KEY = "test-signing-key-abc123";
  });

  it("returns 400 without receipt_id or content_hash", async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("receipt_id or content_hash");
  });

  it("returns not verified when no receipt found", async () => {
    const mockMaybeSingle = vi.fn(() => ({ data: null, error: null }));
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: mockMaybeSingle,
          })),
        })),
      })),
    });

    const req = makeRequest({ receipt_id: "nonexistent-id" });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.verified).toBe(false);
    expect(data.receipt).toBeNull();
    expect(data.message).toContain("No receipt found");
  });

  it("returns verified true for valid receipt with matching signature", async () => {
    // Generate a valid content hash and signature
    const { hashPayload, signPayload } = await import("@/lib/signing");
    const testPayload = { test: "data" };
    const contentHash = hashPayload(testPayload);
    const signature = signPayload(contentHash);

    const mockMaybeSingle = vi.fn(() => ({
      data: {
        receipt_id: "valid-receipt-id",
        payload_type: "post",
        content_hash: contentHash,
        signature: signature,
        anchored_at: new Date().toISOString(),
        payload: { score: { score: 80 } },
      },
      error: null,
    }));

    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: mockMaybeSingle,
          })),
        })),
      })),
    });

    const req = makeRequest({ receipt_id: "valid-receipt-id" });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.verified).toBe(true);
    expect(data.receipt.receipt_id).toBe("valid-receipt-id");
    expect(data.message).toContain("verified");
  });

  it("returns verified false for tampered signature", async () => {
    const mockMaybeSingle = vi.fn(() => ({
      data: {
        receipt_id: "tampered-receipt",
        payload_type: "post",
        content_hash: "somehash",
        signature: "tampered-signature",
        anchored_at: new Date().toISOString(),
        payload: {},
      },
      error: null,
    }));

    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: mockMaybeSingle,
          })),
        })),
      })),
    });

    const req = makeRequest({ content_hash: "somehash" });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.verified).toBe(false);
    expect(data.message).toContain("tampered");
  });
});
