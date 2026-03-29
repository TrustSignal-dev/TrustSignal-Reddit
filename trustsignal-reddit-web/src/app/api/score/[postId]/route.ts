import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: "Missing postId parameter" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("reddit_receipts")
      .select("receipt_id, payload, anchored_at")
      .eq("reddit_post_id", postId)
      .eq("payload_type", "post")
      .order("anchored_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Score lookup error:", error);
      return NextResponse.json(
        { error: "Score lookup failed" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { score: null, message: "No score found for this post" },
        { status: 404 }
      );
    }

    const score = data.payload?.score ?? null;

    return NextResponse.json({
      post_id: postId,
      receipt_id: data.receipt_id,
      anchored_at: data.anchored_at,
      score,
    });
  } catch (error) {
    console.error("Score error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
