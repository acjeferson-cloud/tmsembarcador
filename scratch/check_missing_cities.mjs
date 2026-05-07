import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCities() {
  const codes = ['3136553', '3139409', '3169307'];
  const names = ['José Raydan', 'Manhuaçu', 'Três Corações', 'Jose Raydan', 'Manhuacu', 'Tres Coracoes'];

  console.log("Searching by IBGE codes:");
  const { data: byCode, error: errCode } = await supabase
    .from('cities')
    .select('*')
    .in('codigo_ibge', codes);
  console.log(errCode ? errCode : byCode);

  console.log("\nSearching by Names (ilike):");
  const { data: byName, error: errName } = await supabase
    .from('cities')
    .select('*')
    .or(`nome.ilike.%Raydan%,nome.ilike.%Manhua%,nome.ilike.%Cora%`);
  console.log(errName ? errName : byName);
}

checkCities();
