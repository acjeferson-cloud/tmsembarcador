require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: orgs } = await supabase.from('environments').select('id, organization_id').limit(1);
  if (!orgs || orgs.length === 0) return console.log('no environment found');
  const org = orgs[0].organization_id;
  const env = orgs[0].id;

  const insert = {
    title: 'Apólice Próxima do Vencimento',
    message: 'Atenção! A apólice RCTR-C (Porto Seguro, 1234564231878916) vencerá em 3 dias (14/04/2026). Providencie a renovação do transportador para evitar bloqueio operacional em cotações e embarques.',
    type: 'warning',
    priority: 'warning',
    link: '/carriers',
    is_read: false,
    organization_id: org,
    environment_id: env,
  };
  
  const { error } = await supabase.from('notifications').insert(insert);
  console.log(error || '🔔 SIMULATED NOTIFICATION SENT SUCCESSFULLY FOR ORGANIZATION ' + org);
}
run();
