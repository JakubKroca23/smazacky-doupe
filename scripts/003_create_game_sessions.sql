-- Create game_sessions table for online multiplayer
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  dice integer[] not null default '{1,2,3,4,5,6}',
  selected boolean[] not null default '{false,false,false,false,false,false}',
  banking_score integer not null default 0,
  current_player integer not null default 0,
  players jsonb not null default '[]'::jsonb,
  roll_count integer not null default 0,
  message text not null default 'Hoď kostkami pro zahájení tahu',
  game_over boolean not null default false,
  host_id uuid references auth.users(id) on delete cascade,
  status text not null default 'waiting',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.game_sessions enable row level security;

-- Policies - anyone can read any game session (for joining)
create policy "game_sessions_select_all" on public.game_sessions for select using (true);

-- Only authenticated users can create game sessions
create policy "game_sessions_insert_authenticated" on public.game_sessions 
  for insert with check (auth.uid() is not null);

-- Players in the game can update it
create policy "game_sessions_update_players" on public.game_sessions 
  for update using (
    auth.uid() = host_id or 
    exists (
      select 1 from jsonb_array_elements(players) as player
      where (player->>'id')::uuid = auth.uid()
    )
  );

-- Host can delete
create policy "game_sessions_delete_host" on public.game_sessions 
  for delete using (auth.uid() = host_id);

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_game_sessions_updated_at
  before update on public.game_sessions
  for each row
  execute function update_updated_at_column();
