import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const orgId = 'a7c49619-53f0-4401-9b17-2a830dd4da40';
  const envId = 'b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1';
  const estabId = '5ca0807a-7e5f-44fe-80c9-cb5e30d5d984';

  // call set_session_context
  const { error: rpcErr } = await supabase.rpc('set_session_context', {
    p_organization_id: orgId,
    p_environment_id: envId,
    p_establishment_id: estabId,
    p_user_email: 'jeferson.costa@example.com'
  });
  console.log('rpc err:', rpcErr);

  let query = supabase.from('orders').select('id, numero_pedido').limit(5);
  query = query.eq('organization_id', orgId);
  query = query.eq('environment_id', envId);
  query = query.eq('establishment_id', estabId);

  const { data, error } = await query;
  console.log('Queried with estabId:', data, error);

  // query WITHOUT estab id
  let query2 = supabase.from('orders').select('id, numero_pedido').limit(5);
  query2 = query2.eq('organization_id', orgId);
  query2 = query2.eq('environment_id', envId);
  const { data: d2, error: e2 } = await query2;
  console.log('Queried WITHOUT estabId:', d2, e2);
}

test();
