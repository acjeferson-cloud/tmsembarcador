import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function findCTe() {
  const { data, error } = await supabase
    .from('ctes')
    .select('id, chave_acesso, numero_documento, status')
    .like('chave_acesso', '4225128211%1074195405');
  console.log('Result:', data, 'Error:', error);
}

findCTe();
