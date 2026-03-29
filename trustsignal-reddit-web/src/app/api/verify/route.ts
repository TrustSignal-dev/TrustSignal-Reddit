import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifySignature } from "@/lib/signing";
import type { VerificationResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receipt_id, content_hash } = body as {
      receipt_id?: string;
      content_hash?: string;
    };

    if (!receipt_id && !content_hash) {
      return NextResponse.json(
        { error: "Provide receipt_id or content_hash" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    let query = supabase.from("reddit_receipts").select("*");
    if (receipt_id) {
      query = query.eq("receipt_id", receipt_id);
    } else {
      query = query.eq("content_hash", content_hash!);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Verification lookup error:", error);
      return NextResponse.json(
        { error: "Verification lookup failed" },
        { status: 500 }
      );
    }

    if (!data) {
      const result: VerificationResult = {
        verified: false,
        receipt: null,
        message: "No receipt found for the given identifier",
      };
      return NextResponse.json(result);
    }

    const signatureValid = verifySignature(data.content_hash, data.signature);

    const result: VerificationResult = {
      verified: signatureValid,
      receipt: {
        receipt_id: data.receipt_id,
        payload_type: data.payload_type,
        content_hash: data.content_hash,
        signature: data.signature,
        anchored_at: data.anchored_at,
        score: data.payload?.score,
      },
      message: signatureValid
        ? "Receipt verified — signature is valid and payload is intact"
        : "WARNING: Signature mismatch — receipt may have been tampered with",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
