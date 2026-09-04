create table votes (
  id uuid primary key default gen_random_uuid(),
  option_id text not null,
  created_at timestamptz not null default now()
);

alter table votes enable row level security;

create policy "Anyone can insert a vote"
  on votes for insert
  with check (true);

create policy "Anyone can read votes"
  on votes for select
  using (true);

-- Permissive so "Reset my vote" can delete the row it just created.
-- Tighten or drop this policy before using the table for anything beyond testing.
create policy "Anyone can delete a vote"
  on votes for delete
  using (true);

-- Required for live result updates: enables Supabase Realtime on this table.
alter publication supabase_realtime add table votes;
