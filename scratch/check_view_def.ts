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
    
    console.log("Checking definition of 'ctes_complete'...");
    const res = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_name = 'ctes_complete'
    `);
    console.log("Type:", res.rows[0]?.table_type);

    if (res.rows[0]?.table_type === 'VIEW') {
      const resView = await client.query(`
        SELECT view_definition 
        FROM information_schema.views 
        WHERE table_name = 'ctes_complete'
      `);
      console.log("View Definition:", resView.rows[0]?.view_definition);
    }
    
  } catch(e) {
    console.error("Error", e);
  } finally {
    await client.end();
  }
}

run();
