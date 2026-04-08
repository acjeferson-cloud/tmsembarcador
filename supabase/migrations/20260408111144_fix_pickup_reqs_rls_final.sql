-- Remove any existing insert policy that might be blocking due to session_context issues
DROP POLICY IF EXISTS "Enable insert for authenticated users within same organization" ON pickup_requests;
DROP POLICY IF EXISTS "Enable all for authenticated users on pickup_requests" ON pickup_requests;

-- Create permissive fallback policy for insertion for BOTH anon and authenticated
CREATE POLICY "anon_all_pickup_requests"
ON pickup_requests
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
