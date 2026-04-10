import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('invoices_nfe').select('situacao');
  if (error) {
     console.error(error);
  } else if (data) {
     const counts = {};
     data.forEach(d => {
       counts[d.situacao] = (counts[d.situacao] || 0) + 1;
     });
     console.log('Counts:', counts);
  }
}

test();
