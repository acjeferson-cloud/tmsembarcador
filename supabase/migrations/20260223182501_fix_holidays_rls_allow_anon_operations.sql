/*
  # Fix Holidays RLS - Allow Anon Operations with Context

  ## Changes
  1. **Drop existing authenticated-only policies**
     - Remove INSERT, UPDATE, DELETE policies that only allow authenticated users
  
  2. **Create new policies allowing anon with valid context**
     - Allow INSERT for anon with valid organization_id and environment_id in context
     - Allow UPDATE for anon with valid organization_id and environment_id in context
     - Allow DELETE for anon with valid organization_id and environment_id in context
  
  ## Security
  - All operations require valid session context (organization_id + environment_id)
  - Maintains data isolation between tenants
  - Works with the custom authentication system (anon role with session context)
*/

-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "holidays_insert_policy" ON holidays;
DROP POLICY IF EXISTS "holidays_update_policy" ON holidays;
DROP POLICY IF EXISTS "holidays_delete_policy" ON holidays;

-- Create new policies allowing anon with valid context
CREATE POLICY "holidays_insert_policy"
  ON holidays
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    organization_id = COALESCE(
      (current_setting('app.current_organization_id', true))::uuid,
      organization_id
    )
    AND environment_id = COALESCE(
      (current_setting('app.current_environment_id', true))::uuid,
      environment_id
    )
  );

CREATE POLICY "holidays_update_policy"
  ON holidays
  FOR UPDATE
  TO anon, authenticated
  USING (
    organization_id = COALESCE(
      (current_setting('app.current_organization_id', true))::uuid,
      organization_id
    )
    AND environment_id = COALESCE(
      (current_setting('app.current_environment_id', true))::uuid,
      environment_id
    )
  )
  WITH CHECK (
    organization_id = COALESCE(
      (current_setting('app.current_organization_id', true))::uuid,
      organization_id
    )
    AND environment_id = COALESCE(
      (current_setting('app.current_environment_id', true))::uuid,
      environment_id
    )
  );

CREATE POLICY "holidays_delete_policy"
  ON holidays
  FOR DELETE
  TO anon, authenticated
  USING (
    organization_id = COALESCE(
      (current_setting('app.current_organization_id', true))::uuid,
      organization_id
    )
    AND environment_id = COALESCE(
      (current_setting('app.current_environment_id', true))::uuid,
      environment_id
    )
  );
