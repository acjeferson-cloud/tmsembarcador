import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.VITE_SUPABASE_URL 
  ? process.env.VITE_SUPABASE_URL.replace('http://127.0.0.1:54321', 'postgresql://postgres:postgres@127.0.0.1:54322/postgres')
  : 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'; 

const pool = new pg.Pool({ connectionString: dbUrl });

async function checkCols() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'erp_integration_config'
      ORDER BY ordinal_position;
    `);
    console.log(res.rows);
  } finally {
    pool.end();
  }
}

checkCols();
