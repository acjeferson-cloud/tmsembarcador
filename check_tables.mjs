import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error) {
    if (error.code === '42P01') {
      console.log(`Table ${tableName} does not exist.`);
    } else {
      console.log(`Error checking ${tableName}:`, error.message);
    }
    // We can't see the exact columns if it's empty, but if it returns data we can see keys.
    // If it's empty, we have to query information_schema or just read the tables using a raw REST call
  } else {
    console.log(`Table ${tableName} exists.`);
    if (data.length > 0) {
      console.log(`Example fields: ${Object.keys(data[0]).join(', ')}`);
    } else {
      console.log('No data to inspect columns.');
    }
  }
}

async function run() {
  await checkTable('freight_quotes');
  await checkTable('ctes');
  await checkTable('faturas');
  await checkTable('bills');
}

run();
