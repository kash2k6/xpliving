-- Create table for storing shipping addresses
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  member_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_email ON shipping_addresses(email);

-- Create index on member_id for lookups
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_member_id ON shipping_addresses(member_id);

-- Trigger to automatically update updated_at for shipping addresses
-- Note: This assumes the update_updated_at_column() function already exists
-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_shipping_addresses_updated_at ON shipping_addresses;
CREATE TRIGGER update_shipping_addresses_updated_at
  BEFORE UPDATE ON shipping_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

