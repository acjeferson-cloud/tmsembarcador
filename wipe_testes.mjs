import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function purgeTestEnvironment() {
  const { data: envs } = await supabase.from('saas_environments').select('id, nome').eq('codigo', 'TESTES');
  if (!envs || envs.length === 0) {
    console.log("No Testes environment found");
    return;
  }
  const envId = envs[0].id;
  console.log(`Purging Environment: TESTES (${envId})`);

  // Tabelas ordenadas das "folhas" para o núcleo
  const tables = [
    'nps_settings',
    'nps_feedbacks',
    'system_logs',
    'dashboards',
    'delivery_tracking',
    'invoices_nfe',
    'invoices_cte',
    'pickups',
    'orders',
    'freight_quotes',
    'freight_rates',
    'additional_fees',
    'licenses',
    'restricted_items',
    'drivers',
    'vehicles',
    'carriers',
    'business_partners'
  ];

  // Passo 1: Limpar Associativas e Folhas via Query Direta no Postgres
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('environment_id', envId);
    if (error) {
      console.log(`Skip or Error on ${table}:`, error.message);
    } else {
      console.log(`Erased ${table} dependencies`);
    }
  }

  // Passo 2: Precisamos limpar user_establishments antes de apagar users/establishments
  // Como é Service Role, nós podemos buscar e iterar
  console.log('Fetching related Establishments...');
  const { data: ests } = await supabase.from('establishments').select('id').eq('environment_id', envId);
  if (ests) {
    for (const est of ests) {
      await supabase.from('user_establishments').delete().eq('establishment_id', est.id);
    }
    console.log(`Erased user_establishments mapping for ${ests.length} establishments`);
  }

  // Passo 3: Limpa Users e Establishments
  const { error: errEst } = await supabase.from('establishments').delete().eq('environment_id', envId);
  console.log('Establishments erased:', errEst ? errEst.message : 'OK');

  const { error: errUser } = await supabase.from('users').delete().eq('environment_id', envId);
  console.log('Users erased:', errUser ? errUser.message : 'OK');

  // Passo 4: Finalmente, destrói o ambiente
  const { error: errRoot } = await supabase.from('saas_environments').delete().eq('id', envId);
  if (errRoot) {
    console.error('FINAL ERROR on root environment:', errRoot.message);
  } else {
    console.log('✅ ENVIRONMENT TESTES PERMANENTLY DELETED FROM DATABASE');
  }
}

purgeTestEnvironment();
