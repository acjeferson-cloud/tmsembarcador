import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testUpdate() {
  const negotiationId = 'd7387c25-c637-4e66-88e3-6e5c999030b2';
  console.log('Attempting to update status to aguardando_fatura...');
  const { data, error } = await supabase.from('freight_spot_negotiations')
    .update({ status: 'aguardando_fatura' })
    .eq('id', negotiationId)
    .eq('status', 'pendente_faturamento')
    .select();
    
  if (error) {
    console.error('Update failed with error:', error);
  } else {
    console.log('Update successful, data returned:', data);
  }
}

testUpdate();
