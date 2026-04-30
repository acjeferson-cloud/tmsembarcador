-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placa varchar(20) NOT NULL,
  tipo varchar(50) NOT NULL,
  capacidade_kg numeric(10, 2) NOT NULL DEFAULT 0,
  cubagem_m3 numeric(10, 2) NOT NULL DEFAULT 0,
  status varchar(20) DEFAULT 'ativo',
  establishment_id uuid REFERENCES establishments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(255) NOT NULL,
  cpf varchar(20),
  cnh varchar(20),
  telefone varchar(20),
  status varchar(20) DEFAULT 'livre',
  establishment_id uuid REFERENCES establishments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_romaneio varchar(50) NOT NULL,
  status varchar(20) DEFAULT 'rascunho',
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  distancia_total_km numeric(10, 2) DEFAULT 0,
  tempo_estimado_min integer DEFAULT 0,
  data_saida_prevista timestamptz,
  polyline text,
  establishment_id uuid REFERENCES establishments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(numero_romaneio, establishment_id)
);

-- Create trip_stops table
CREATE TABLE IF NOT EXISTS trip_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  sequence integer NOT NULL,
  tipo_parada varchar(20) NOT NULL, -- 'coleta', 'entrega', 'hub_origem', 'hub_retorno'
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  lat numeric(10, 6) NOT NULL,
  lng numeric(10, 6) NOT NULL,
  status_execucao varchar(20) DEFAULT 'pendente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Enable
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_stops ENABLE ROW LEVEL SECURITY;

-- Vehicles Policies
DROP POLICY IF EXISTS "vehicles_isolation_policy" ON vehicles;
CREATE POLICY "vehicles_isolation_policy" ON vehicles
  FOR ALL TO authenticated
  USING (establishment_id = (SELECT NULLIF(current_setting('app.current_establishment_id', true), '')::uuid))
  WITH CHECK (establishment_id = (SELECT NULLIF(current_setting('app.current_establishment_id', true), '')::uuid));

DROP POLICY IF EXISTS "vehicles_anon_policy" ON vehicles;
CREATE POLICY "vehicles_anon_policy" ON vehicles
  FOR ALL TO anon
  USING (establishment_id = (SELECT NULLIF(current_setting('app.current_establishment_id', true), '')::uuid))
  WITH CHECK (establishment_id = (SELECT NULLIF(current_setting('app.current_establishment_id', true), '')::uuid));

-- Drivers Policies
DROP POLICY IF EXISTS "drivers_isolation_policy" ON drivers;
CREATE POLICY "drivers_isolation_policy" ON drivers
  FOR ALL TO authenticated
  USING (establishment_id = (SELECT NULLIF(current_setting('app.current_establishment_id', true), '')::uuid))
  WITH CHECK (establishment_id = (SELECT NULLIF(current_setting('app.current_establishment_id', true), '')::uuid));

DROP POLICY IF EXISTS "drivers_anon_policy" ON drivers;
CREATE POLICY "drivers_anon_policy" ON drivers
  FOR ALL TO anon
  USING (establishment_id = (SELECT NULLIF(current_setting('app.current_establishment_id', true), '')::uuid))
  WITH CHECK (establishment_id = (SELECT NULLIF(current_setting('app.current_establishment_id', true), '')::uuid));

-- Trips Policies
DROP POLICY IF EXISTS "trips_isolation_policy" ON trips;
CREATE POLICY "trips_isolation_policy" ON trips
  FOR ALL TO authenticated
  USING (establishment_id = (SELECT NULLIF(current_setting('app.current_establishment_id', true), '')::uuid))
  WITH CHECK (establishment_id = (SELECT NULLIF(current_setting('app.current_establishment_id', true), '')::uuid));

DROP POLICY IF EXISTS "trips_anon_policy" ON trips;
CREATE POLICY "trips_anon_policy" ON trips
  FOR ALL TO anon
  USING (establishment_id = (SELECT NULLIF(current_setting('app.current_establishment_id', true), '')::uuid))
  WITH CHECK (establishment_id = (SELECT NULLIF(current_setting('app.current_establishment_id', true), '')::uuid));

-- Trip Stops Policies
DROP POLICY IF EXISTS "trip_stops_isolation_policy" ON trip_stops;
CREATE POLICY "trip_stops_isolation_policy" ON trip_stops
  FOR ALL TO authenticated
  USING (trip_id IN (SELECT id FROM trips WHERE establishment_id = (SELECT NULLIF(current_setting('app.current_establishment_id', true), '')::uuid)))
  WITH CHECK (trip_id IN (SELECT id FROM trips WHERE establishment_id = (SELECT NULLIF(current_setting('app.current_establishment_id', true), '')::uuid)));

DROP POLICY IF EXISTS "trip_stops_anon_policy" ON trip_stops;
CREATE POLICY "trip_stops_anon_policy" ON trip_stops
  FOR ALL TO anon
  USING (trip_id IN (SELECT id FROM trips WHERE establishment_id = (SELECT NULLIF(current_setting('app.current_establishment_id', true), '')::uuid)))
  WITH CHECK (trip_id IN (SELECT id FROM trips WHERE establishment_id = (SELECT NULLIF(current_setting('app.current_establishment_id', true), '')::uuid)));

-- Insert Innovation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM innovations WHERE name = 'Módulo de Roteirização') THEN
    INSERT INTO innovations (name, description, detailed_description, category, icon, is_active, monthly_price, display_order)
    VALUES (
      'Módulo de Roteirização',
      'Otimização de Rotas e Gestão de Frota Própria.',
      'Otimize suas entregas gerando rotas perfeitas através de algoritmos matemáticos (Caixeiro Viajante).',
      'operacional',
      'Map',
      true,
      0,
      10
    );
  END IF;
END $$;
