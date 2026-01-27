-- Profile System: Inventory, Level, Currency, Properties, Avatar
-- This extends the profiles table with gaming features

-- Add new columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avatar_body TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS avatar_head TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS avatar_face TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS avatar_top TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS avatar_bottom TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS avatar_shoes TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS avatar_accessory TEXT DEFAULT 'none';

-- Inventory table for items
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL, -- 'clothing', 'consumable', 'material', etc.
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  rarity TEXT DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  equipped BOOLEAN DEFAULT FALSE,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Properties table for owned buildings/assets
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_type TEXT NOT NULL, -- 'house', 'garage', 'lab', 'warehouse', etc.
  property_name TEXT NOT NULL,
  property_level INTEGER DEFAULT 1,
  income_rate INTEGER DEFAULT 0, -- Passive income per hour
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_collected TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Raids table for raid missions
CREATE TABLE IF NOT EXISTS raids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raid_name TEXT NOT NULL,
  raid_description TEXT,
  required_level INTEGER DEFAULT 1,
  difficulty TEXT DEFAULT 'easy', -- 'easy', 'medium', 'hard', 'extreme'
  reward_coins INTEGER DEFAULT 100,
  reward_xp INTEGER DEFAULT 50,
  reward_items JSONB DEFAULT '[]'::jsonb,
  success_rate INTEGER DEFAULT 80, -- Base success rate percentage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Raid attempts log
CREATE TABLE IF NOT EXISTS raid_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  raid_id UUID REFERENCES raids(id) ON DELETE CASCADE NOT NULL,
  success BOOLEAN NOT NULL,
  rewards_earned JSONB DEFAULT '{}'::jsonb,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE raids ENABLE ROW LEVEL SECURITY;
ALTER TABLE raid_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory
CREATE POLICY "Users can view own inventory" ON inventory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory" ON inventory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory" ON inventory
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory" ON inventory
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for properties
CREATE POLICY "Users can view own properties" ON properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties" ON properties
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for raids
CREATE POLICY "Everyone can view raids" ON raids
  FOR SELECT USING (true);

-- RLS Policies for raid_attempts
CREATE POLICY "Users can view own raid attempts" ON raid_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own raid attempts" ON raid_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert some starter raids
INSERT INTO raids (raid_name, raid_description, required_level, difficulty, reward_coins, reward_xp, reward_items, success_rate)
VALUES 
  ('Vykrást Dealera', 'Sejmout malého dealera na rohu ulice. Lehká akce pro začátečníky.', 1, 'easy', 200, 50, '["pocket_knife", "small_stash"]', 90),
  ('Nabourát se do Auta', 'Ukrást věci z zaparkovaného auta. Střední riziko.', 3, 'medium', 500, 100, '["car_radio", "wallet", "sunglasses"]', 75),
  ('Vyloupit Automobilovku', 'Ukrást zásoby z lékárny. Potřeba skill.', 5, 'medium', 1000, 200, '["pills", "syringes", "medical_kit"]', 70),
  ('Napadnout Rival Gang', 'Sejmout nepřátelskou bandu. Vysoké riziko!', 8, 'hard', 2500, 400, '["gang_jacket", "weapon", "big_stash"]', 60),
  ('Boss Raid - Vykrást Lab', 'Ukrást z tajné lab. Extrémně nebezpečné!', 12, 'extreme', 10000, 1000, '["legendary_gear", "pure_product", "blueprint"]', 40)
ON CONFLICT DO NOTHING;

-- Functions for leveling up
CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp_amount INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Every 1000 XP = 1 level
  RETURN GREATEST(1, FLOOR(xp_amount / 1000.0) + 1);
END;
$$ LANGUAGE plpgsql;

-- Function to add XP and auto-level
CREATE OR REPLACE FUNCTION add_xp(p_user_id UUID, xp_to_add INTEGER)
RETURNS TABLE(new_level INTEGER, new_xp INTEGER, leveled_up BOOLEAN) AS $$
DECLARE
  current_xp INTEGER;
  current_level INTEGER;
  calculated_level INTEGER;
BEGIN
  -- Get current values
  SELECT xp, level INTO current_xp, current_level
  FROM profiles
  WHERE user_id = p_user_id;

  -- Add XP
  current_xp := current_xp + xp_to_add;
  
  -- Calculate new level
  calculated_level := calculate_level_from_xp(current_xp);
  
  -- Update profile
  UPDATE profiles
  SET xp = current_xp, level = calculated_level
  WHERE user_id = p_user_id;
  
  -- Return results
  RETURN QUERY SELECT calculated_level, current_xp, (calculated_level > current_level);
END;
$$ LANGUAGE plpgsql;
