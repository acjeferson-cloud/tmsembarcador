import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://fake.supabase.co', 'fake-key');

const orgId = 'org-123';
const envId = 'env-123';
const estId = 'est-123';
const ilikeTerm = '%123%';

let ordersQuery = supabase
  .from('orders')
  .select(`id, numero_pedido, codigo_rastreio, status, valor_mercadoria, destino_cidade, destino_estado, business_partners(razao_social)`)
  .eq('organization_id', orgId)
  .eq('environment_id', envId);
  
if (estId) ordersQuery = ordersQuery.eq('establishment_id', estId);

ordersQuery = ordersQuery.or(`numero_pedido.ilike.${ilikeTerm},codigo_rastreio.ilike.${ilikeTerm}`).limit(5);

console.log(ordersQuery.url.toString());
