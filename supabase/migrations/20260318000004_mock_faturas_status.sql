-- ==============================================================================
-- MIGRATION: 20260318000004_mock_faturas_status.sql
-- DESCRIPTION: Adequação e injeção de dados simulados (mock) para garantir presença 
-- visual de todos os novos Status organizacionais solicitados da malha de Faturas.
-- ==============================================================================

-- 1. Uniformiza os rótulos de dados orgânicos que eventualmente existirem
UPDATE public.bills SET status = 'importada' WHERE status = 'importado';
UPDATE public.bills SET status = 'auditada_aprovada' WHERE status = 'auditado_aprovado';
UPDATE public.bills SET status = 'auditada_reprovada' WHERE status = 'auditado_reprovado';
UPDATE public.bills SET status = 'cancelada' WHERE status = 'cancelado';
-- 'com_nfe_referenciada' sofre apenas ajustes de UI e permanece o mesmo textualmente na base

-- 2. Declarar variáveis essenciais para o laço
DO $$
DECLARE
    v_org_id UUID;
    v_env_id UUID;
    i INTEGER;
    j INTEGER;
    mock_status VARCHAR(50);
    mock_status_array VARCHAR[] := ARRAY['importada', 'auditada_aprovada', 'auditada_reprovada', 'com_nfe_referenciada', 'cancelada'];
    v_total_base DECIMAL;
    v_custo_base DECIMAL;
BEGIN
    -- Obter a primeira organização disponível no banco
    SELECT id INTO v_org_id FROM public.saas_organizations LIMIT 1;
    SELECT id INTO v_env_id FROM public.saas_environments LIMIT 1;

    -- Se não existir ambiente mockado, ignoramos
    IF v_org_id IS NULL THEN
        RAISE NOTICE 'Nenhuma organização/ambiente encontrado para aplicar mock.';
        RETURN;
    END IF;

    -- 3. Gerar 5 faturas exclusivas PARA CADA UM dos 5 status (Total de 25 faturas)
    FOR i IN 1..5 LOOP
        mock_status := mock_status_array[i];
        
        FOR j IN 1..5 LOOP
            -- Variação randômica inteligente para Totais Realistas
            v_total_base := floor(random() * (15000 - 1500 + 1) + 1500); 
            v_custo_base := v_total_base * (random() * (1.1 - 0.9) + 0.9); -- custo +/- 10%

            INSERT INTO public.bills (
                organization_id,
                environment_id,
                bill_number,
                issue_date,
                due_date,
                customer_name,
                customer_document,
                total_value,
                paid_value,
                discount_value,
                status,
                created_at,
                updated_at
            ) VALUES (
                v_org_id,
                v_env_id,
                'FAT-MOCK-' || upper(substr(md5(random()::text), 1, 6)) || '-' || mock_status, -- numero fatura
                NOW() - (random() * 30 || ' days')::interval, -- data_emissao (ultimos 30 dias)
                NOW() + (random() * 15 || ' days')::interval, -- data_vencimento (proximos 15 dias)
                'Transportadora Parceira ' || chr(floor(random() * 26) + 65::integer) || chr(floor(random() * 26) + 65::integer),
                '00.000.000/0001-' || lpad(floor(random() * 99)::text, 2, '0'),
                v_total_base,  -- valor da fatura original
                v_custo_base,  -- valor apurado/custo cte
                (CASE WHEN random() > 0.7 THEN floor(random() * 500) ELSE 0 END), -- desconto randômico
                mock_status,
                NOW() - (random() * 28 || ' days')::interval, -- data entrada
                NOW() - (random() * 10 || ' days')::interval  -- data_aprovacao / update
            )
            ON CONFLICT (bill_number) DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Mock data gerado com sucesso para visualização de Faturas!';
END $$;
