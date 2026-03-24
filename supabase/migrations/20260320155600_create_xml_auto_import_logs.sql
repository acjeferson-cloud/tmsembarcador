-- Migration para criar tabela de log de importação automática de XML

-- Create table xml_auto_import_logs
CREATE TABLE IF NOT EXISTS public.xml_auto_import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning', 'running')),
    nfe_imported INTEGER DEFAULT 0,
    cte_imported INTEGER DEFAULT 0,
    total_processed INTEGER DEFAULT 0,
    emails_checked INTEGER DEFAULT 0,
    error_message TEXT,
    details JSONB,
    should_stop BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.xml_auto_import_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
DROP POLICY IF EXISTS "Allow read access to all authenticated users for xml logs" ON public.xml_auto_import_logs;
CREATE POLICY "Allow read access to all authenticated users for xml logs"
ON public.xml_auto_import_logs FOR SELECT TO authenticated USING (true);

-- Allow insert access to authenticated users and service role
DROP POLICY IF EXISTS "Allow insert access to authenticated users for xml logs" ON public.xml_auto_import_logs;
CREATE POLICY "Allow insert access to authenticated users for xml logs"
ON public.xml_auto_import_logs FOR INSERT TO authenticated, service_role WITH CHECK (true);

-- Allow update access for stopping executions
DROP POLICY IF EXISTS "Allow update access to authenticated users for xml logs" ON public.xml_auto_import_logs;
CREATE POLICY "Allow update access to authenticated users for xml logs"
ON public.xml_auto_import_logs FOR UPDATE TO authenticated USING (true);


-- Create cleanup_stuck_import_logs RPC function
CREATE OR REPLACE FUNCTION public.cleanup_stuck_import_logs()
RETURNS void AS $$
BEGIN
  UPDATE public.xml_auto_import_logs
  SET status = 'error',
      error_message = 'Execução cancelada por tempo limite (timeout)',
      details = jsonb_build_object('error', 'Execution stuck in running status', 'fixed_by', 'cleanup_stuck_import_logs')
  WHERE status = 'running'
  AND execution_time < NOW() - INTERVAL '15 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create get_xml_logs RPC function
CREATE OR REPLACE FUNCTION public.get_xml_logs()
RETURNS setof public.xml_auto_import_logs AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.xml_auto_import_logs
  ORDER BY execution_time DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
