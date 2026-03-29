"use client";

import { useEffect, useState } from "react";
import { ScoreBadge } from "@/components/score-badge";

interface PostRow {
  receipt_id: string;
  reddit_post_id: string;
  subreddit: string;
  payload: Record<string, unknown>;
  anchored_at: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreFilter, setScoreFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchPosts() {
      // AUTONOMOUS DECISION: Fetching via client-side Supabase.
      // In production, this should go through an API route using service role
      // since reddit_receipts has no user-facing RLS policies.
      // For now, using a fetch to a hypothetical API endpoint pattern.
      try {
        const res = await fetch("/api/dashboard/posts");
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts ?? []);
        }
      } catch {
        // Fallback: empty
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (scoreFilter === "all") return true;
    const score = (post.payload?.score as Record<string, unknown>)?.score as number | undefined;
    if (!score) return scoreFilter === "none";
    if (scoreFilter === "green") return score >= 70;
    if (scoreFilter === "amber") return score >= 40 && score < 70;
    if (scoreFilter === "red") return score < 40;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Posts</h1>
        <div className="flex gap-2">
          {["all", "green", "amber", "red"].map((filter) => (
            <button
              key={filter}
              onClick={() => setScoreFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                scoreFilter === filter
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading posts...</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Title
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Subreddit
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Score
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Signals
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredPosts.map((post) => {
                const score = post.payload?.score as Record<string, unknown> | undefined;
                const signals = (score?.signals as Array<{ label: string; value: number }>) ?? [];
                return (
                  <tr key={post.receipt_id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 text-sm text-white max-w-xs truncate">
                      {post.payload?.title as string ?? "Untitled"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      r/{post.subreddit}
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBadge score={score?.score as number ?? null} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {signals.slice(0, 3).map((s, i) => (
                          <span
                            key={i}
                            className="text-xs text-gray-500"
                            title={s.label}
                          >
                            {s.label}: {s.value}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/verify?receipt_id=${post.receipt_id}`}
                        className="text-xs text-blue-400 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                );
              })}
              {filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No posts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
