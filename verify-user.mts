import { supabase } from './src/lib/supabase';

async function test() {
  const { data, error } = await supabase
    .from('users')
    .select('id, codigo, nome, environment_id, estabelecimento_id, estabelecimentos_permitidos')
    .limit(10);
    
  console.log(JSON.stringify(data, null, 2));
  if (error) console.error(error);
}

test();
