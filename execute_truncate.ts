import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connectionString = process.env.VITE_SUPABASE_URL 
    ? process.env.VITE_SUPABASE_URL.replace('https://', 'postgres://postgres:').replace('.supabase.co', '.supabase.co:5432/postgres') 
    : '';

  const dbUrl = process.env.DATABASE_URL || connectionString;
  
  if (!dbUrl) {
     console.error("No DB URL. Please set process.env.DATABASE_URL in .env");
     return;
  }
  
  console.log("Connecting to Database using pg...");
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    
    console.log("Connected. Truncating zip_code_ranges...");
    await client.query(`TRUNCATE TABLE zip_code_ranges RESTART IDENTITY CASCADE;`);
    
    console.log("Success! Table truncated.");
  } catch(e) {
    console.error("Error", e);
  } finally {
    await client.end();
  }
}

run();
