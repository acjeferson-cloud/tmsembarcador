require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: pols, error: err } = await supabase
      .from('carrier_insurances')
      .select('*, carriers(codigo, razao_social)')
      .limit(1);
      
  if (err) return console.log('ERROR', err);
  if (!pols || pols.length === 0) return console.log('no carrier_insurances found. Table is empty.');
  
  const pol = pols[0];
  var org = pol.organization_id;
  var env = pol.environment_id;
  
  const codigo = pol.carriers?.codigo || '0001';
  const razaoSocial = pol.carriers?.razao_social || 'ALFA Transportes LTDA';

  const insert = {
    title: 'Apólice Próxima do Vencimento',
    message: `Atenção! A apólice RCTR-C (Porto Seguro, 1234564231878916) vencerá em 3 dias (14/04/2026). Providencie a renovação da Transportadora ${codigo} - ${razaoSocial} para evitar bloqueio operacional em cotações e embarques.`,
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
