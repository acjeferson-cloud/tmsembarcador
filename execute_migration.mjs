import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.VITE_SUPABASE_URL 
  ? process.env.VITE_SUPABASE_URL.replace('http://127.0.0.1:54321', 'postgresql://postgres:postgres@127.0.0.1:54322/postgres')
  : 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'; 
const pool = new pg.Pool({ connectionString: dbUrl });

async function run() {
  try {
    const migrationPath = path.resolve('supabase/migrations/20260402152000_create_rpc_get_erp.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('Executando migração RPC GET ERP...');
    await pool.query(sql);
    console.log('Migração aplicada com sucesso!');
  } catch (err) {
    console.error('Erro na migração:', err.message);
  } finally {
    pool.end();
  }
}
run();
