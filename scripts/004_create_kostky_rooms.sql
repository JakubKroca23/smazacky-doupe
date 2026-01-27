-- Drop old tables if exists and create new kostky_rooms table
DROP TABLE IF EXISTS public.kostky_rooms CASCADE;

CREATE TABLE public.kostky_rooms (
  id TEXT PRIMARY KEY,
  room_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  host_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.kostky_rooms ENABLE ROW LEVEL SECURITY;

-- Policies - anyone can read/write (public game)
CREATE POLICY "kostky_rooms_all" ON public.kostky_rooms FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.kostky_rooms;

-- Function to increment gramy for a player
CREATE OR REPLACE FUNCTION increment_gramy(room_id TEXT, player_id TEXT)
RETURNS void AS $$
DECLARE
  current_data JSONB;
  player_gramy INT;
BEGIN
  SELECT room_data INTO current_data FROM kostky_rooms WHERE id = room_id;
  
  IF current_data IS NOT NULL THEN
    player_gramy := COALESCE((current_data->'players'->player_id->>'gramy')::INT, 0) + 1;
    
    UPDATE kostky_rooms 
    SET room_data = jsonb_set(
      room_data, 
      ARRAY['players', player_id, 'gramy'], 
      to_jsonb(player_gramy)
    ),
    updated_at = NOW()
    WHERE id = room_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
