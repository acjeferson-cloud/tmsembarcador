import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function dumpRPCs() {
  const client = new Client({ connectionString: process.env.VITE_SUPABASE_POSTGRES_URL || process.env.SUPABASE_DB_URL });
  await client.connect();
  const res = await client.query(`SELECT proname, prosrc FROM pg_proc WHERE proname IN ('tms_login', 'validate_user_credentials', 'validate_credentials');`);
  console.log('Result:', res.rows);
  await client.end();
}
dumpRPCs();
