import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: posts, error } = await service
    .from("reddit_receipts")
    .select("receipt_id, reddit_post_id, subreddit, payload, anchored_at")
    .eq("payload_type", "post")
    .order("anchored_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }

  return NextResponse.json({ posts });
}
