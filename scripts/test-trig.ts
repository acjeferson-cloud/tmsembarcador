import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
dotenv.config();

// using psql directly to bypass PostgREST limitations
const dbUrl = process.env.VITE_SUPABASE_URL?.replace('https://', 'postgresql://postgres:' + process.env.DB_PASSWORD + '@') + ':5432/postgres';

function runSql() {
  try {
     const output = execSync(`psql "${dbUrl}" -c "\\d invoices_nfe_carrier_costs"`);
     console.log(output.toString());
  } catch (e) {
     console.log("no psql or wrong url", e);
  }
}
runSql();
