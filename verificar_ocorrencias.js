
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const supabaseKeyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

if (supabaseUrlMatch && supabaseKeyMatch) {
  const supabaseUrl = supabaseUrlMatch[1].trim();
  const supabaseKey = supabaseKeyMatch[1].trim();
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  supabase.from('occurrences').select('*').limit(5).then(({data, error}) => {
     console.log('Error:', error);
     console.log('Occurrences data:', data);
  });
}

