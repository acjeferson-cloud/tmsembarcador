import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  const { data, error } = await supabase.rpc('get_dashboard_executivo_kpis', {
    p_start_date: '2026-03-01', p_end_date: '2026-03-31'
  }); // Just testing network
  console.log('rpc works:', !!data);
  // Get orders count without any filter
  const { data: oData } = await supabase.from('orders').select('id', { count: 'exact' });
  console.log('Total orders in DB visible to anon:', oData?.length);
}

checkRLS();
