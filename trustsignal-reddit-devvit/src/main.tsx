import { Devvit, useAsync, useState } from "@devvit/public-api";
import { TrustSignalApiClient } from "./api-client.js";
import { BASE_URL } from "./config.js";

Devvit.configure({
  http: true,
  redditAPI: true,
});

Devvit.addSettings([
  {
    name: "apiKey",
    type: "string",
    label: "TrustSignal API Key",
    helpText: "Your TrustSignal API key from the dashboard",
    isSecret: true,
    scope: "app",
  },
]);

function createApiClient(apiKey: string): TrustSignalApiClient {
  return new TrustSignalApiClient(BASE_URL, apiKey);
}

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

    const authorName = event.author?.name ?? "unknown";
    const subredditName = event.subreddit?.name ?? "";

    const client = createApiClient(apiKey);

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

Devvit.addCustomPostType({
  name: "TrustSignal Score",
  description: "Display TrustSignal trust score for a post",
  render: (context) => {
    const [postId] = useState<string>(() => context.postId ?? "");

    const { data: scoreData, loading } = useAsync(async () => {
      if (!postId) return null;
      try {
        const response = await fetch(
          `${BASE_URL}/api/score/${encodeURIComponent(postId)}`
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
              console.log(`Verify: ${BASE_URL}/verify?receipt=${receiptId}`);
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
