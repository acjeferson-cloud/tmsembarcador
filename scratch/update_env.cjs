const fs = require('fs');
const cp = require('child_process');
const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync('.env'));
const cmd = `gcloud run services update tms-erp-proxy --region southamerica-east1 --update-env-vars SUPABASE_URL=${env.VITE_SUPABASE_URL},SUPABASE_SERVICE_ROLE_KEY=${env.SUPABASE_SERVICE_ROLE_KEY},VITE_SUPABASE_ANON_KEY=${env.VITE_SUPABASE_ANON_KEY},VITE_SUPABASE_URL=${env.VITE_SUPABASE_URL}`;

console.log('Executing update...');
cp.execSync(cmd, {stdio: 'inherit'});
console.log('Done');
