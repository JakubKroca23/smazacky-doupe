-- Add profile customization and raid statistics

-- Add customization columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_icon TEXT DEFAULT '😎',
ADD COLUMN IF NOT EXISTS avatar_customization JSONB DEFAULT '{"bgColor": "#6366f1", "borderStyle": "solid"}'::jsonb;

-- Create raid_stats table
CREATE TABLE IF NOT EXISTS raid_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  raid_id TEXT NOT NULL,
  raid_name TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  completion_time INTEGER, -- in seconds
  xp_earned INTEGER DEFAULT 0,
  currency_earned INTEGER DEFAULT 0,
  items_earned JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE raid_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for raid_stats
CREATE POLICY "Users can view own raid stats" ON raid_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own raid stats" ON raid_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_raid_stats_user_id ON raid_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_raid_stats_completed_at ON raid_stats(completed_at DESC);

-- Function to get raid statistics summary for a user
CREATE OR REPLACE FUNCTION get_raid_stats_summary(p_user_id UUID)
RETURNS TABLE(
  total_raids BIGINT,
  successful_raids BIGINT,
  failed_raids BIGINT,
  success_rate NUMERIC,
  total_xp_earned BIGINT,
  total_currency_earned BIGINT,
  best_completion_time INTEGER,
  total_items_earned INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_raids,
    COUNT(*) FILTER (WHERE success = true)::BIGINT as successful_raids,
    COUNT(*) FILTER (WHERE success = false)::BIGINT as failed_raids,
    CASE 
      WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE success = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
      ELSE 0
    END as success_rate,
    COALESCE(SUM(xp_earned) FILTER (WHERE success = true), 0)::BIGINT as total_xp_earned,
    COALESCE(SUM(currency_earned) FILTER (WHERE success = true), 0)::BIGINT as total_currency_earned,
    MIN(completion_time) FILTER (WHERE success = true) as best_completion_time,
    COALESCE(SUM(jsonb_array_length(items_earned)) FILTER (WHERE success = true), 0)::INTEGER as total_items_earned
  FROM raid_stats
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
