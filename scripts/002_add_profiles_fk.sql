-- Add foreign key relationship from game_scores to profiles
-- This allows Supabase PostgREST to perform joins between these tables

-- First drop the existing foreign key if it exists
ALTER TABLE public.game_scores 
DROP CONSTRAINT IF EXISTS game_scores_user_id_profiles_fkey;

-- Add foreign key to profiles table (profiles.id = auth.users.id so this works)
ALTER TABLE public.game_scores 
ADD CONSTRAINT game_scores_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
