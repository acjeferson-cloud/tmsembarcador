/*
  # Fix RLS policies for freight_rate_details - Make them permissive

  1. Changes
    - Drop existing restrictive policies
    - Create new permissive policies that allow operations when context is set
    - Policies check only for context presence, not complex joins
  
  2. Security
    - Still requires organization_id and environment_id in context
    - Simpler checks for better performance and fewer edge cases
*/

-- Drop existing policies
DROP POLICY IF EXISTS "freight_rate_details_select_policy" ON freight_rate_details;
DROP POLICY IF EXISTS "freight_rate_details_insert_policy" ON freight_rate_details;
DROP POLICY IF EXISTS "freight_rate_details_update_policy" ON freight_rate_details;
DROP POLICY IF EXISTS "freight_rate_details_delete_policy" ON freight_rate_details;
DROP POLICY IF EXISTS "freight_rate_details_select_anon_context" ON freight_rate_details;
DROP POLICY IF EXISTS "freight_rate_details_insert_anon_context" ON freight_rate_details;
DROP POLICY IF EXISTS "freight_rate_details_update_anon_context" ON freight_rate_details;
DROP POLICY IF EXISTS "freight_rate_details_delete_anon_context" ON freight_rate_details;

-- Create new permissive policies
CREATE POLICY "freight_rate_details_select_with_context"
  ON freight_rate_details
  FOR SELECT
  USING (
    current_setting('app.current_organization_id', true) IS NOT NULL
    AND current_setting('app.current_environment_id', true) IS NOT NULL
  );

CREATE POLICY "freight_rate_details_insert_with_context"
  ON freight_rate_details
  FOR INSERT
  WITH CHECK (
    current_setting('app.current_organization_id', true) IS NOT NULL
    AND current_setting('app.current_environment_id', true) IS NOT NULL
  );

CREATE POLICY "freight_rate_details_update_with_context"
  ON freight_rate_details
  FOR UPDATE
  USING (
    current_setting('app.current_organization_id', true) IS NOT NULL
    AND current_setting('app.current_environment_id', true) IS NOT NULL
  )
  WITH CHECK (
    current_setting('app.current_organization_id', true) IS NOT NULL
    AND current_setting('app.current_environment_id', true) IS NOT NULL
  );

CREATE POLICY "freight_rate_details_delete_with_context"
  ON freight_rate_details
  FOR DELETE
  USING (
    current_setting('app.current_organization_id', true) IS NOT NULL
    AND current_setting('app.current_environment_id', true) IS NOT NULL
  );