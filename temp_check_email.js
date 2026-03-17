import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env', 'utf8');
const lines = envFile.split('\n');
const supabaseUrl = lines.find(l => l.startsWith('VITE_SUPABASE_URL='))?.split('=')[1]?.replace(/['"\r\n]/g, '')?.trim();
const supabaseKey = lines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY='))?.split('=')[1]?.replace(/['"\r\n]/g, '')?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('URL or Key missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('carriers').select('id, codigo, razao_social, email').limit(5);
  console.log('Result:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

main();
