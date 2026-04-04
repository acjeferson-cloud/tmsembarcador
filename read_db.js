const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env'});
const sup = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sup.from('erp_sync_logs').select('*').limit(2).then(r => console.log('Data:', r.data));
