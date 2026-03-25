import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns(tableName) {
  try {
    const { data, error } = await supabase.rpc('query_table_columns_mock', {}); 
    // Wait, the REST API doesn't allow easy information_schema access.
    // Instead, I'll just check if querying the column fails.
    const { error: err } = await supabase.from(tableName).select('organization_id, environment_id, establishment_id').limit(1);
    if (err) {
      console.log(`[${tableName}] MISSING COLUMNS:`, err.message);
    } else {
      console.log(`[${tableName}] HAS COLUMNS.`);
    }
  } catch (e) {
    console.error(e);
  }
}

async function run() {
  await checkColumns('freight_quotes');
  // the table used for history is freight_quotes_history
  await checkColumns('freight_quotes_history');
  await checkColumns('ctes');
  await checkColumns('bills');
}
run();
