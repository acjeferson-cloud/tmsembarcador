import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wthpdsbvfrnrzupvhquo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aHBkc2J2ZnJucnp1cHZocXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTExOTQsImV4cCI6MjA4NzE2NzE5NH0.RQUTEmVwDPG-tooKDhFk_D6chG4AYq7OgKCB7_iu820'
);

async function checkRpc() {
  const { data, error } = await supabase.from('api_keys_usage_logs').select('*').limit(1);
  console.log('usage_logs cols:', data && data[0] ? Object.keys(data[0]) : error);
  
  const { data: d2, error: e2 } = await supabase.from('api_keys_rotation_history').select('*').limit(1);
  console.log('rotation cols:', d2 && d2[0] ? Object.keys(d2[0]) : e2);
}
checkRpc();
