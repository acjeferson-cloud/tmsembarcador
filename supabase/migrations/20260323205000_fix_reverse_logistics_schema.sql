-- Migration corretiva: Move os campos de logística reversa para as tabelas principais em uso no sistema (invoices_nfe e ctes_complete)

-- 1. Adição de campos estruturais na tabela invoices_nfe (a verdadeira tabela usada pela UI)
ALTER TABLE public.invoices_nfe 
ADD COLUMN IF NOT EXISTS direction text DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound', 'reverse')),
ADD COLUMN IF NOT EXISTS original_invoice_id uuid REFERENCES public.invoices_nfe(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.invoices_nfe.direction IS 'Direção do fluxo da nota: outbound (saída normal), inbound (entrada normal), reverse (logística reversa)';
COMMENT ON COLUMN public.invoices_nfe.original_invoice_id IS 'Vincula uma nota reversa à sua nota NFe de saída original';

-- 2. Adição de campos na nova tabela ctes_complete
ALTER TABLE public.ctes_complete 
ADD COLUMN IF NOT EXISTS direction text DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound', 'reverse'));

COMMENT ON COLUMN public.ctes_complete.direction IS 'Direção do frete do CT-e correspondente';

-- Forçar update nos registros existentes
UPDATE public.invoices_nfe SET direction = 'outbound' WHERE direction IS NULL;
UPDATE public.ctes_complete SET direction = 'outbound' WHERE direction IS NULL;

-- 3. Atualizar a procedure RPC para buscar, clonar e operar EXCLUSIVAMENTE via invoices_nfe
CREATE OR REPLACE FUNCTION public.create_reverse_invoice(p_invoice_id UUID, p_motivo text DEFAULT 'Logística Reversa')
RETURNS UUID AS $$
DECLARE
  v_new_invoice_id UUID;
  v_orig_nfe RECORD;
BEGIN
  -- 1. Obter a NFe detalhada diretamente em invoices_nfe
  SELECT * INTO v_orig_nfe FROM public.invoices_nfe WHERE id = p_invoice_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fatura não encontrada (ID in invoices_nfe: %)', p_invoice_id;
  END IF;

  -- 2. Inserir clone na tabela principal invoices_nfe trocando remetente/destinatário logicamente para devolução
  INSERT INTO public.invoices_nfe (
    organization_id, environment_id, establishment_id, carrier_id, numero, serie, chave_acesso,
    data_emissao, natureza_operacao, modelo,
    emitente_cnpj, emitente_nome, destinatario_cnpj, destinatario_nome,
    valor_total, valor_produtos, valor_icms, valor_ipi, valor_frete,
    situacao, xml_content, direction, original_invoice_id
  ) VALUES (
    v_orig_nfe.organization_id, v_orig_nfe.environment_id, v_orig_nfe.establishment_id, v_orig_nfe.carrier_id, 
    v_orig_nfe.numero || '-REV', v_orig_nfe.serie, NULL,
    CURRENT_TIMESTAMP, 'Devolução / Motivo: ' || p_motivo, v_orig_nfe.modelo,
    v_orig_nfe.destinatario_cnpj, v_orig_nfe.destinatario_nome, v_orig_nfe.emitente_cnpj, v_orig_nfe.emitente_nome,
    v_orig_nfe.valor_total, v_orig_nfe.valor_produtos, v_orig_nfe.valor_icms, v_orig_nfe.valor_ipi, v_orig_nfe.valor_frete,
    'pendente', NULL, 'reverse', p_invoice_id
  ) RETURNING id INTO v_new_invoice_id;

  -- 3. Clone os produtos apontando para a nova invoice (mantendo os itens para reentrada)
  INSERT INTO public.invoices_nfe_products (invoice_nfe_id, organization_id, environment_id, numero_item, codigo_produto, descricao, ncm, cfop, unidade, quantidade, valor_unitario, valor_total, valor_desconto)
  SELECT v_new_invoice_id, organization_id, environment_id, numero_item, codigo_produto, descricao, ncm, cfop, unidade, quantidade, valor_unitario, valor_total, valor_desconto
  FROM public.invoices_nfe_products WHERE invoice_nfe_id = p_invoice_id;

  -- 4. Clone os detalhes de cliente
  INSERT INTO public.invoices_nfe_customers (invoice_nfe_id, organization_id, environment_id, cnpj_cpf, razao_social, nome_fantasia, inscricao_estadual, logradouro, numero, complemento, bairro, cidade, estado, cep, telefone, email)
  SELECT v_new_invoice_id, organization_id, environment_id, cnpj_cpf, razao_social, nome_fantasia, inscricao_estadual, logradouro, numero, complemento, bairro, cidade, estado, cep, telefone, email
  FROM public.invoices_nfe_customers WHERE invoice_nfe_id = p_invoice_id;

  RETURN v_new_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
