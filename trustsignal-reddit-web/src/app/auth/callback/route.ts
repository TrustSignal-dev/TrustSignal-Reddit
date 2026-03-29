import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // AUTONOMOUS DECISION: Create profile on first login using service role.
      // Extract reddit username from user metadata provided by Reddit OAuth.
      const { createClient } = await import("@supabase/supabase-js");
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );

      const redditUsername =
        (data.user.user_metadata?.user_name as string) ??
        (data.user.user_metadata?.preferred_username as string) ??
        "unknown";

      // Upsert to handle both first login and subsequent logins
      await serviceClient.from("profiles").upsert(
        {
          id: data.user.id,
          reddit_username: redditUsername,
          tier: "free",
        },
        { onConflict: "id" }
      );
    }
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
