-- Create credentials table
-- Stores verified expert credentials issued to Reddit users
create table public.credentials (
  id uuid primary key default gen_random_uuid(),
  issued_to_reddit_username text not null,
  credential_type text not null,
  issuer text not null,
  proof_hash text not null,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.credentials enable row level security;

-- Users can read credentials issued to them
-- AUTONOMOUS DECISION: Matching by reddit_username from the profiles table
-- joined via auth.uid(). This requires a subquery but is the most correct approach.
create policy "Users can read own credentials"
  on public.credentials for select
  using (
    issued_to_reddit_username in (
      select reddit_username from public.profiles where id = auth.uid()
    )
  );

-- Service role handles insert/update/delete via API routes

-- Indexes
create index idx_credentials_username on public.credentials(issued_to_reddit_username);
create index idx_credentials_type on public.credentials(credential_type);
