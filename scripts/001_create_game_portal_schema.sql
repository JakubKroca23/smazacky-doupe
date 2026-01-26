-- Game Portal Schema

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  total_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'username', 'Player_' || LEFT(new.id::text, 8)),
    COALESCE(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username', 'New Player')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Game scores table
CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scores_select_all" ON public.game_scores;
DROP POLICY IF EXISTS "scores_insert_own" ON public.game_scores;

CREATE POLICY "scores_select_all" ON public.game_scores FOR SELECT USING (true);
CREATE POLICY "scores_insert_own" ON public.game_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reward_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select_all" ON public.events;
CREATE POLICY "events_select_all" ON public.events FOR SELECT USING (true);

-- Insert some initial events (delete existing first to avoid duplicates)
DELETE FROM public.events WHERE title IN ('Weekend Warrior', 'Memory Master Challenge', 'Speed Demon', 'Snake Tournament');

INSERT INTO public.events (title, description, start_time, end_time, reward_description, is_active)
VALUES 
  ('Weekend Warrior', 'Double points on all games this weekend! Compete for bonus rewards and climb the leaderboard.', NOW(), NOW() + INTERVAL '7 days', '2x Score Multiplier', true),
  ('Memory Master Challenge', 'Test your memory skills in our featured challenge. Top 3 players win exclusive badges!', NOW(), NOW() + INTERVAL '14 days', 'Exclusive Memory Badge', true),
  ('Speed Demon', 'Lightning-fast reflexes required! Beat 200ms to earn the Speed Demon title.', NOW() + INTERVAL '3 days', NOW() + INTERVAL '10 days', 'Speed Demon Title', true),
  ('Snake Tournament', 'Classic snake competition. Reach 50 length to qualify for prizes!', NOW() + INTERVAL '7 days', NOW() + INTERVAL '21 days', '500 Bonus Points', true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_game_scores_game_id_score ON public.game_scores(game_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON public.game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_total_score ON public.profiles(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(is_active, start_time, end_time);
