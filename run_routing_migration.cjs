const fs = require('fs');
const path = require('path');
const pg = require('pg');
require('dotenv').config();

const dbUrl = process.env.VITE_SUPABASE_URL 
  ? process.env.VITE_SUPABASE_URL.replace('http://127.0.0.1:54321', 'postgresql://postgres:postgres@127.0.0.1:54322/postgres')
  : 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'; 
const pool = new pg.Pool({ connectionString: dbUrl });

async function run() {
  try {
    const migrationPath = path.resolve('supabase/migrations/20260430173209_create_routing_module_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('Executando migration de roteirização...');
    await pool.query(sql);
    console.log('Migração aplicada com sucesso!');
  } catch (err) {
    console.error('Erro na migração:', err.message);
  } finally {
    pool.end();
  }
}
run();
