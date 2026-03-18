import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testGhostUpdate() {
  console.log('Testing update on invoices_nfe...');
  const { data, error, count } = await supabase
    .from('invoices_nfe')
    .update({ 
      status: 'GhostUpdateTest'
    })
    .eq('id', 'cc034bf5-4fc4-4c93-b049-a1801c370f68')
    .select(); // Ask for returning data to see if it actually updated anything

  console.log('Update result:', data, error, 'Count:', count);
}
testGhostUpdate();
