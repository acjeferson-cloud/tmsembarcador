import fs from 'fs';

const tsx = fs.readFileSync('src/components/Orders/OrderForm.tsx', 'utf8');
const locales = ['pt', 'en', 'es'];

const matches = tsx.match(/t\(['"]([^'"]+)['"]\)/g) || [];
const keys = new Set(matches.map(m => m.match(/t\(['"]([^'"]+)['"]\)/)[1]));

const getByPath = (obj, path) => path.split('.').reduce((o, k) => (o || {})[k], obj);

for (const lang of locales) {
  const file = `src/locales/${lang}/translation.json`;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const missing = Array.from(keys).filter(k => getByPath(data, k) === undefined);
  console.log(`Missing in ${lang}:`, missing);
}
