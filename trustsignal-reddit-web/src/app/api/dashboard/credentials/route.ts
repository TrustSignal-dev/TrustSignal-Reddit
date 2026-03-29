import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";
import { hashPayload } from "@/lib/signing";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: credentials, error } = await service
    .from("credentials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
  }

  return NextResponse.json({ credentials });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { username, credential_type, expires_in_days } = body as {
    username: string;
    credential_type: string;
    expires_in_days: number;
  };

  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("reddit_username")
    .eq("id", user.id)
    .single();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expires_in_days);

  const proofHash = hashPayload({
    issuer: profile?.reddit_username ?? "unknown",
    issued_to: username,
    type: credential_type,
    expires: expiresAt.toISOString(),
  });

  const { data, error } = await service.from("credentials").insert({
    issued_to_reddit_username: username,
    credential_type,
    issuer: profile?.reddit_username ?? "unknown",
    proof_hash: proofHash,
    expires_at: expiresAt.toISOString(),
  }).select().single();

  if (error) {
    return NextResponse.json({ error: "Failed to issue credential" }, { status: 500 });
  }

  // Audit log
  await service.from("audit_log").insert({
    event_type: "credential:issued",
    subject_hash: proofHash,
    subreddit: "",
    metadata: { credential_id: data.id, issued_to: username },
  });

  return NextResponse.json({ credential: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, revoked } = body as { id: string; revoked: boolean };

  const service = createServiceClient();
  const { error } = await service
    .from("credentials")
    .update({ revoked })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to update credential" }, { status: 500 });
  }

  // Audit log
  await service.from("audit_log").insert({
    event_type: "credential:revoked",
    subject_hash: id,
    subreddit: "",
    metadata: { credential_id: id },
  });

  return NextResponse.json({ success: true });
}
