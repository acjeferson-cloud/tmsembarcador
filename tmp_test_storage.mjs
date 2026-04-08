import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndFixPolicies() {
  console.log("Checking storage policies...");
  const queries = [
    // Ensure bucket is public
    `UPDATE storage.buckets SET public = true WHERE id = 'logos';`,
    
    // Create permissive policies for authenticated users
    `CREATE POLICY "Allow public read of logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');`,
    `CREATE POLICY "Allow authenticated uploads to logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos');`,
    `CREATE POLICY "Allow authenticated updates to logos" ON storage.objects FOR UPDATE USING (bucket_id = 'logos');`,
    `CREATE POLICY "Allow authenticated deletes of logos" ON storage.objects FOR DELETE USING (bucket_id = 'logos');`
  ];

  for (const query of queries) {
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { query_text: query });
      if (error) {
         if (!error.message.includes("already exists")) {
            console.error("Error executing:", query, "\n", error.message);
         }
      } else {
         console.log("Success:", query);
      }
    } catch (e) {
      console.log("RPC exec_sql might not exist", e.message);
      break;
    }
  }

  // Check if we can upload via anon or service
  console.log("Done checking policies.");
}

checkAndFixPolicies();
