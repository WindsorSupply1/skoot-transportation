-- Enhanced Location Model Migration
-- Add new columns to the locations table

-- Add the new columns to the locations table
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS max_capacity INTEGER,
ADD COLUMN IF NOT EXISTS operating_hours JSONB;

-- Update existing locations to have default operating hours for pickup locations
UPDATE locations 
SET operating_hours = '{"monday": {"enabled": true, "open": "06:00", "close": "22:00"}, "tuesday": {"enabled": true, "open": "06:00", "close": "22:00"}, "wednesday": {"enabled": true, "open": "06:00", "close": "22:00"}, "thursday": {"enabled": true, "open": "06:00", "close": "22:00"}, "friday": {"enabled": true, "open": "06:00", "close": "22:00"}, "saturday": {"enabled": true, "open": "08:00", "close": "20:00"}, "sunday": {"enabled": true, "open": "08:00", "close": "20:00"}}'::jsonb
WHERE is_pickup = true AND operating_hours IS NULL;

-- Create some sample locations if the table is empty
INSERT INTO locations (id, name, address, city, state, zip_code, is_pickup, is_dropoff, is_active, sort_order, instructions, operating_hours, created_at, updated_at)
SELECT 
  'pickup_usc_campus',
  'USC Campus Center',
  '1400 Wheat Street',
  'Columbia',
  'SC',
  '29208',
  true,
  false,
  true,
  1,
  'Meet at the main entrance of the Campus Center. Look for the SKOOT driver holding a sign.',
  '{"monday": {"enabled": true, "open": "06:00", "close": "22:00"}, "tuesday": {"enabled": true, "open": "06:00", "close": "22:00"}, "wednesday": {"enabled": true, "open": "06:00", "close": "22:00"}, "thursday": {"enabled": true, "open": "06:00", "close": "22:00"}, "friday": {"enabled": true, "open": "06:00", "close": "22:00"}, "saturday": {"enabled": true, "open": "08:00", "close": "20:00"}, "sunday": {"enabled": true, "open": "08:00", "close": "20:00"}}'::jsonb,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'USC Campus Center');

INSERT INTO locations (id, name, address, city, state, zip_code, is_pickup, is_dropoff, is_active, sort_order, instructions, operating_hours, created_at, updated_at)
SELECT 
  'dropoff_cae_airport',
  'Columbia Metropolitan Airport (CAE)',
  '3000 Aviation Way',
  'West Columbia',
  'SC',
  '29170',
  false,
  true,
  true,
  1,
  'Dropoff at Terminal - Departures level. Follow airport signage for your airline.',
  '{"monday": {"enabled": true, "open": "04:00", "close": "23:00"}, "tuesday": {"enabled": true, "open": "04:00", "close": "23:00"}, "wednesday": {"enabled": true, "open": "04:00", "close": "23:00"}, "thursday": {"enabled": true, "open": "04:00", "close": "23:00"}, "friday": {"enabled": true, "open": "04:00", "close": "23:00"}, "saturday": {"enabled": true, "open": "04:00", "close": "23:00"}, "sunday": {"enabled": true, "open": "04:00", "close": "23:00"}}'::jsonb,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Columbia Metropolitan Airport (CAE)');

INSERT INTO locations (id, name, address, city, state, zip_code, is_pickup, is_dropoff, is_active, sort_order, instructions, operating_hours, created_at, updated_at)
SELECT 
  'pickup_downtown_main',
  'Downtown Columbia - Main Street',
  '1425 Main Street',
  'Columbia',
  'SC',
  '29201',
  true,
  true,
  true,
  2,
  'Meet at the corner of Main and Washington Street, near the State House. Driver will wait by the bronze statue.',
  '{"monday": {"enabled": true, "open": "06:00", "close": "20:00"}, "tuesday": {"enabled": true, "open": "06:00", "close": "20:00"}, "wednesday": {"enabled": true, "open": "06:00", "close": "20:00"}, "thursday": {"enabled": true, "open": "06:00", "close": "20:00"}, "friday": {"enabled": true, "open": "06:00", "close": "22:00"}, "saturday": {"enabled": true, "open": "08:00", "close": "22:00"}, "sunday": {"enabled": false}}'::jsonb,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Downtown Columbia - Main Street');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_locations_is_pickup ON locations(is_pickup) WHERE is_pickup = true;
CREATE INDEX IF NOT EXISTS idx_locations_is_dropoff ON locations(is_dropoff) WHERE is_dropoff = true;
CREATE INDEX IF NOT EXISTS idx_locations_active_pickup ON locations(is_active, is_pickup) WHERE is_active = true AND is_pickup = true;
CREATE INDEX IF NOT EXISTS idx_locations_active_dropoff ON locations(is_active, is_dropoff) WHERE is_active = true AND is_dropoff = true;
CREATE INDEX IF NOT EXISTS idx_locations_sort_order ON locations(sort_order, name);