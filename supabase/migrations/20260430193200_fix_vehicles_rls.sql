-- Drop restrictive policies
DROP POLICY IF EXISTS "vehicles_isolation_policy" ON vehicles;
DROP POLICY IF EXISTS "vehicles_anon_policy" ON vehicles;
DROP POLICY IF EXISTS "drivers_isolation_policy" ON drivers;
DROP POLICY IF EXISTS "drivers_anon_policy" ON drivers;
DROP POLICY IF EXISTS "trips_isolation_policy" ON trips;
DROP POLICY IF EXISTS "trips_anon_policy" ON trips;
DROP POLICY IF EXISTS "trip_stops_isolation_policy" ON trip_stops;
DROP POLICY IF EXISTS "trip_stops_anon_policy" ON trip_stops;

-- Allow all authenticated and anon users to manage vehicles (frontend filters already)
CREATE POLICY "vehicles_all" ON vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "drivers_all" ON drivers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "trips_all" ON trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "trip_stops_all" ON trip_stops FOR ALL USING (true) WITH CHECK (true);
