import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connectionString = process.env.VITE_SUPABASE_URL 
    ? process.env.VITE_SUPABASE_URL.replace('https://', 'postgres://postgres:').replace('.supabase.co', '.supabase.co:5432/postgres') // This is a fallback but its better to just use DB URL
    : '';

  // Real connection string usually exists in .env if developer deployed it, 
  // or we can read process.env.DATABASE_URL
  const dbUrl = process.env.DATABASE_URL || connectionString;
  
  if (!dbUrl) {
     console.error("No DB URL");
     return;
  }
  
  console.log("Connecting to:", dbUrl.replace(/:[^:@]+@/, ':***@'));
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    
    // Check if inline_code_block function was dropped, fallback to direct alter
    console.log("Connected. Executing ALTER TABLE commands...");
    await client.query(`
      ALTER TABLE invoices_nfe ADD COLUMN IF NOT EXISTS establishment_id uuid REFERENCES establishments(id);
      ALTER TABLE invoices_nfe ADD COLUMN IF NOT EXISTS carrier_id uuid REFERENCES carriers(id);
      CREATE INDEX IF NOT EXISTS idx_invoices_nfe_establishment ON invoices_nfe(establishment_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_nfe_carrier ON invoices_nfe(carrier_id);
      -- Also reload schema cache on PostgREST
      NOTIFY pgrst, 'reload schema';
    `);
    
    console.log("Success!");
  } catch(e) {
    console.error("Error", e);
  } finally {
    await client.end();
  }
}

run();
