import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    let res = await client.query("SELECT prosrc FROM pg_proc WHERE proname = 'calculate_freight_quotes';");
    if(res.rows.length > 0) console.log("calculate_freight_quotes:", res.rows[0].prosrc);

    res = await client.query("SELECT prosrc FROM pg_proc WHERE proname = 'calculate_freight_b2b';");
    if(res.rows.length > 0) console.log("calculate_freight_b2b:", res.rows[0].prosrc);
  } catch(e) {
    console.error("Error", e);
  } finally {
    await client.end();
  }
}

run();
