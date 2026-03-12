import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { error } = await supabase.rpc('inline_code_block', {
    sql_code: `
      ALTER TABLE invoices_nfe ADD COLUMN IF NOT EXISTS establishment_id uuid REFERENCES establishments(id);
      ALTER TABLE invoices_nfe ADD COLUMN IF NOT EXISTS carrier_id uuid REFERENCES carriers(id);
      CREATE INDEX IF NOT EXISTS idx_invoices_nfe_establishment ON invoices_nfe(establishment_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_nfe_carrier ON invoices_nfe(carrier_id);
    `
  });
  
  if (error) {
    console.error('Error executing SQL:', error);
  } else {
    console.log('Success adding establishment_id and carrier_id!');
  }
}

run();
