import { Devvit, useAsync, useState } from "@devvit/public-api";
import { TrustSignalApiClient } from "./api-client.js";
import { getBaseUrl } from "./config.js";

// Enable HTTP fetch and Reddit API
Devvit.configure({
  http: true,
  redditAPI: true,
});

/**
 * App settings — mods configure their API key and optional custom web app URL.
 *
 * AUTONOMOUS DECISION: Using Devvit.addSettings for app-level configuration
 * that persists per-installation (per-subreddit).
 */
Devvit.addSettings([
  {
    name: "apiKey",
    type: "string",
    label: "TrustSignal API Key",
    helpText: "Your TrustSignal Pro or Team API key from trustsignal.dev/dashboard",
    isSecret: true,
    scope: "installation",
  },
  {
    name: "webAppUrl",
    type: "string",
    label: "Web App URL (optional)",
    helpText: "Override the default TrustSignal web app URL. Leave blank for trustsignal.dev",
    scope: "installation",
  },
]);

function createApiClient(settings: {
  apiKey?: string;
  webAppUrl?: string;
}): TrustSignalApiClient {
  const baseUrl = getBaseUrl({ webAppUrl: settings.webAppUrl });
  return new TrustSignalApiClient(baseUrl, settings.apiKey ?? "");
}

/**
 * Trigger: On new post creation, send to TrustSignal for scoring.
 *
 * AUTONOMOUS DECISION: Using PostCreate (post-safety-delay) instead of PostSubmit
 * so the post content is finalized before scoring.
 */
Devvit.addTrigger({
  event: "PostCreate",
  onEvent: async (event, context) => {
    const settings = await context.settings.getAll();
    const apiKey = settings.apiKey as string | undefined;

    if (!apiKey) {
      console.log("TrustSignal: No API key configured, skipping ingest");
      return;
    }

    const post = event.post;
    if (!post) return;

    // AUTONOMOUS DECISION: PostV2 has authorId/subredditId, not names.
    // Use the author and subreddit objects from the event for display names.
    const authorName = event.author?.name ?? "unknown";
    const subredditName = event.subreddit?.name ?? "";

    const client = createApiClient({
      apiKey,
      webAppUrl: settings.webAppUrl as string | undefined,
    });

    const receipt = await client.ingestPost({
      type: "post",
      post_id: post.id,
      title: post.title ?? "",
      body: post.selftext ?? "",
      author: authorName,
      subreddit: subredditName,
      created_utc: post.createdAt,
      permalink: post.url ?? "",
    });

    if (receipt) {
      console.log(
        `TrustSignal: Post ${post.id} scored ${receipt.score?.score ?? "N/A"}, receipt: ${receipt.receipt_id}`
      );
    } else {
      console.log(`TrustSignal: Failed to ingest post ${post.id}`);
    }
  },
});

/**
 * Custom post type: "TrustSignal Score"
 * Mods can add this to display a post's trust score inline.
 *
 * AUTONOMOUS DECISION: Using addCustomPostType with top-level useAsync hook
 * for fetching scores from the web app API.
 */
Devvit.addCustomPostType({
  name: "TrustSignal Score",
  description: "Display TrustSignal trust score for a post",
  render: (context) => {
    const [postId] = useState<string>(() => {
      return context.postId ?? "";
    });

    const {
      data: scoreData,
      loading,
    } = useAsync(async () => {
      if (!postId) return null;

      const settings = await context.settings.getAll();
      const webAppUrl = settings.webAppUrl as string | undefined;
      const baseUrl = getBaseUrl({ webAppUrl });

      try {
        const response = await fetch(
          `${baseUrl}/api/score/${encodeURIComponent(postId)}`
        );
        if (!response.ok) return null;
        const json = await response.json();
        return json as { score: { score: number } | null; receipt_id: string };
      } catch {
        return null;
      }
    });

    if (loading) {
      return (
        <vstack alignment="center middle" padding="medium">
          <text size="medium" color="#9ca3af">
            Loading TrustSignal score...
          </text>
        </vstack>
      );
    }

    const score = scoreData?.score?.score ?? null;
    const receiptId = scoreData?.receipt_id ?? null;

    if (score === null) {
      return (
        <vstack alignment="center middle" padding="medium">
          <text size="medium" color="#9ca3af">
            TrustSignal: No score available
          </text>
        </vstack>
      );
    }

    const color =
      score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
    const label = score >= 70 ? "Trusted" : score >= 40 ? "Review" : "Flagged";

    return (
      <vstack alignment="center middle" padding="medium" gap="small">
        <hstack alignment="center middle" gap="small">
          <text size="xlarge" weight="bold" color={color}>
            {score.toString()}
          </text>
          <text size="medium" color={color}>
            {label}
          </text>
        </hstack>
        <text size="small" color="#9ca3af">
          TrustSignal Score
        </text>
        {receiptId ? (
          <button
            appearance="bordered"
            size="small"
            onPress={() => {
              // AUTONOMOUS DECISION: Log verify URL. In production Devvit runtime,
              // use context.ui.navigateTo() if available for opening external links.
              console.log(
                `Verify: ${getBaseUrl({})}/verify?receipt=${receiptId}`
              );
            }}
          >
            Verify with TrustSignal
          </button>
        ) : null}
      </vstack>
    );
  },
});

export default Devvit;
