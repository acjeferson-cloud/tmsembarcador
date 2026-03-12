-- Recreate the missing ctes_complete tables structure that the frontend expects
CREATE TABLE IF NOT EXISTS public.ctes_complete (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES public.establishments(id),
  carrier_id uuid REFERENCES public.carriers(id),
  freight_type text NOT NULL,
  number text NOT NULL,
  series text,
  access_key text UNIQUE,
  issue_date timestamptz,
  entry_date timestamptz,
  origin text,
  integration_date timestamptz,
  status text NOT NULL,
  freight_weight_value numeric DEFAULT 0,
  freight_value_value numeric DEFAULT 0,
  seccat_value numeric DEFAULT 0,
  dispatch_value numeric DEFAULT 0,
  ademe_gris_value numeric DEFAULT 0,
  itr_value numeric DEFAULT 0,
  tas_value numeric DEFAULT 0,
  collection_delivery_value numeric DEFAULT 0,
  other_tax_value numeric DEFAULT 0,
  toll_value numeric DEFAULT 0,
  icms_rate numeric DEFAULT 0,
  icms_base numeric DEFAULT 0,
  icms_value numeric DEFAULT 0,
  pis_value numeric DEFAULT 0,
  cofins_value numeric DEFAULT 0,
  other_value numeric DEFAULT 0,
  total_value numeric DEFAULT 0,
  cargo_weight numeric,
  cargo_value numeric,
  cargo_volume numeric,
  cargo_m3 numeric,
  cargo_weight_cubed numeric,
  cargo_weight_for_calculation numeric,
  cubing_factor numeric,
  freight_rate_table_id text,
  sender_name text,
  sender_document text,
  sender_city text,
  sender_state text,
  recipient_name text,
  recipient_document text,
  recipient_city text,
  recipient_state text,
  shipper_name text,
  shipper_document text,
  receiver_name text,
  receiver_document text,
  payer_name text,
  payer_document text,
  xml_data jsonb,
  observations text,
  organization_id uuid REFERENCES public.saas_organizations(id),
  environment_id uuid REFERENCES public.saas_environments(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text,
  updated_by text
);

CREATE TABLE IF NOT EXISTS public.ctes_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cte_id uuid NOT NULL REFERENCES public.ctes_complete(id) ON DELETE CASCADE,
  establishment_code text,
  invoice_type text,
  series text,
  number text,
  cost_value numeric DEFAULT 0,
  observations text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ctes_carrier_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cte_id uuid NOT NULL REFERENCES public.ctes_complete(id) ON DELETE CASCADE,
  carrier_id uuid REFERENCES public.carriers(id),
  cost_type text,
  cost_type_code text,
  cost_value numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ctes_complete ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctes_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctes_carrier_costs ENABLE ROW LEVEL SECURITY;

-- Adicionar permissões super-permissivas para resolver o acesso da interface WEB (que envia com Token Anon com dados JWT)
DROP POLICY IF EXISTS "Enable read access for anon" ON public.ctes_complete;
CREATE POLICY "Enable read access for anon" ON public.ctes_complete FOR SELECT TO anon USING (true);
      
DROP POLICY IF EXISTS "Enable insert for anon" ON public.ctes_complete;
CREATE POLICY "Enable insert for anon" ON public.ctes_complete FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for anon" ON public.ctes_complete;
CREATE POLICY "Enable update for anon" ON public.ctes_complete FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "Enable delete for anon" ON public.ctes_complete;
CREATE POLICY "Enable delete for anon" ON public.ctes_complete FOR DELETE TO anon USING (true);

-- Permissões para Tabelas Relacionais Filhas
DROP POLICY IF EXISTS "Enable all access for anon on ctes_invoices" ON public.ctes_invoices;
CREATE POLICY "Enable all access for anon on ctes_invoices" ON public.ctes_invoices FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for anon on ctes_carrier_costs" ON public.ctes_carrier_costs;
CREATE POLICY "Enable all access for anon on ctes_carrier_costs" ON public.ctes_carrier_costs FOR ALL TO anon USING (true) WITH CHECK (true);

-- Notificar o framework para reler os schemas e mapear as rotas novas de POST/GET
NOTIFY pgrst, 'reload schema';
