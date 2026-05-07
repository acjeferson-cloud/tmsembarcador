import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertCities() {
  const stateIdMG = 'e7dcdead-40f6-4fe1-bad5-cb3e84565d7e';

  const citiesToInsert = [
    {
      state_id: stateIdMG,
      codigo_ibge: '3136553',
      nome: 'José Raydan',
      ativo: true
    },
    {
      state_id: stateIdMG,
      codigo_ibge: '3139409',
      nome: 'Manhuaçu',
      ativo: true
    },
    {
      state_id: stateIdMG,
      codigo_ibge: '3169307',
      nome: 'Três Corações',
      ativo: true
    }
  ];

  const { data, error } = await supabase
    .from('cities')
    .insert(citiesToInsert)
    .select();

  if (error) {
    console.error("Error inserting cities:", error);
  } else {
    console.log("Cities inserted successfully:");
    console.log(data);
  }
}

insertCities();
