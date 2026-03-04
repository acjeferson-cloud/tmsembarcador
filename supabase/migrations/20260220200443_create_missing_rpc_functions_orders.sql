/*
  # Criar funções RPC faltantes para Orders
  
  Cria a função get_orders_prioritized que o frontend está chamando
*/

-- Função para buscar pedidos com priorização por estabelecimento do usuário
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
  v_user_org_id uuid;
  v_user_env_id uuid;
  v_user_estab_id uuid;
BEGIN
  -- Buscar contexto do usuário (se estiver usando custom auth)
  SELECT 
    current_setting('app.current_organization_id', true)::uuid,
    current_setting('app.current_environment_id', true)::uuid,
    current_setting('app.current_establishment_id', true)::uuid
  INTO v_user_org_id, v_user_env_id, v_user_estab_id;

  -- Se não há contexto, buscar do perfil do usuário  
  IF v_user_org_id IS NULL THEN
    SELECT organization_id, environment_id, estabelecimento_id
    INTO v_user_org_id, v_user_env_id, v_user_estab_id
    FROM users
    WHERE id = auth.uid();
  END IF;

  -- Retornar pedidos da organização e ambiente do usuário
  -- Se tiver estabelecimento selecionado, filtrar por ele, senão mostrar todos que tem acesso
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
  WHERE o.organization_id = COALESCE(v_user_org_id, o.organization_id)
    AND o.environment_id = COALESCE(v_user_env_id, o.environment_id)
    AND (v_user_estab_id IS NULL OR o.establishment_id = v_user_estab_id 
         OR o.establishment_id IN (
           SELECT establishment_id FROM user_establishments 
           WHERE user_id = auth.uid()
         ))
  ORDER BY o.data_pedido DESC, o.numero_pedido DESC;
END;
$$;

-- Dar permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION get_orders_prioritized() TO authenticated;
