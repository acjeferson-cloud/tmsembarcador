import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInvalidUUID() {
  const orgId = 'a7c49619-53f0-4401-9b17-2a830dd4da40';
  const envId = 'b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1';
  let query = supabase.from('orders').select('id, numero_pedido').limit(5);
  query = query.eq('organization_id', orgId);
  query = query.eq('environment_id', envId);
  query = query.eq('establishment_id', 'undefined'); // literal string

  const { data, error } = await query;
  console.log('Result with undefined:', data);
  console.log('Error with undefined:', error);
}

testInvalidUUID();
