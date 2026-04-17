const pg = require('pg');
require('dotenv').config();

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("No DATABASE_URL in .env");
    return;
  }
  
  const client = new pg.Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    
    console.log("Connected. Adding SAP columns to 'ctes' and 'ctes_complete'...");
    
    // We update both ctes and ctes_complete just to be sure
    await client.query(`
      DO $$ 
      BEGIN 
        -- Table: ctes
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ctes') THEN
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ctes' AND column_name = 'sap_doc_entry') THEN
            ALTER TABLE ctes ADD COLUMN sap_doc_entry integer;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ctes' AND column_name = 'sap_doc_num') THEN
            ALTER TABLE ctes ADD COLUMN sap_doc_num text;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ctes' AND column_name = 'sap_integration_type') THEN
            ALTER TABLE ctes ADD COLUMN sap_integration_type text;
          END IF;
        END IF;

        -- Table: ctes_complete
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ctes_complete') THEN
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ctes_complete' AND column_name = 'sap_doc_entry') THEN
            ALTER TABLE ctes_complete ADD COLUMN sap_doc_entry integer;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ctes_complete' AND column_name = 'sap_doc_num') THEN
            ALTER TABLE ctes_complete ADD COLUMN sap_doc_num text;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ctes_complete' AND column_name = 'sap_integration_type') THEN
            ALTER TABLE ctes_complete ADD COLUMN sap_integration_type text;
          END IF;
        END IF;
      END $$;
      
      NOTIFY pgrst, 'reload schema';
    `);
    
    console.log("Success! Columns added and schema reloaded.");
    
  } catch(e) {
    console.error("Error", e);
  } finally {
    await client.end();
  }
}

run();
