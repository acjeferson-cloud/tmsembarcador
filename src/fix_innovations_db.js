import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Deleting corrupted user_innovations records with empty organization_id...');
  const { data, error } = await supabase
    .from('user_innovations')
    .delete()
    .eq('organization_id', '');
  
  if (error) {
    console.error('Error deleting records:', error);
  } else {
    console.log('Successfully cleaned up the records.');
  }
}

main();
