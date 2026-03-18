import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEnvs() {
  const { data: envs } = await supabase.from('saas_environments').select('id, organization_id, nome, tipo');
  console.log('288dd... is:', envs?.find(e => e.id.includes('288dd')));
  console.log('518f8... is:', envs?.find(e => e.id.includes('518f8')));
  console.log('b0d1a... is:', envs?.find(e => e.id.includes('b0d1aa')));
}
testEnvs();
