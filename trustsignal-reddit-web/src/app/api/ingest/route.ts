import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { hashPayload, signPayload } from "@/lib/signing";
import { scorePost } from "@/lib/scorer";
import type { RedditEvent, TSReceipt } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    // AUTONOMOUS DECISION: API key auth via Authorization header.
    // In production, validate against stored API keys per subreddit.
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as RedditEvent;

    if (!body.type || !["post", "mod_action"].includes(body.type)) {
      return NextResponse.json(
        { error: "Invalid event type. Must be 'post' or 'mod_action'" },
        { status: 400 }
      );
    }

    const subreddit =
      body.type === "post" ? body.subreddit : body.subreddit;

    if (!subreddit) {
      return NextResponse.json(
        { error: "Missing subreddit field" },
        { status: 400 }
      );
    }

    // Score the post if it's a post event
    let scoreResult = undefined;
    if (body.type === "post") {
      scoreResult = await scorePost({
        title: body.title,
        body: body.body,
        author: body.author,
        subreddit: body.subreddit,
      });
    }

    // Build canonical payload and sign
    const payload: Record<string, unknown> = { ...body };
    if (scoreResult) {
      payload.score = scoreResult;
    }
    const contentHash = hashPayload(payload);
    const signature = signPayload(contentHash);
    const receiptId = uuidv4();
    const anchoredAt = new Date().toISOString();

    // Store in Supabase
    const supabase = createServiceClient();
    const { error: insertError } = await supabase
      .from("reddit_receipts")
      .insert({
        receipt_id: receiptId,
        payload_type: body.type,
        content_hash: contentHash,
        signature,
        anchored_at: anchoredAt,
        reddit_post_id: body.type === "post" ? body.post_id : body.target_post_id,
        subreddit,
        payload,
      });

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to store receipt" },
        { status: 500 }
      );
    }

    // Log to audit
    await supabase.from("audit_log").insert({
      event_type: `ingest:${body.type}`,
      subject_hash: contentHash,
      subreddit,
      metadata: {
        receipt_id: receiptId,
        reddit_post_id:
          body.type === "post" ? body.post_id : body.target_post_id,
      },
    });

    const receipt: TSReceipt = {
      receipt_id: receiptId,
      payload_type: body.type,
      content_hash: contentHash,
      signature,
      anchored_at: anchoredAt,
      score: scoreResult,
    };

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
