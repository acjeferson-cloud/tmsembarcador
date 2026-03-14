require('dotenv').config({path: '.env'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testFlow() {
  const org_id = 'c1fb0c8a-cc4a-4e69-9520-25e24a5be6d1'; // need a real one
  // Let's just create a dummy partner, update it, and fetch it.
  const { data: partners } = await supabase.from('business_partners').select('id, organization_id, environment_id').limit(1);
  if (!partners || partners.length === 0) { console.log('no partners to test on'); return; }
  const partner = partners[0];
  
  console.log('Testing partner update for ID:', partner.id);
  
  // Update
  const partnerDbData = {
    limite_credito: 999.99,
    notas_adicionais: 'Test Notes from script'
  };
  
  const { error: updateErr } = await supabase
    .from('business_partners')
    .update(partnerDbData)
    .eq('id', partner.id);
    
  console.log('Update result:', updateErr ? updateErr : 'Success');
  
  // Fetch single
  const { data: fetched, error: fetchErr } = await supabase
        .from('business_partners')
        .select(`
          *,
          contacts:business_partner_contacts(*),
          addresses:business_partner_addresses(*)
        `)
        .eq('id', partner.id)
        .single();
        
  console.log('Fetch result:', fetched ? { 
    name: fetched.razao_social, 
    creditLimit: fetched.limite_credito, 
    notes: fetched.notas_adicionais 
  } : fetchErr);
}

testFlow();
