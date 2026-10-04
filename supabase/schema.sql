-- Briefpay schema. Run in the Supabase SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  address text primary key,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.briefs (
  id uuid primary key default gen_random_uuid(),
  client_address text,
  worker_address text not null,
  amount_usdc numeric not null check (amount_usdc > 0),
  brief text not null check (char_length(brief) between 8 and 280),
  tx_hash text,
  chain_id integer not null default 5042,
  created_at timestamptz not null default now()
);

create index if not exists briefs_worker_idx on public.briefs (worker_address);
alter table public.briefs enable row level security;

create policy "public read briefs" on public.briefs
  for select using (true);

create policy "service insert briefs" on public.briefs
  for insert with check (auth.role() = 'service_role');
