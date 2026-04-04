require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

// Em vez de usar supabase JS que não roda DDL, podemos usar supabase-cli
const { execSync } = require('child_process');

try {
  // Verificamos se o CLI do supabase está disponível
  execSync('npx supabase db push');
  console.log("Migration executed successfully via supabase db push");
} catch (e) {
  console.error("Failed to execute migration. Please run 'supabase db push' manually.", e.message);
}
