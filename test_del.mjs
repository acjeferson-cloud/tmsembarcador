import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDel() {
  // Pega o id do environment 'Testes' da organizacao Demonstração
  const { data: envs } = await supabase.from('saas_environments').select('id, nome').eq('codigo', 'TESTES');
  if (!envs || envs.length === 0) {
    console.log("No Testes environment found");
    return;
  }
  const id = envs[0].id;
  console.log('Trying to hard delete env: ', id);
  const { error } = await supabase.from('saas_environments').delete().eq('id', id);
  if (error) {
    console.log('Error deleting:', error.message, error.details, error.hint);
  } else {
    console.log('Successfully hard deleted!');
  }
}

testDel();
