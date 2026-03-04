/*
  # Create zip_code_ranges table for cities

  1. New Tables
    - `zip_code_ranges`
      - `id` (uuid, primary key)
      - `city_id` (uuid, foreign key to cities)
      - `start_zip` (text) - Starting ZIP code
      - `end_zip` (text) - Ending ZIP code
      - `area` (text) - Area name (optional)
      - `neighborhood` (text) - Neighborhood name (optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `zip_code_ranges` table
    - Add policies for public read access
*/

-- Create zip_code_ranges table
CREATE TABLE IF NOT EXISTS zip_code_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid REFERENCES cities(id) ON DELETE CASCADE,
  start_zip text NOT NULL,
  end_zip text NOT NULL,
  area text,
  neighborhood text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE zip_code_ranges ENABLE ROW LEVEL SECURITY;

-- Allow public read access to zip codes
CREATE POLICY "Allow public read access to zip_code_ranges"
  ON zip_code_ranges
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage zip codes
CREATE POLICY "Allow authenticated insert on zip_code_ranges"
  ON zip_code_ranges
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on zip_code_ranges"
  ON zip_code_ranges
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on zip_code_ranges"
  ON zip_code_ranges
  FOR DELETE
  TO authenticated
  USING (true);