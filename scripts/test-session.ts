import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
// Use anon key because the app uses anon key!
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSession() {
  console.log('Setting session...');
  const { data: setRes, error: setErr } = await supabase.rpc('set_session_context', {
    p_organization_id: 'a7c49619-53f0-4401-9b17-2a830dd4da40',
    p_environment_id: 'b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1'
  });
  console.log('Set Result:', setRes, setErr);

  console.log('Verifying session in NEW request...');
  const { data: verRes, error: verErr } = await supabase.rpc('verify_session_context');
  console.log('Verify Result:', verRes, verErr);
}

testSession();
