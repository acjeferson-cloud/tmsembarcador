import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();

  try {
    const res = await client.query(`
      SELECT count(*) FROM electronic_documents;
    `);
    console.log('Total electronic_documents (bypass RLS):', res.rows[0]);

    const res2 = await client.query(`
      SELECT tablename, policyname, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'electronic_documents';
    `);
    console.log('Policies applied to electronic_documents:', res2.rows);

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
