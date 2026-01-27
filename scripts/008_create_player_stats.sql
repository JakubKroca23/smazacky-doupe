-- Create player_stats table for game statistics and currency
-- This is separate from profiles to track game-specific data

CREATE TABLE IF NOT EXISTS public.player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  smaze INTEGER DEFAULT 2000,
  total_raids_won INTEGER DEFAULT 0,
  total_raids_lost INTEGER DEFAULT 0,
  total_games_played INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "player_stats_select_all" ON public.player_stats;
DROP POLICY IF EXISTS "player_stats_insert_own" ON public.player_stats;
DROP POLICY IF EXISTS "player_stats_update_own" ON public.player_stats;

CREATE POLICY "player_stats_select_all" ON public.player_stats FOR SELECT USING (true);
CREATE POLICY "player_stats_insert_own" ON public.player_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "player_stats_update_own" ON public.player_stats FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create player_stats for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.player_stats (user_id, smaze)
  VALUES (new.id, 2000)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_stats ON auth.users;
CREATE TRIGGER on_auth_user_created_stats
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_stats();

-- Create player_stats for existing users
INSERT INTO public.player_stats (user_id, smaze)
SELECT id, 2000
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.player_stats)
ON CONFLICT (user_id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON public.player_stats(user_id);
