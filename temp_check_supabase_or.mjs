import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function run() {
  const orgId = 'invalid-org-id';
  const envId = 'invalid-env-id';
  const ilikeTerm = '%123%';
  
  let ctesQuery = supabase
        .from('ctes_complete')
        .select(`id, number, access_key, status, total_value, sender_name, recipient_name`)
        .eq('organization_id', orgId)
        .eq('environment_id', envId);
      
  ctesQuery = ctesQuery.or(`number.ilike.${ilikeTerm},access_key.ilike.${ilikeTerm},sender_name.ilike.${ilikeTerm},recipient_name.ilike.${ilikeTerm}`).limit(5);

  const {data, error} = await ctesQuery;
  console.log("Returned rows:", data?.length);
  console.log("Error:", error);
}
run();
