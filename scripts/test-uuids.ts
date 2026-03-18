import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || supabaseKey);

async function checkIds() {
  const orgResult1 = await supabase.from('saas_organizations').select('id, nome').eq('id', 'a7c49619-53f0-4401-9b17-2a830dd4da40');
  console.log('Orgs matching a7c49:', orgResult1.data);

  const orgResult2 = await supabase.from('saas_organizations').select('id, nome').eq('id', '26af5c56-31dd-49d5-bc7d-acdd066051c3');
  console.log('Orgs matching 26af5:', orgResult2.data);
  
  if (orgResult2.data?.length === 0) {
     const envResult = await supabase.from('saas_environments').select('id, nome').eq('id', '26af5c56-31dd-49d5-bc7d-acdd066051c3');
     console.log('Envs matching 26af5:', envResult.data);
     const estabResult = await supabase.from('establishments').select('id, razao_social').eq('id', '26af5c56-31dd-49d5-bc7d-acdd066051c3');
     console.log('Estabs matching 26af5:', estabResult.data);
  }
}
checkIds();
