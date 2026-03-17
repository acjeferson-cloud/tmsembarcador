-- ==============================================================================
-- MIGRATION: 20260318000000_create_bills_tables.sql
-- DESCRIPTION: Criação das tabelas para receber as faturas importadas via EDI (DOCCOB)
-- ==============================================================================

-- Tabela principal de faturas (Bills)
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.saas_organizations(id),
    environment_id UUID REFERENCES public.saas_environments(id),
    establishment_id UUID REFERENCES public.establishments(id),
    
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    
    customer_name VARCHAR(150),
    customer_document VARCHAR(20),
    
    total_value DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    paid_value DECIMAL(15, 2),
    discount_value DECIMAL(15, 2),
    
    status VARCHAR(50) DEFAULT 'importado', -- importado, auditado_aprovado, auditado_reprovado, cancelado
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela `bills`
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para `bills` 
CREATE POLICY "anon_all_bills" ON public.bills FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- Tabela de relacionamento entre Faturas (Bills) e CT-es (ctes_complete)
CREATE TABLE IF NOT EXISTS public.bill_ctes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
    cte_id UUID REFERENCES public.ctes_complete(id) ON DELETE CASCADE,
    cte_number VARCHAR(50), 
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.bill_ctes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_bill_ctes" ON public.bill_ctes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Indexes 
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON public.bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bill_ctes_bill_id ON public.bill_ctes(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_ctes_cte_id ON public.bill_ctes(cte_id);

-- Update timestamp function triger
CREATE TRIGGER update_bills_updated_at
    BEFORE UPDATE ON public.bills
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
