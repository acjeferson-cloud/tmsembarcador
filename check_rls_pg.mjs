import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Construct connection string from supabase url and password
// VITE_SUPABASE_URL = https://xxx.supabase.co
const projectId = process.env.VITE_SUPABASE_URL.replace('https://', '').split('.')[0];
const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD; // Assuming they have it, or we can use another method

if (!dbPassword) {
  console.log("No DB Password available. Will try to use REST API via service role if possible, but we need raw SQL.");
}

async function run() {
  const connectionString = `postgres://postgres.${projectId}:${dbPassword}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`;
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    const res = await client.query("SELECT polname, roles, cmd, qual FROM pg_policies WHERE tablename = 'establishments'");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("Connection error", err.stack);
  } finally {
    await client.end();
  }
}

if (dbPassword) run();
