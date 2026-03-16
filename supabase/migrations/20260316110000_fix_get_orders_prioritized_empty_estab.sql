/*
  # Fix empty establishment_id in get_orders_prioritized
  
  1. Problema
    - A função set_session_context define app.current_establishment_id como string vazia ('') em vez de NULL.
    - get_orders_prioritized verifica (ctx_estab_id IS NULL). Como o valor é '', a verificação falha, e ele tenta buscar o estab_id = '', retornando vazio.
  
  2. Solução
    - Adicionar o NULLIF(..., '') ao resgatar o contexto, convertendo string vazia para NULL.
*/

CREATE OR REPLACE FUNCTION get_orders_prioritized()
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  environment_id uuid,
  establishment_id uuid,
  numero_pedido text,
  tipo text,
  business_partner_id uuid,
  carrier_id uuid,
  status text,
  data_pedido date,
  data_prevista_coleta date,
  data_prevista_entrega date,
  data_coleta_realizada timestamptz,
  data_entrega_realizada timestamptz,
  origem_cep text,
  origem_logradouro text,
  origem_numero text,
  origem_complemento text,
  origem_bairro text,
  origem_cidade text,
  origem_estado text,
  origem_pais text,
  destino_cep text,
  destino_logradouro text,
  destino_numero text,
  destino_complemento text,
  destino_bairro text,
  destino_cidade text,
  destino_estado text,
  destino_pais text,
  valor_mercadoria numeric,
  valor_frete numeric,
  valor_seguro numeric,
  valor_outras_despesas numeric,
  valor_total numeric,
  peso_bruto numeric,
  peso_liquido numeric,
  quantidade_volumes integer,
  observacoes text,
  created_at timestamptz,
  updated_at timestamptz
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  ctx_org_id text;
  ctx_env_id text;
  ctx_estab_id text;
BEGIN
  -- Buscar contexto da sessão (garantindo que string vazia vire NULL)
  ctx_org_id := NULLIF(current_setting('app.current_organization_id', true), '');
  ctx_env_id := NULLIF(current_setting('app.current_environment_id', true), '');
  ctx_estab_id := NULLIF(current_setting('app.current_establishment_id', true), '');

  -- Debug
  RAISE NOTICE '[get_orders_prioritized] Contexto: org=%, env=%, estab=%', ctx_org_id, ctx_env_id, ctx_estab_id;

  -- Retornar pedidos filtrando por contexto
  RETURN QUERY
  SELECT 
    o.id,
    o.organization_id,
    o.environment_id,
    o.establishment_id,
    o.numero_pedido,
    o.tipo,
    o.business_partner_id,
    o.carrier_id,
    o.status,
    o.data_pedido,
    o.data_prevista_coleta,
    o.data_prevista_entrega,
    o.data_coleta_realizada,
    o.data_entrega_realizada,
    o.origem_cep,
    o.origem_logradouro,
    o.origem_numero,
    o.origem_complemento,
    o.origem_bairro,
    o.origem_cidade,
    o.origem_estado,
    o.origem_pais,
    o.destino_cep,
    o.destino_logradouro,
    o.destino_numero,
    o.destino_complemento,
    o.destino_bairro,
    o.destino_cidade,
    o.destino_estado,
    o.destino_pais,
    o.valor_mercadoria,
    o.valor_frete,
    o.valor_seguro,
    o.valor_outras_despesas,
    o.valor_total,
    o.peso_bruto,
    o.peso_liquido,
    o.quantidade_volumes,
    o.observacoes,
    o.created_at,
    o.updated_at
  FROM orders o
  WHERE o.organization_id::text = ctx_org_id
    AND o.environment_id::text = ctx_env_id
    AND (ctx_estab_id IS NULL OR o.establishment_id::text = ctx_estab_id)
  ORDER BY o.data_pedido DESC NULLS LAST, o.numero_pedido DESC;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION get_orders_prioritized() TO anon;
GRANT EXECUTE ON FUNCTION get_orders_prioritized() TO authenticated;
