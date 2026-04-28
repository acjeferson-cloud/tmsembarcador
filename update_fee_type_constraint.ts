import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connectionString = process.env.VITE_SUPABASE_URL 
    ? process.env.VITE_SUPABASE_URL.replace('https://', 'postgres://postgres:').replace('.supabase.co', '.supabase.co:5432/postgres')
    : '';
  const dbUrl = process.env.DATABASE_URL || connectionString;
  if (!dbUrl) {
     console.error("No DB URL");
     return;
  }
  
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    
    console.log("Connected. Executing ALTER TABLE commands...");
    await client.query(`
      ALTER TABLE public.freight_rate_additional_fees DROP CONSTRAINT IF EXISTS freight_rate_additional_fees_fee_type_check;
      ALTER TABLE public.freight_rate_additional_fees ADD CONSTRAINT freight_rate_additional_fees_fee_type_check CHECK (fee_type IN ('TDA', 'TDE', 'TRT', 'TEC', 'ADICIONAL_QUIMICO'));
      NOTIFY pgrst, 'reload schema';
    `);
    
    console.log("Success! fee_type constraint updated.");
  } catch(e) {
    console.error("Error", e);
  } finally {
    await client.end();
  }
}

run();
