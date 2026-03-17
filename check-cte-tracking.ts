import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const { data: d1 } = await supabase.from('ctes').select('*').limit(3);
  const { data: d2 } = await supabase.from('ctes_complete').select('*').limit(3);
  
  const { data: match1 } = await supabase.from('ctes').select('id, cte_number, access_key').eq('cte_number', '7101267');
  const { data: match2 } = await supabase.from('ctes_complete').select('id, number, access_key').eq('number', '7101267');
  
  console.log('CTEs table sample:', d1?.length ? d1[0] : 'empty');
  console.log('CTEs complete sample:', d2?.length ? d2[0] : 'empty');
  console.log('Matches in ctes:', match1);
  console.log('Matches in ctes_complete:', match2);
}

check();
