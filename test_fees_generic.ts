import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: state } = await supabase.from('states').select('id, sigla').eq('sigla', 'SP').single();
  const { data: city } = await supabase.from('cities').select('id, nome, codigo_ibge').eq('state_id', state.id).ilike('nome', 'Embu das Artes').single();
  
  const { data: fees } = await supabase.from('freight_rate_additional_fees').select('*').eq('fee_type', 'TDA');
  
  const embuFees = fees.filter(f => f.city_id === city.id || f.city_id === city.codigo_ibge);
  const spFees = fees.filter(f => f.state_id === state.id && !f.city_id);
  const allFees = fees.filter(f => !f.state_id && !f.city_id);
  
  console.log("Embu Fees:", embuFees);
  console.log("SP generic Fees:", spFees);
  console.log("All generic Fees:", allFees);
}
run();
