-- Create reddit_receipts table
-- Stores signed receipts for Reddit events (posts, mod actions)
create table public.reddit_receipts (
  receipt_id uuid primary key default gen_random_uuid(),
  payload_type text not null check (payload_type in ('post', 'mod_action')),
  content_hash text not null,
  signature text not null,
  anchored_at timestamptz not null default now(),
  reddit_post_id text,
  subreddit text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.reddit_receipts enable row level security;

-- AUTONOMOUS DECISION: Only service role can read/write receipts.
-- No user-facing policies — all access goes through API routes using service role.
-- Public verification endpoint uses service role to look up receipts.

-- Indexes for common queries
create index idx_receipts_content_hash on public.reddit_receipts(content_hash);
create index idx_receipts_reddit_post_id on public.reddit_receipts(reddit_post_id);
create index idx_receipts_subreddit on public.reddit_receipts(subreddit);
create index idx_receipts_anchored_at on public.reddit_receipts(anchored_at desc);
