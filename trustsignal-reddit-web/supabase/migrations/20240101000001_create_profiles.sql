-- Create profiles table
-- Linked to Supabase auth.users via id
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  reddit_username text not null,
  subreddit text,
  tier text not null default 'free' check (tier in ('free', 'pro', 'team')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Service role can insert profiles (on first login)
-- AUTONOMOUS DECISION: No insert policy for regular users since profile creation
-- happens server-side via service role during the auth callback
create policy "Service role can insert profiles"
  on public.profiles for insert
  with check (true);

-- Index for lookups by reddit username
create index idx_profiles_reddit_username on public.profiles(reddit_username);
