import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config();
const supa = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY); // Use service role
supa.from('erp_integration_config').select('*').then(r => console.log(JSON.stringify(r.data, null, 2)));
