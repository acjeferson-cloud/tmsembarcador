const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://wthpdsbvfrnrzupvhquo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aHBkc2J2ZnJucnp1cHZocXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTU5MTE5NCwiZXhwIjoyMDg3MTY3MTk0fQ.9bRSJlqrNQ_jWa9Xt6wB0Pi4YZHbj270vL8671CY0c8');

async function checkPolicies() {
  const { data, error } = await supabase.rpc('query_sql', { sql: `
    SELECT pol.polname, pol.polqual, pol.polwithcheck 
    FROM pg_policy pol
    JOIN pg_class tbl ON pol.polrelid = tbl.oid
    WHERE tbl.relname IN ('carriers', 'carrier_contacts');
  ` });
  
  if (error) {
    // If query_sql doesn't exist, let's try reading from information_schema
    // Actually we can't read pg_policy without superuser or direct SQL.
    console.log("RPC failed", error);
  } else {
    console.log("Policies:", data);
  }
}

checkPolicies();
