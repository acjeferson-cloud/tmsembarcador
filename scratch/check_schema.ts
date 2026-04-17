import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("No DATABASE_URL in .env");
    return;
  }
  
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    
    console.log("Checking columns for 'ctes' and 'ctes_complete'...");
    
    const resCtes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ctes'
    `);
    console.log("CTEs Columns:", resCtes.rows.map(r => r.column_name));

    const resCtesComplete = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ctes_complete'
    `);
    console.log("CTEs_Complete Columns:", resCtesComplete.rows.map(r => r.column_name));
    
  } catch(e) {
    console.error("Error", e);
  } finally {
    await client.end();
  }
}

run();
