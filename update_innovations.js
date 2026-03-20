import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wthpdsbvfrnrzupvhquo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aHBkc2J2ZnJucnp1cHZocXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTExOTQsImV4cCI6MjA4NzE2NzE5NH0.RQUTEmVwDPG-tooKDhFk_D6chG4AYq7OgKCB7_iu820';

const supabase = createClient(supabaseUrl, supabaseKey);

const updates = [
  { id: '2b513551-c84c-4fae-9eac-4cd3195d03dd', innovation_key: 'openai' },
  { id: 'dab1390b-1ae6-4916-8576-93a005ef85e0', innovation_key: 'correios' },
  { id: '6281084e-d0e2-4974-a32d-dc928cc17745', innovation_key: 'nps' },
  { id: '694a7f88-a342-4ad4-9711-daf2edf4aba6', innovation_key: 'receita-federal' },
  { id: '0923ddb9-c872-474c-b77b-1ea69322fbd6', innovation_key: 'google-maps' },
  { id: '7808f41c-0a0e-445d-bc21-9ab29de310dc', innovation_key: 'whatsapp' }
];

async function run() {
  for (const item of updates) {
    const { error } = await supabase.from('innovations')
      .update({ innovation_key: item.innovation_key })
      .eq('id', item.id);
    console.log('Update', item.innovation_key, error ? error : 'SUCCESS');
  }
}
run();
