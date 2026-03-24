import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function check() {
  const { data, error } = await supabase.from('user_innovations')
    .select(`
      id,
      organization_id,
      environment_id,
      establishment_code,
      is_active,
      innovation_id,
      innovations ( id, name, innovation_key )
    `)
    .limit(20);

  if (error) {
    console.error(error);
  } else {
    console.dir(data, { depth: null });
  }
}
check();
