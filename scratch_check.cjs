const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://wthpdsbvfrnrzupvhquo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aHBkc2J2ZnJucnp1cHZocXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTU5MTE5NCwiZXhwIjoyMDg3MTY3MTk0fQ.9bRSJlqrNQ_jWa9Xt6wB0Pi4YZHbj270vL8671CY0c8');

async function checkRLS() {
  // Let's try to fetch a row from carrier_contacts as service role, which ignores RLS.
  // Then we can see what columns exist.
  const { data, error } = await supabase.from('carrier_contacts').select('*').limit(1);
  console.log("Columns existing in carrier_contacts:", data && data.length > 0 ? Object.keys(data[0]) : "No data, but table exists. Error:", error);
  
  // Actually, I can insert a test row to see if it works without RLS, but that won't tell me the RLS policy.
  // Can we query information_schema or pg_policies?
  const { data: policies, error: polErr } = await supabase.from('pg_policies').select('*').eq('tablename', 'carrier_contacts');
  if (polErr) {
    console.log("Cannot query pg_policies via REST. Usually they are not exposed.");
  } else {
    console.log("Policies:", policies);
  }
}

checkRLS();
