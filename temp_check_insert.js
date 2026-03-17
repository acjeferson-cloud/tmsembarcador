import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env', 'utf8');
const lines = envFile.split('\n');
const supabaseUrl = lines.find(l => l.startsWith('VITE_SUPABASE_URL='))?.split('=')[1]?.replace(/['"\r\n]/g, '')?.trim();
const supabaseKey = lines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY='))?.split('=')[1]?.replace(/['"\r\n]/g, '')?.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const requestNumber = `REQ-${Date.now()}`;
  const requestData = {
    pickup_id: 'ea91c4ef-a421-4073-937e-c910ba1d5306', // real pickup from earlier query
    request_number: requestNumber,
    requested_at: new Date().toISOString(),
    requested_by: 0,
    requested_by_name: 'Sistema Teste',
    notification_method: 'email',
    carrier_email: 'teste@teste.com',
    carrier_phone: '',
    email_sent: false,
    whatsapp_sent: false,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('pickup_requests').insert(requestData).select();
  console.log('Insert Error:', error);
  console.log('Inserted Data:', data);
}

main();
