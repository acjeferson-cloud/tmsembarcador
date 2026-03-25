import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
  const { data: envs } = await supabase.from('saas_environments').select('id, nome').eq('codigo', 'TESTES');
  if (!envs || envs.length === 0) {
    console.log("No Testes environment found");
    return;
  }
  const id = envs[0].id;
  console.log('Trying to hard delete env using RPC: ', id);
  const { error } = await supabase.rpc('delete_environment_cascade', { p_environment_id: id });
  if (error) {
    console.log('RPC Error object:', JSON.stringify(error, null, 2));
  } else {
    console.log('Successfully hard deleted via RPC!');
  }
}

testRpc();
