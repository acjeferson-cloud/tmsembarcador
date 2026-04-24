import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function run() {
  const {data, error} = await supabase.from('ctes_complete').select('id, number, establishment_id, environment_id, organization_id').limit(1);
  console.log(data, error);
}
run();
