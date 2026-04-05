/**
 * Typed fetch wrapper for TrustSignal web app API calls.
 * Uses Devvit's built-in HTTP capabilities.
 *
 * AUTONOMOUS DECISION: Using standard fetch since Devvit's runtime
 * provides a fetch-compatible API. The Devvit.use(Devvit.Types.HTTP)
 * plugin approach was deprecated in favor of direct fetch in modern Devvit.
 */

export interface IngestPostPayload {
  type: "post";
  post_id: string;
  title: string;
  body: string;
  author: string;
  subreddit: string;
  created_utc: number;
  permalink: string;
}

export interface IngestModActionPayload {
  type: "mod_action";
  action: string;
  moderator: string;
  target_author: string;
  target_post_id: string;
  subreddit: string;
  details: string;
  created_utc: number;
}

export interface TSReceipt {
  receipt_id: string;
  payload_type: "post" | "mod_action";
  content_hash: string;
  signature: string;
  anchored_at: string;
  score?: {
    score: number;
    signals: { category: string; label: string; value: number }[];
    summary: string;
  };
}

export interface ScoreResponse {
  post_id: string;
  receipt_id: string;
  anchored_at: string;
  score: {
    score: number;
    signals: { category: string; label: string; value: number }[];
    summary: string;
  } | null;
}

export class TrustSignalApiClient {
  constructor(
    private baseUrl: string,
    private apiKey: string
  ) {}

  async ingestPost(payload: IngestPostPayload): Promise<TSReceipt | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(
          `TrustSignal ingest failed: ${response.status} ${response.statusText}`
        );
        return null;
      }

      return (await response.json()) as TSReceipt;
    } catch (error) {
      console.error("TrustSignal ingest error:", error);
      return null;
    }
  }

  async getScore(postId: string): Promise<ScoreResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/score/${encodeURIComponent(postId)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as ScoreResponse;
    } catch (error) {
      console.error("TrustSignal score fetch error:", error);
      return null;
    }
  }
}
