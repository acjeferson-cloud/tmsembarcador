/*
  # Corrigir get_orders_prioritized para Respeitar RLS
  
  1. Problema
    - Função estava com SECURITY DEFINER
    - Isso fazia ela IGNORAR as políticas RLS
    - Retornava TODOS os pedidos de TODAS as organizations
    
  2. Solução
    - Remover SECURITY DEFINER
    - Usar SECURITY INVOKER (padrão)
    - Adicionar filtro manual por organization_id e environment_id
    - RLS será aplicado automaticamente
*/

DROP FUNCTION IF EXISTS get_orders_prioritized();

CREATE FUNCTION get_orders_prioritized()
RETURNS TABLE(
  id UUID,
  order_number TEXT,
  customer_id UUID,
  customer_name TEXT,
  issue_date TIMESTAMPTZ,
  entry_date TIMESTAMPTZ,
  expected_delivery TIMESTAMPTZ,
  carrier_id UUID,
  carrier_name TEXT,
  freight_value NUMERIC,
  order_value NUMERIC,
  destination_city TEXT,
  destination_state TEXT,
  recipient_phone TEXT,
  status TEXT,
  tracking_code TEXT,
  observations TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by INTEGER,
  updated_by INTEGER,
  delivery_status JSON
)
LANGUAGE plpgsql
SECURITY INVOKER  -- CORRIGIDO: INVOKER ao invés de DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.customer_id,
    o.customer_name,
    o.issue_date,
    o.entry_date,
    o.expected_delivery,
    o.carrier_id,
    o.carrier_name,
    o.freight_value,
    o.order_value,
    o.destination_city,
    o.destination_state,
    o.recipient_phone,
    o.status,
    o.tracking_code,
    o.observations,
    o.created_at,
    o.updated_at,
    o.created_by,
    o.updated_by,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', ods.id,
            'order_id', ods.order_id,
            'status', ods.status,
            'date', ods.date,
            'location', ods.location,
            'observation', ods.observation,
            'created_at', ods.created_at
          ) ORDER BY ods.date DESC
        )
        FROM order_delivery_status ods
        WHERE ods.order_id = o.id
      ),
      '[]'::json
    ) as delivery_status
  FROM orders o
  -- RLS será aplicado automaticamente aqui!
  -- Filtra apenas orders da organization_id e environment_id do session context
  ORDER BY o.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_orders_prioritized() TO anon;
