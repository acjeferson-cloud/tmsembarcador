require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: pol } = await supabase.from('carrier_insurances').select('id, organization_id, environment_id, carrier_id(fantasia)').eq('numero_apolice', '1234564231878916').single();
  
  if (!pol) { 
      console.log('Apólice não encontrada. Buscando qualquer organização...');
      const { data: orgs } = await supabase.from('environments').select('id, organization_id').limit(1);
      if (!orgs || orgs.length === 0) return console.log('no environment found');
      var org = orgs[0].organization_id;
      var env = orgs[0].id;
  } else {
      var org = pol.organization_id;
      var env = pol.environment_id;
  }

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
