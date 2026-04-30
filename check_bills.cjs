require('dotenv').config(); 
const { createClient } = require('@supabase/supabase-js'); 
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY); 

async function run() { 
  const { data } = await supabase.from('bills').select('bill_number, total_value, bill_ctes(ctes_complete(number, total_value))').in('bill_number', ['6394100', '6394098']); 
  console.log(JSON.stringify(data, null, 2)); 
} 
run();
