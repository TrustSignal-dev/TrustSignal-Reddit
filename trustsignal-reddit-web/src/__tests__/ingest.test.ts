import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules before importing route handlers
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: vi.fn(() => ({ data: null, error: null })),
              })),
            })),
          })),
          maybeSingle: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
    })),
  })),
}));

vi.mock("@/lib/scorer", () => ({
  scorePost: vi.fn(() =>
    Promise.resolve({
      score: 75,
      signals: [
        { category: "authenticity", label: "ai_generated", value: 80 },
        { category: "authenticity", label: "manipulation", value: 85 },
        { category: "quality", label: "substance", value: 70 },
        { category: "credibility", label: "source_consistency", value: 65 },
      ],
      summary: "Post appears authentic with moderate substance.",
    })
  ),
}));

vi.mock("uuid", () => ({
  v4: vi.fn(() => "test-receipt-id-1234"),
}));

import { POST } from "@/app/api/ingest/route";
import { createServiceClient } from "@/lib/supabase/server";

function makeRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/ingest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/ingest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TS_SIGNING_KEY = "test-signing-key-abc123";
  });

  it("returns 401 without authorization header", async () => {
    const req = makeRequest({ type: "post" });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("authorization");
  });

  it("returns 400 for invalid event type", async () => {
    const req = makeRequest(
      { type: "invalid" },
      { Authorization: "Bearer test-key" }
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid event type");
  });

  it("returns 400 when subreddit is missing", async () => {
    const req = makeRequest(
      { type: "post", title: "test", body: "test", author: "test" },
      { Authorization: "Bearer test-key" }
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("subreddit");
  });

  it("returns 201 with valid post event", async () => {
    const mockInsert = vi.fn(() => ({ error: null }));
    const mockFrom = vi.fn(() => ({
      insert: mockInsert,
    }));
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: mockFrom,
    });

    const req = makeRequest(
      {
        type: "post",
        post_id: "abc123",
        title: "Test post",
        body: "This is a test post body",
        author: "testuser",
        subreddit: "testsubreddit",
        created_utc: Date.now(),
        permalink: "/r/testsubreddit/comments/abc123",
      },
      { Authorization: "Bearer test-key" }
    );

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.receipt_id).toBe("test-receipt-id-1234");
    expect(data.payload_type).toBe("post");
    expect(data.content_hash).toBeTruthy();
    expect(data.signature).toBeTruthy();
    expect(data.score).toBeDefined();
    expect(data.score.score).toBe(75);
  });

  it("returns 201 with valid mod action event", async () => {
    const mockInsert = vi.fn(() => ({ error: null }));
    const mockFrom = vi.fn(() => ({
      insert: mockInsert,
    }));
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: mockFrom,
    });

    const req = makeRequest(
      {
        type: "mod_action",
        action: "removepost",
        moderator: "moduser",
        target_author: "testuser",
        target_post_id: "abc123",
        subreddit: "testsubreddit",
        details: "Spam",
        created_utc: Date.now(),
      },
      { Authorization: "Bearer test-key" }
    );

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.payload_type).toBe("mod_action");
    expect(data.score).toBeUndefined();
  });
});
