import fs from 'fs';

const filePath = 'supabase/functions/auto-import-xml-scheduler/index.ts';
let content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("const numDoc = String(n.nDoc || (chave ? chave.substring(25, 34) : ''));")) {
     lines[i] = lines[i].replace("const numDoc = String(n.nDoc || (chave ? chave.substring(25, 34) : ''));", 
       "const rawNum = String(n.nDoc || (chave ? chave.substring(25, 34) : ''));\n                                           const numDoc = rawNum.replace(/^0+/, '');");
  }
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log("Replaced successfully!");
