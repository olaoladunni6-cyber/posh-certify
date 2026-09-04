-- Posh Manager Stage 2 — run once in Supabase SQL editor
create table if not exists hotel_live (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated timestamptz not null default now()
);
alter table hotel_live enable row level security;
drop policy if exists "posh_read" on hotel_live;
drop policy if exists "posh_insert" on hotel_live;
drop policy if exists "posh_update" on hotel_live;
create policy "posh_read" on hotel_live for select using (true);
create policy "posh_insert" on hotel_live for insert with check (true);
create policy "posh_update" on hotel_live for update using (true);
insert into hotel_live (id, payload) values ('posh', '{}'::jsonb) on conflict (id) do nothing;
alter publication supabase_realtime add table hotel_live;
