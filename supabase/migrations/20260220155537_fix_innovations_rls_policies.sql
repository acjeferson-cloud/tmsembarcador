/*
  # Fix RLS policies for innovations table

  1. Changes
    - Remove restrictive RLS policies for innovations table
    - Allow authenticated users to perform all operations
    - Innovations are global resources, not tenant-scoped
  
  2. Security
    - Keep RLS enabled
    - Allow all authenticated users to manage innovations
    - Public read access maintained
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to innovations" ON innovations;
DROP POLICY IF EXISTS "Allow authenticated insert on innovations" ON innovations;
DROP POLICY IF EXISTS "Allow authenticated update on innovations" ON innovations;
DROP POLICY IF EXISTS "Allow authenticated delete on innovations" ON innovations;

-- Create new simplified policies for innovations (global resources)
CREATE POLICY "Anyone can read innovations"
  ON innovations
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert innovations"
  ON innovations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update innovations"
  ON innovations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete innovations"
  ON innovations
  FOR DELETE
  TO authenticated
  USING (true);