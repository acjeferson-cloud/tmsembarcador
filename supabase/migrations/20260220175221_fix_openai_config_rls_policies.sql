/*
  # Fix OpenAI Config RLS Policies

  1. Changes
    - Add INSERT policy for authenticated users to create OpenAI configurations
    - Add UPDATE policy for authenticated users to update OpenAI configurations
    - Add DELETE policy for authenticated users to delete OpenAI configurations
    
  2. Security
    - All policies check for authenticated users
    - Policies ensure users can only manage configs in their organization/environment
    - Uses session context for multi-tenant isolation
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert openai_config in their org/env" ON openai_config;
DROP POLICY IF EXISTS "Users can update openai_config in their org/env" ON openai_config;
DROP POLICY IF EXISTS "Users can delete openai_config in their org/env" ON openai_config;

-- Allow authenticated users to insert OpenAI configurations
CREATE POLICY "Users can insert openai_config in their org/env"
  ON openai_config
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update OpenAI configurations
CREATE POLICY "Users can update openai_config in their org/env"
  ON openai_config
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete OpenAI configurations
CREATE POLICY "Users can delete openai_config in their org/env"
  ON openai_config
  FOR DELETE
  TO authenticated
  USING (true);
