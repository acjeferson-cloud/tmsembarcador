-- Criar a função RPC para gerar a Invoice Reversa com segurança transacional
CREATE OR REPLACE FUNCTION public.create_reverse_invoice(p_invoice_id UUID, p_motivo text DEFAULT 'Logística Reversa')
RETURNS UUID AS $$
DECLARE
  v_new_invoice_id UUID;
  v_orig_inv RECORD;
  v_orig_nfe RECORD;
BEGIN
  -- 1. Obter a fatura principal (invoices)
  SELECT * INTO v_orig_inv FROM public.invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fatura não encontrada (ID in invoices: %)', p_invoice_id;
  END IF;

  -- 2. Inserir clone na tabela principal de invoices
  INSERT INTO public.invoices (
    organization_id, environment_id, establishment_id, order_id,
    numero, serie, chave_acesso, tipo, modelo, data_emissao, data_saida,
    emitente_cnpj, emitente_nome, emitente_ie,
    destinatario_cpf_cnpj, destinatario_nome, destinatario_ie,
    destinatario_logradouro, destinatario_numero, destinatario_complemento, destinatario_bairro, destinatario_cidade, destinatario_estado, destinatario_cep, destinatario_pais,
    valor_produtos, valor_frete, valor_seguro, valor_desconto, valor_outras_despesas, valor_total,
    valor_icms, valor_ipi, valor_pis, valor_cofins,
    peso_bruto, peso_liquido, quantidade_volumes,
    xml_content, xml_processado, status, observacoes, metadata,
    direction, original_invoice_id
  ) VALUES (
    v_orig_inv.organization_id, v_orig_inv.environment_id, v_orig_inv.establishment_id, v_orig_inv.order_id,
    v_orig_inv.numero || '-REV', v_orig_inv.serie, NULL, 'entrada', v_orig_inv.modelo, CURRENT_DATE, NULL,
    v_orig_inv.destinatario_cpf_cnpj, v_orig_inv.destinatario_nome, v_orig_inv.destinatario_ie,
    v_orig_inv.emitente_cnpj, v_orig_inv.emitente_nome, v_orig_inv.emitente_ie,
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil',
    v_orig_inv.valor_produtos, v_orig_inv.valor_frete, v_orig_inv.valor_seguro, v_orig_inv.valor_desconto, v_orig_inv.valor_outras_despesas, v_orig_inv.valor_total,
    v_orig_inv.valor_icms, v_orig_inv.valor_ipi, v_orig_inv.valor_pis, v_orig_inv.valor_cofins,
    v_orig_inv.peso_bruto, v_orig_inv.peso_liquido, v_orig_inv.quantidade_volumes,
    NULL, false, 'pendente', 'Logística Reversa / Motivo: ' || p_motivo, v_orig_inv.metadata,
    'reverse', p_invoice_id
  ) RETURNING id INTO v_new_invoice_id;

  -- 3. Obter a NFe detalhada associada (se existir) na tabela `invoices_nfe`
  SELECT * INTO v_orig_nfe FROM public.invoices_nfe WHERE id = p_invoice_id;
  
  IF FOUND THEN
    -- Clone invoices_nfe (forçando o mesmo id gerado acima)
    INSERT INTO public.invoices_nfe (
      id, organization_id, environment_id, numero, serie, chave_acesso,
      data_emissao, natureza_operacao, modelo,
      emitente_cnpj, emitente_nome, destinatario_cnpj, destinatario_nome,
      valor_total, valor_produtos, valor_icms, valor_ipi, valor_frete,
      situacao, xml_content
    ) VALUES (
      v_new_invoice_id, v_orig_nfe.organization_id, v_orig_nfe.environment_id, v_orig_nfe.numero || '-REV', v_orig_nfe.serie, NULL,
      CURRENT_TIMESTAMP, 'Devolução de Venda', v_orig_nfe.modelo,
      v_orig_nfe.destinatario_cnpj, v_orig_nfe.destinatario_nome, v_orig_nfe.emitente_cnpj, v_orig_nfe.emitente_nome,
      v_orig_nfe.valor_total, v_orig_nfe.valor_produtos, v_orig_nfe.valor_icms, v_orig_nfe.valor_ipi, v_orig_nfe.valor_frete,
      'pendente', NULL
    );

    -- Clone os produtos e aponte para a nova conta (v_new_invoice_id)
    INSERT INTO public.invoices_nfe_products (invoice_nfe_id, organization_id, environment_id, numero_item, codigo_produto, descricao, ncm, cfop, unidade, quantidade, valor_unitario, valor_total, valor_desconto)
    SELECT v_new_invoice_id, organization_id, environment_id, numero_item, codigo_produto, descricao, ncm, cfop, unidade, quantidade, valor_unitario, valor_total, valor_desconto
    FROM public.invoices_nfe_products WHERE invoice_nfe_id = p_invoice_id;

    -- Clone os detalhes de cliente
    INSERT INTO public.invoices_nfe_customers (invoice_nfe_id, organization_id, environment_id, cnpj_cpf, razao_social, nome_fantasia, inscricao_estadual, logradouro, numero, complemento, bairro, cidade, estado, cep, telefone, email)
    SELECT v_new_invoice_id, organization_id, environment_id, cnpj_cpf, razao_social, nome_fantasia, inscricao_estadual, logradouro, numero, complemento, bairro, cidade, estado, cep, telefone, email
    FROM public.invoices_nfe_customers WHERE invoice_nfe_id = p_invoice_id;
  END IF;

  RETURN v_new_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
