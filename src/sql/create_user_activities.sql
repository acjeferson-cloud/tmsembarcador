-- Criar tabela (Recriar limpa caso exista)
DROP TABLE IF EXISTS public.user_activities;

CREATE TABLE IF NOT EXISTS public.user_activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.saas_organizations(id),
  environment_id uuid REFERENCES public.saas_environments(id),
  user_id TEXT NOT NULL,
  user_name text,
  module_name text NOT NULL,
  action_type text NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Policies (permitir leitura e escrita para compatibilidade de sessões legadas)
CREATE POLICY "Enable all for authenticated/anon within organization"
ON public.user_activities
FOR ALL
USING (true)
WITH CHECK (true);

-- ROTINA DE LIMPEZA AUTOMÁTICA (REMOVER SE MAIS ANTIGO QUE 3 DIAS)
-- 1. Ativar a extensão pg_cron (nativa do Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Criar função para remover os registros
CREATE OR REPLACE FUNCTION clean_old_user_activities()
RETURNS void AS $$
BEGIN
  DELETE FROM public.user_activities
  WHERE created_at < NOW() - INTERVAL '3 days';
END;
$$ LANGUAGE plpgsql;

-- 3. Agendar a limpeza para rodar todo dia à meia noite (00:00)
-- O primeiro parâmetro é o nome do job, o segundo é a expressão CRON, e o terceiro a query
DO $$
BEGIN
  -- Tentar desativar caso já exista para recriar
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-clean-user-activities') THEN
    PERFORM cron.unschedule('daily-clean-user-activities');
  END IF;
END $$;

SELECT cron.schedule(
  'daily-clean-user-activities', -- Nome do job
  '0 0 * * *',                   -- Todo dia às 00:00
  $$SELECT clean_old_user_activities();$$
);
