import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const { data: stateData } = await supabase.from('states').select('id').eq('sigla', 'SC').single();
  const scId = stateData.id;
  
  await supabase.from('cities').insert([
    {
       nome: 'Itajaí',
       codigo_ibge: '4208203',
       state_id: scId,
       ativo: true
    }
  ]);
  console.log("Itajaí inserted!");
}

run();
