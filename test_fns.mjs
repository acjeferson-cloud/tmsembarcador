import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.VITE_SUPABASE_URL 
  ? process.env.VITE_SUPABASE_URL.replace('http://127.0.0.1:54321', 'postgresql://postgres:postgres@127.0.0.1:54322/postgres')
  : 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'; 

const pool = new pg.Pool({ connectionString: dbUrl });

async function checkFn() {
  try {
    const res = await pool.query(`
      SELECT pg_get_functiondef(p.oid)
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = 'get_session_organization_id';
    `);
    console.log(res.rows[0].pg_get_functiondef);

    const res2 = await pool.query(`
      SELECT pg_get_functiondef(p.oid)
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = 'get_session_establishment_id';
    `);
    if(res2.rows.length) {
        console.log(res2.rows[0].pg_get_functiondef);
    } else {
        console.log("get_session_establishment_id NOT FOUND");
    }

  } finally {
    pool.end();
  }
}

checkFn();
