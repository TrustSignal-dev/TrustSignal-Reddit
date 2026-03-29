-- Create audit_log table
-- Immutable log of all TrustSignal events
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  subject_hash text not null,
  subreddit text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.audit_log enable row level security;

-- AUTONOMOUS DECISION: Only service role can read/write audit log.
-- Dashboard reads go through API routes that use service role.
-- No user-facing RLS policies to maintain immutability guarantees.

-- Indexes
create index idx_audit_event_type on public.audit_log(event_type);
create index idx_audit_subreddit on public.audit_log(subreddit);
create index idx_audit_created_at on public.audit_log(created_at desc);
create index idx_audit_subject_hash on public.audit_log(subject_hash);
