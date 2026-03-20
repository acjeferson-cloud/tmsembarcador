import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wthpdsbvfrnrzupvhquo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aHBkc2J2ZnJucnp1cHZocXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTExOTQsImV4cCI6MjA4NzE2NzE5NH0.RQUTEmVwDPG-tooKDhFk_D6chG4AYq7OgKCB7_iu820';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const { data, error } = await supabase.from('innovations')
    .select('id, name, innovation_key');
    
  console.log('Current DB state:');
  console.log(data);
}
fix();
