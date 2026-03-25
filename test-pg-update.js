import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ 
  connectionString: process.env.VITE_SUPABASE_URL.replace('https://', 'postgres://postgres:' + process.env.SUPABASE_DB_PASSWORD + '@db.') 
});

async function run() {
  try {
    const { rows: nfeRows } = await pool.query("SELECT id FROM public.invoices_nfe WHERE numero = '945679' LIMIT 1");
    if (!nfeRows.length) {
       console.log("NFE not found");
       return;
    }
    const nfe_id = nfeRows[0].id;
    console.log("NFE ID:", nfe_id);

    const query = `
      SELECT 
          bp.id as partner_id,
          nc.email as nfe_email,
          nc.cnpj_cpf as nfe_cnpj,
          bp.cpf_cnpj as bp_cnpj
      FROM public.invoices_nfe_customers nc
      LEFT JOIN public.business_partners bp 
          ON REGEXP_REPLACE(bp.cpf_cnpj, '\\D', '', 'g') = REGEXP_REPLACE(nc.cnpj_cpf, '\\D', '', 'g')
      WHERE nc.invoice_nfe_id = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [nfe_id]);
    console.log("Query Result:", rows);
    
    if (rows.length > 0 && rows[0].partner_id) {
       const { rows: contacts } = await pool.query("SELECT * FROM public.business_partner_contacts WHERE partner_id = $1", [rows[0].partner_id]);
       console.log("Contacts:", contacts.map(c => ({ id: c.id, email: c.email, receive_email: c.receive_email_notifications, notify: c.email_notify_delivered })));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

run();
