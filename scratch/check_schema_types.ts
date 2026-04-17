import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("No DATABASE_URL");
    return;
  }
  
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    
    console.log("Checking if 'ctes_complete' is a view or table...");
    const res = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_name IN ('ctes', 'ctes_complete')
    `);
    console.log("Results:", res.rows);

    console.log("Checking structure of 'ctes' table...");
    const resCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ctes'
    `);
    console.log("Columns:", resCols.rows.map(r => `${r.column_name} (${r.data_type})`));
    
  } catch(e) {
    console.error("Error", e);
  } finally {
    await client.end();
  }
}

run();
