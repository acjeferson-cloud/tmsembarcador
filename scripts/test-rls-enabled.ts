import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSEnabled() {
  // Try to insert a row into invoices_nfe without session to see if RLS blocks it
  console.log('trying to insert into invoices_nfe without session');
  const { error } = await supabase.from('invoices_nfe').insert({
      organization_id: '26af5c56-31dd-49d5-bc7d-acdd066051c3',
      environment_id: '518f849d-d24c-420c-bc1f-38fdf957d21a',
      numero: '9999999',
      tipo_documento: 'NFe',
      serie: '1',
      chave_acesso: '12345678901234567890123456789012345678901234',
      data_emissao: new Date().toISOString()
  });
  console.log('insert error invoices_nfe:', error);
}
checkRLSEnabled();
