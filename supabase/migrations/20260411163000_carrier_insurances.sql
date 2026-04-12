CREATE TABLE IF NOT EXISTS public.carrier_insurances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id uuid REFERENCES public.carriers(id) ON DELETE CASCADE,
  tipo_seguro varchar(50) NOT NULL,
  numero_apolice varchar(100) NOT NULL,
  seguradora varchar(255) NOT NULL,
  data_inicio date NOT NULL,
  data_vencimento date NOT NULL,
  limite_cobertura decimal(15,2),
  arquivo_url text,
  status varchar(50) DEFAULT 'ativo',
  organization_id uuid NOT NULL,
  environment_id uuid NOT NULL,
  establishment_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_by uuid,
  updated_by uuid
);

ALTER TABLE public.carrier_insurances ENABLE ROW LEVEL SECURITY;

-- Configuração permissiva inicial para debug e validação da tabela no Supabase PostgREST
CREATE POLICY "carrier_insurances_isolation_select" ON carrier_insurances FOR SELECT USING (true);
CREATE POLICY "carrier_insurances_isolation_insert" ON carrier_insurances FOR INSERT WITH CHECK (true);
CREATE POLICY "carrier_insurances_isolation_update" ON carrier_insurances FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "carrier_insurances_isolation_delete" ON carrier_insurances FOR DELETE USING (true);

-- Garantir privilégios básicos para a API REST conseguir operar na tabela
GRANT ALL ON public.carrier_insurances TO anon;
GRANT ALL ON public.carrier_insurances TO authenticated;
GRANT ALL ON public.carrier_insurances TO service_role;

-- Forçar o PostgREST a recarregar o cache de schemas e reconhecer as permissões e a nova tabela!
NOTIFY pgrst, 'reload schema';

DROP TRIGGER IF EXISTS handle_updated_at_carrier_insurances ON public.carrier_insurances;

CREATE TRIGGER handle_updated_at_carrier_insurances
  BEFORE UPDATE ON public.carrier_insurances
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
