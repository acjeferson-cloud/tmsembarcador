import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.rpc('get_dashboard_executivo_kpis', {
    p_start_date: '2026-03-01',
    p_end_date: '2026-03-31',
    p_organization_id: 'a7c49619-53f0-4401-9b17-2a830dd4da40',
    p_environment_id: 'b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1',
    p_establishment_id: null
  });
  console.log('Dashboard with NULL estabId:', data, error);
}
test();
