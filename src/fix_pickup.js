import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('pickup_invoices').insert({
     organization_id: 'a7c49619-53f0-4401-9b17-2a830dd4da40',
     environment_id: 'b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1',
     establishment_id: '5ca0807a-7e5f-44fe-80c9-cb5e30d5d984',
     pickup_id: '9d876371-e256-4662-bb9d-fbc0909b4f91',
     invoice_id: '8ecf5076-6914-470b-b485-7eaec40a4032'
  });
  console.log('Inserted:', error ? error : 'Success');
}

test();
