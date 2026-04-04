import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.VITE_SUPABASE_URL ? process.env.VITE_SUPABASE_URL.replace('http://127.0.0.1:54321', 'postgresql://postgres:postgres@127.0.0.1:54322/postgres') : 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' });

async function run() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'erp_configurations';
    `);
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
