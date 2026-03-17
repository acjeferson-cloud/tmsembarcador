import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function test() {
  const logData = {
    invoice_id: 'b5a29339-1051-4563-a87f-fbec832d489c', // mock invoice
    invoice_number: '945679',
    business_partner_id: '2e35bfe1-552f-4c34-a906-c563208440e6', // partner found
    contact_id: 'd7f30588-768c-4591-87a0-587d607a110f', // contact found
    contact_name: 'Jeferson Costa',
    channel: 'whatsapp',
    event_type: 'Entrega Realizada Normalmente',
    occurrence_code: '001',
    status: 'success',
    log_message: 'Mensagem WhatsApp de Teste',
    organization_id: 'a7c49619-53f0-4401-9b17-2a830dd4da40', // from contact
    environment_id: 'b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1'
  };

  const { data, error } = await supabase
    .from('interaction_logs')
    .insert([logData])
    .select()
    .single();

  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Inserted Successfully:', data);
  }
}
test();
