require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: pol } = await supabase.from('carrier_insurances').select('id, organization_id, environment_id, carrier_id(fantasia)').eq('numero_apolice', '1234564231878916').single();
  
  if (!pol) { 
      console.log('Apólice não encontrada nas bases... Inserindo notificação forçada via auth de bypass.');
  }
  
  const org = pol ? pol.organization_id : 'e8331393-25e2-4573-aeaf-1cb9f2fc28d3'; // fallback
  const env = pol ? pol.environment_id : 'c0316dce-98a2-4a7b-a25b-0a7ebbfcf2ea'; // fallback

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
  console.log(error || 'simulated notification sent');
}
run();
