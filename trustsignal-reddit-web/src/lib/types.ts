export interface RedditPostEvent {
  type: "post";
  post_id: string;
  title: string;
  body: string;
  author: string;
  subreddit: string;
  created_utc: number;
  permalink: string;
}

export interface RedditModActionEvent {
  type: "mod_action";
  action: string;
  moderator: string;
  target_author: string;
  target_post_id: string;
  subreddit: string;
  details: string;
  created_utc: number;
}

export type RedditEvent = RedditPostEvent | RedditModActionEvent;

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

export interface VerificationResult {
  verified: boolean;
  receipt: TSReceipt | null;
  message: string;
}

export interface Profile {
  id: string;
  reddit_username: string;
  subreddit: string;
  tier: "free" | "pro" | "team";
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Credential {
  id: string;
  issued_to_reddit_username: string;
  credential_type: string;
  issuer: string;
  proof_hash: string;
  expires_at: string;
  revoked: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  event_type: string;
  subject_hash: string;
  subreddit: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
