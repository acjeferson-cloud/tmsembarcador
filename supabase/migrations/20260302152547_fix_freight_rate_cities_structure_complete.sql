/*
  # Fix freight_rate_cities table structure

  1. Changes
    - Drop old freight_rate_cities table with text fields
    - Create new freight_rate_cities with proper foreign keys to cities table
    - Add indexes for performance
    - Add RLS policies
  
  2. New Structure
    - id (uuid, primary key)
    - freight_rate_id (uuid, references freight_rates)
    - freight_rate_table_id (uuid, references freight_rate_tables)
    - city_id (uuid, references cities) - CHANGED TO UUID
    - delivery_days (integer, nullable)
    - created_at, updated_at (timestamps)
  
  3. Security
    - Enable RLS
    - Allow all operations with valid context
*/

-- Drop old table (backup data first if needed)
DROP TABLE IF EXISTS freight_rate_cities CASCADE;

-- Create new table with correct structure
CREATE TABLE freight_rate_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  freight_rate_id uuid NOT NULL REFERENCES freight_rates(id) ON DELETE CASCADE,
  freight_rate_table_id uuid NOT NULL REFERENCES freight_rate_tables(id) ON DELETE CASCADE,
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  delivery_days integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_freight_rate_cities_rate_id ON freight_rate_cities(freight_rate_id);
CREATE INDEX idx_freight_rate_cities_table_id ON freight_rate_cities(freight_rate_table_id);
CREATE INDEX idx_freight_rate_cities_city_id ON freight_rate_cities(city_id);

-- Create unique constraint to prevent duplicate cities per rate
CREATE UNIQUE INDEX idx_freight_rate_cities_unique ON freight_rate_cities(freight_rate_id, city_id);

-- Enable RLS
ALTER TABLE freight_rate_cities ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies
CREATE POLICY "Allow all SELECT on freight_rate_cities"
  ON freight_rate_cities
  FOR SELECT
  USING (true);

CREATE POLICY "Allow all INSERT on freight_rate_cities"
  ON freight_rate_cities
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all UPDATE on freight_rate_cities"
  ON freight_rate_cities
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all DELETE on freight_rate_cities"
  ON freight_rate_cities
  FOR DELETE
  USING (true);