const fs = require('fs');

let c = fs.readFileSync('tms-erp-proxy/services/auto-import/index.js', 'utf8');

// Remove Deno imports
c = c.replace(/import \{ serve \} from ".*?";\n/, '');
c = c.replace(/import \{ createClient \} from ".*?";/, 'import { createClient } from "@supabase/supabase-js";');

// Transform serve function into a Node export
c = c.replace(/serve\(async \(req\) => \{/, 'export async function executeAutoImport(reqBody) {');

// Remove OPTIONS block
c = c.replace(/if \(req\.method === 'OPTIONS'\) \{[\s\S]*?\}/, '');

// Replace req payload parsing
c = c.replace(/const payload = req\.method === 'POST' \? await req\.json\(\)\.catch\(\(\) => \(\{\}\)\) : \{\};/, 'const payload = reqBody || {};');

// Replace Response returns
c = c.replace(/return new Response\(JSON\.stringify\((.*?)\), \{ headers: corsHeaders \}\);/g, 'return $1;');
c = c.replace(/return new Response\(JSON\.stringify\((.*?)\), \{ status: (\d+), headers: corsHeaders \}\);/g, 'return $1;');
c = c.replace(/return new Response\((.*?), \{ status: (\d+), headers: corsHeaders \}\);/g, 'return $1;');
c = c.replace(/return new Response\((.*?)\);/g, 'return $1;');

// Ensure crypto is imported (since Deno has it natively, Node needs it for crypto.randomUUID())
c = `import crypto from 'crypto';\n` + c;

fs.writeFileSync('tms-erp-proxy/services/auto-import/index.js', c);
