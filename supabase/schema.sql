create table if not exists public.board_state (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.board_state enable row level security;

drop policy if exists "board_state_read" on public.board_state;
create policy "board_state_read"
on public.board_state
for select
to anon, authenticated
using (true);

drop policy if exists "board_state_write" on public.board_state;
create policy "board_state_write"
on public.board_state
for insert
to anon, authenticated
with check (true);

drop policy if exists "board_state_update" on public.board_state;
create policy "board_state_update"
on public.board_state
for update
to anon, authenticated
using (true)
with check (true);

insert into public.board_state (id, state)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

-- Realtime
alter publication supabase_realtime add table public.board_state;
