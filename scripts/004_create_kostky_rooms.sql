-- Drop old game_sessions if exists and create new kostky_rooms table
drop table if exists public.kostky_rooms cascade;

create table public.kostky_rooms (
  id text primary key,
  status text not null default 'lobby',
  host_id text not null,
  state jsonb not null default '{
    "turn": "",
    "lastDice": [1,2,3,4,5,6],
    "storedDice": [],
    "rollCount": 0,
    "isAnimating": false,
    "turnBasePoints": 0,
    "sixCount": 0,
    "mirrorActive": false,
    "hasTakenThisRoll": true
  }'::jsonb,
  visuals jsonb not null default '{"tripTimestamp": 0, "emojiSync": 0}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create kostky_players table
drop table if exists public.kostky_players cascade;

create table public.kostky_players (
  id text primary key,
  room_id text not null references public.kostky_rooms(id) on delete cascade,
  name text not null,
  score integer not null default 0,
  strikes integer not null default 0,
  gramy integer not null default 0,
  smazano_count integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create kostky_chat table
drop table if exists public.kostky_chat cascade;

create table public.kostky_chat (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.kostky_rooms(id) on delete cascade,
  sender text not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.kostky_rooms enable row level security;
alter table public.kostky_players enable row level security;
alter table public.kostky_chat enable row level security;

-- Policies - anyone can read/write (public game)
create policy "kostky_rooms_all" on public.kostky_rooms for all using (true) with check (true);
create policy "kostky_players_all" on public.kostky_players for all using (true) with check (true);
create policy "kostky_chat_all" on public.kostky_chat for all using (true) with check (true);

-- Enable realtime
alter publication supabase_realtime add table public.kostky_rooms;
alter publication supabase_realtime add table public.kostky_players;
alter publication supabase_realtime add table public.kostky_chat;
