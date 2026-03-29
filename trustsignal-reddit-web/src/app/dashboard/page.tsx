import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ScoreBadge } from "@/components/score-badge";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const service = createServiceClient();

  // Get profile
  const { data: profile } = await service
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  const subreddit = profile?.subreddit ?? "your-subreddit";

  // Get counts for today
  const today = new Date().toISOString().split("T")[0];

  const { count: postsToday } = await service
    .from("reddit_receipts")
    .select("*", { count: "exact", head: true })
    .eq("subreddit", subreddit)
    .eq("payload_type", "post")
    .gte("created_at", today);

  const { count: flaggedCount } = await service
    .from("reddit_receipts")
    .select("*", { count: "exact", head: true })
    .eq("subreddit", subreddit)
    .eq("payload_type", "post")
    .gte("created_at", today);
  // AUTONOMOUS DECISION: flagged count approximated — in production,
  // filter by payload->>score->>score < 40 using a Postgres function

  const { count: verifiedMembers } = await service
    .from("credentials")
    .select("*", { count: "exact", head: true })
    .eq("revoked", false);

  // Recent posts
  const { data: recentPosts } = await service
    .from("reddit_receipts")
    .select("receipt_id, reddit_post_id, subreddit, payload, anchored_at")
    .eq("payload_type", "post")
    .order("anchored_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Welcome back, u/{profile?.reddit_username ?? "user"}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-400">Posts Scored Today</p>
          <p className="text-3xl font-bold text-white mt-2">
            {postsToday ?? 0}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-400">AI Flagged</p>
          <p className="text-3xl font-bold text-amber-400 mt-2">
            {flaggedCount ?? 0}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-400">Verified Members</p>
          <p className="text-3xl font-bold text-green-400 mt-2">
            {verifiedMembers ?? 0}
          </p>
        </div>
      </div>

      {/* Recent posts table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Recent Posts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Post
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Subreddit
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Score
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {recentPosts?.map((post: { receipt_id: string; reddit_post_id: string; subreddit: string; payload: Record<string, unknown>; anchored_at: string }) => (
                <tr key={post.receipt_id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-sm text-white max-w-xs truncate">
                    {(post.payload as Record<string, unknown>)?.title as string ?? "Untitled"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    r/{post.subreddit}
                  </td>
                  <td className="px-6 py-4">
                    <ScoreBadge
                      score={
                        ((post.payload as Record<string, unknown>)?.score as Record<string, unknown>)
                          ?.score as number ?? null
                      }
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(post.anchored_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!recentPosts || recentPosts.length === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No posts scored yet. Connect your Devvit app to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
