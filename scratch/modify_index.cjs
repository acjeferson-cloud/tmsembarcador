const fs = require('fs');
let c = fs.readFileSync('tms-erp-proxy/index.js', 'utf8');

if (!c.includes('executeAutoImport')) {
    c = c.replace(/import \{ runCronSync, supabase \} from '\.\/syncWorker\.js';/, "import { runCronSync, supabase } from './syncWorker.js';\nimport { executeAutoImport } from './services/auto-import/index.js';");
    
    c = c.replace(/app\.listen\(PORT, '0\.0\.0\.0', \(\) => \{/, `app.post('/api/auto-import-xml', async (req, res) => {
  try {
    const result = await executeAutoImport(req.body);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {`);
    fs.writeFileSync('tms-erp-proxy/index.js', c);
}
