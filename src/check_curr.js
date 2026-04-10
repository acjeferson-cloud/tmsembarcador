import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: pickups } = await supabase.from('pickups').select('*').eq('numero_coleta', 'COL-0011');
  console.log('Pickups:', pickups);
  
  if (pickups && pickups.length > 0) {
    const p = pickups[0];
    const { data: links } = await supabase.from('pickup_invoices').select('*').eq('pickup_id', p.id);
    console.log('Links:', links);
  }
}

test();
