import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data: contacts, error: contactErr } = await supabase.from('business_partner_contacts').select('*').limit(1);
    console.log("Contacts:", contacts, contactErr);
    
    // Also, what is in the UI about emails? The UI screenshot shows "E-mail Principal: jeferson.costa@spsgroup.com.br"
    // which is probably business_partners.email directly!
}
checkSchema();
