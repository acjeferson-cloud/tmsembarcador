import fs from 'fs';
import path from 'path';

const files = [
  'Orders.tsx',
  'OrdersActions.tsx',
  'OrdersFilters.tsx',
  'OrdersTable.tsx',
  'OrderForm.tsx',
  'OrderDetailsModal.tsx'
];

const locales = ['pt', 'en', 'es'];

for (const f of files) {
  const tsx = fs.readFileSync('src/components/Orders/' + f, 'utf8');
  const matches = tsx.match(/t\(['"]([^'"]+)['"]\)/g) || [];
  const keys = new Set(matches.map(m => m.match(/t\(['"]([^'"]+)['"]\)/)[1]));

  const getByPath = (obj, path) => path.split('.').reduce((o, k) => (o || {})[k], obj);

  console.log('File:', f);
  let hasMissing = false;
  for (const lang of locales) {
    const data = JSON.parse(fs.readFileSync(`src/locales/${lang}/translation.json`, 'utf8'));
    const missing = Array.from(keys).filter(k => getByPath(data, k) === undefined && !['T', '.customer-search-container'].includes(k));
    if (missing.length > 0) {
      console.log(`  Missing in ${lang}:`, missing);
      hasMissing = true;
    }
  }
  if (!hasMissing) console.log('  All keys present!');
}
