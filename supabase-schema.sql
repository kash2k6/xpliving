-- Create table for storing member and setup intent data
-- This table stores the relationship between email, member ID, and setup intent ID
CREATE TABLE IF NOT EXISTS whop_member_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  member_id TEXT NOT NULL,
  setup_intent_id TEXT NOT NULL,
  payment_method_id TEXT,
  initial_plan_id TEXT,
  checkout_config_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email)
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_whop_member_data_email ON whop_member_data(email);

-- Create index on member_id for lookups
CREATE INDEX IF NOT EXISTS idx_whop_member_data_member_id ON whop_member_data(member_id);

-- Create index on setup_intent_id for lookups
CREATE INDEX IF NOT EXISTS idx_whop_member_data_setup_intent_id ON whop_member_data(setup_intent_id);

-- Create index on checkout_config_id for lookups
CREATE INDEX IF NOT EXISTS idx_whop_member_data_checkout_config_id ON whop_member_data(checkout_config_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_whop_member_data_updated_at
  BEFORE UPDATE ON whop_member_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

