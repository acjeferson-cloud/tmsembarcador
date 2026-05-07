import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkState() {
  const { data, error } = await supabase
    .from('states')
    .select('*')
    .eq('id', 'e7dcdead-40f6-4fe1-bad5-cb3e84565d7e');

  console.log(error ? error : data);
}

checkState();
