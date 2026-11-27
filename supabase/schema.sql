-- StudentNest AI database. Run once in the Supabase SQL editor.

-- Apartments each student saved or pasted, with their tracker status and note.
create table if not exists public.tracker_items (
  user_id    uuid not null references auth.users (id) on delete cascade,
  listing_id text not null,
  status     text not null default 'Interested'
             check (status in ('Interested', 'Contacted', 'Toured', 'Applied')),
  note       text not null default '',
  listing    jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- Per-student settings: what matters to them in the recommendation.
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  priorities jsonb not null default '{"cost":2,"commute":1,"cash":1}',
  updated_at timestamptz not null default now()
);

-- Each student can only see and change their own rows.
alter table public.tracker_items enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "own tracker items" on public.tracker_items;
create policy "own tracker items" on public.tracker_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
