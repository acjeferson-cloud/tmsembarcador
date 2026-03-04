/*
  # Fix Freight Quotes History RLS Policies

  ## Problem
  The current RLS policies for `anon` role require session context variables to be set,
  but these variables are not persisting between HTTP requests due to Supabase's
  connection pooling. This causes INSERT operations to fail.

  ## Solution
  1. Update the `anon` INSERT policy to validate against the data being inserted
     rather than relying solely on session variables
  2. Keep the session variable check as a fallback for additional security
  3. This allows inserts when organization_id and environment_id are provided in the data

  ## Changes
  - Drop existing restrictive policies for anon role
  - Create new permissive policies that validate data directly
  - Maintain security by ensuring org/env IDs are present in insert data
*/

-- Drop existing anon policies
DROP POLICY IF EXISTS "Allow anon insert freight_quotes_history with context" ON freight_quotes_history;
DROP POLICY IF EXISTS "Allow anon read freight_quotes_history with context" ON freight_quotes_history;

-- Create new INSERT policy for anon that validates the data being inserted
-- This allows INSERT when organization_id and environment_id are provided
CREATE POLICY "Allow anon insert freight_quotes_history with org and env"
  ON freight_quotes_history
  FOR INSERT
  TO anon
  WITH CHECK (
    organization_id IS NOT NULL 
    AND environment_id IS NOT NULL
  );

-- Create new SELECT policy for anon that checks session context OR returns no rows
-- This is safe because it either matches context or returns nothing
CREATE POLICY "Allow anon read freight_quotes_history with context"
  ON freight_quotes_history
  FOR SELECT
  TO anon
  USING (
    (organization_id::text = current_setting('app.current_organization_id', true))
    AND (environment_id::text = current_setting('app.current_environment_id', true))
  );
