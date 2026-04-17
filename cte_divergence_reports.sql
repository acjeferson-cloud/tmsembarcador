-- Tabela para armazenar os relatórios de divergência gerados
CREATE TABLE IF NOT EXISTS public.cte_divergence_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cte_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    establishment_id TEXT NOT NULL,
    carrier_id UUID NOT NULL,
    cte_number TEXT NOT NULL,
    carrier_name TEXT NOT NULL,
    report_data JSONB NOT NULL,
    sent_by_email BOOLEAN DEFAULT false,
    email_sent_to TEXT,
    sent_by_whatsapp BOOLEAN DEFAULT false,
    whatsapp_sent_to TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.cte_divergence_reports ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS simples (assumindo que o estabelecimento controla o acesso)
CREATE POLICY "Acesso total para usuários autenticados" ON public.cte_divergence_reports
    FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_cte_divergence_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_update_cte_divergence_reports_updated_at
    BEFORE UPDATE ON public.cte_divergence_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_cte_divergence_reports_updated_at();
