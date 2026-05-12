require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
supabase.from('establishments').select('codigo, cnpj, metadata').then(r => {
  console.log(JSON.stringify(r.data, null, 2));
});
