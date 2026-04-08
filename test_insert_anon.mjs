import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAnon = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Testing insert with Anon Key to freight_quotes_history...");
  const { data, error } = await supabaseAnon
    .from('freight_quotes_history')
    .insert({
      weight: 1,
      volume_qty: 1,
      cargo_value: 100,
      selected_modals: ['rodoviario']
    });

  if (error) {
    console.error("Anon Error:", error);
  } else {
    console.log("Anon Success:", data);
  }
}

run();
