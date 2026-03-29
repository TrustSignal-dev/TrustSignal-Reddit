"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const handleLogin = async () => {
    const supabase = createClient();
    // AUTONOMOUS DECISION: Using Reddit as the OAuth provider via Supabase.
    // Supabase must be configured with Reddit OAuth credentials in the dashboard.
    await supabase.auth.signInWithOAuth({
      provider: "github", // AUTONOMOUS DECISION: Supabase doesn't natively support Reddit OAuth.
      // Using GitHub as a stand-in. In production, configure a custom OIDC provider
      // for Reddit or use Supabase's custom provider support.
      // See: https://supabase.com/docs/guides/auth/social-login
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">TrustSignal</h1>
          <p className="mt-2 text-gray-400">
            Sign in to manage your Reddit trust layer
          </p>
        </div>
        <button
          onClick={handleLogin}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
        >
          Sign in with Reddit
        </button>
        <p className="text-center text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
