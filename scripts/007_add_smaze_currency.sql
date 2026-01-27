-- Add SMAŽE currency system to player_stats
-- SMAŽE = gaming currency synchronized across all games

-- Add smaze column to player_stats
ALTER TABLE player_stats
ADD COLUMN IF NOT EXISTS smaze INTEGER DEFAULT 2000;

-- Update existing profiles to have 2000 SMAŽE
UPDATE player_stats
SET smaze = 2000
WHERE smaze IS NULL OR smaze = 0;

-- Create function to update currency
CREATE OR REPLACE FUNCTION update_smaze(p_user_id UUID, amount_change INTEGER)
RETURNS TABLE(new_balance INTEGER) AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT smaze INTO current_balance
  FROM player_stats
  WHERE user_id = p_user_id;

  -- Update balance
  current_balance := current_balance + amount_change;
  
  -- Ensure balance doesn't go negative
  IF current_balance < 0 THEN
    current_balance := 0;
  END IF;
  
  -- Update player_stats
  UPDATE player_stats
  SET smaze = current_balance
  WHERE user_id = p_user_id;
  
  -- Return new balance
  RETURN QUERY SELECT current_balance;
END;
$$ LANGUAGE plpgsql;

-- Create function to reset currency to default
CREATE OR REPLACE FUNCTION reset_smaze(p_user_id UUID)
RETURNS TABLE(new_balance INTEGER) AS $$
BEGIN
  -- Reset to default 2000
  UPDATE player_stats
  SET smaze = 2000
  WHERE user_id = p_user_id;
  
  -- Return new balance
  RETURN QUERY SELECT 2000;
END;
$$ LANGUAGE plpgsql;
