/*
  # Fix Freight Quotes History - Add GRANT Permissions

  Add missing GRANT permissions for anon and authenticated roles.
  Without these GRANTs, RLS policies cannot work even if permissive.
*/

-- Grant INSERT and SELECT permissions to anon role
GRANT INSERT, SELECT ON freight_quotes_history TO anon;

-- Grant INSERT and SELECT permissions to authenticated role
GRANT INSERT, SELECT ON freight_quotes_history TO authenticated;

-- Grant USAGE on the sequence if needed
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
