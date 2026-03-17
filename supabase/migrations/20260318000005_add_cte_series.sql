-- ==============================================================================
-- MIGRATION: 20260318000005_add_cte_series.sql
-- DESCRIPTION: Adiciona a coluna cte_series à tabela bill_ctes para suportar a 
-- extração da Série do CT-e durante o parser de DOCCOB (EDI).
-- ==============================================================================

ALTER TABLE public.bill_ctes 
ADD COLUMN IF NOT EXISTS cte_series VARCHAR(20);
