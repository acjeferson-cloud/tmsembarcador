import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendQuery() {
  const orgId = 'a7c49619-53f0-4401-9b17-2a830dd4da40';
  const envId = 'b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1';
  const estabId = '5ca0807a-7e5f-44fe-80c9-cb5e30d5d984';

  let query = supabase
    .from('orders')
    .select('*, business_partners (razao_social), carriers (razao_social)', { count: 'exact' });

  query = query.eq('organization_id', orgId);
  query = query.eq('environment_id', envId);
  query = query.eq('establishment_id', estabId);

  const { data, error, count } = await query.order('data_pedido', { ascending: false });
  console.log('Result length:', data?.length);
  console.log('Error:', error);
}

testFrontendQuery();
