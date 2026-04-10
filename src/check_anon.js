import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testFetch() {
  let query = supabase.from('electronic_documents').select('*').order('import_date', { ascending: false }).limit(5);
  const { data, error } = await query;
  console.log("Anon Query Result:", data?.length, "Error:", error);
}

testFetch();
