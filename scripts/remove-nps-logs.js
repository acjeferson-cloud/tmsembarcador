import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'src/components/NPS/NPSConfig.tsx',
  'src/components/Auth/EstablishmentSelectionModal.tsx',
  'src/lib/supabase.ts'
];

const patternsToRemove = [
  '[NPSConfig]',
  'Establishments received:',
  'Establishments length:',
  'Contexto de sessão configurado'
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const newLines = lines.filter(line => {
        if (!line.includes('console.')) return true;
        
        const hasPattern = patternsToRemove.some(p => line.includes(p));
        return !hasPattern; 
      });
      fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
      console.log(`Updated ${file}`);
    } else {
      console.log(`File not found: ${file}`);
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  }
});
