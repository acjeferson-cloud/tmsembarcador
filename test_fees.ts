import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: state } = await supabase.from('states').select('id, sigla').eq('sigla', 'SP').single();
  const { data: city } = await supabase.from('cities').select('id, nome, codigo_ibge').eq('state_id', state.id).ilike('nome', 'Embu das Artes').single();
  
  console.log("State SP:", state);
  console.log("City Embu das Artes:", city);

  // let's fetch the table fees
  const tableId = 'fe674b01-f254-47cd-be12-32a7ddb3b55c'; // I need to get the real table id. Let's just find the fee for Embu das Artes in DB.
  const { data: fees } = await supabase.from('freight_rate_additional_fees').select('*').ilike('fee_type', 'TDA');
  console.log("TDA Fees in DB:", fees.length);
  const embuFees = fees.filter(f => f.city_id === city.id || f.city_id === city.codigo_ibge);
  console.log("Fees explicitly for Embu:", embuFees);
}
run();
