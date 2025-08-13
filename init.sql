-- Initialize Skoot Transportation Database
-- This script runs when the PostgreSQL container starts

-- Create database if it doesn't exist
-- (Note: In Docker, the database is created automatically from POSTGRES_DB env var)

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS extension if geographic features are needed in the future
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Set timezone to Eastern Time (Columbia, SC timezone)
SET timezone = 'America/New_York';

-- Create indexes for performance (these will be created by Prisma, but documenting here)
-- Prisma will handle index creation, but we can pre-create any custom indexes if needed

-- Log the initialization
DO $$
BEGIN
  RAISE NOTICE 'Skoot Transportation database initialized successfully';
  RAISE NOTICE 'Database: skoot_transportation';
  RAISE NOTICE 'Timezone: %', current_setting('timezone');
  RAISE NOTICE 'Ready for Prisma schema migration';
END $$;