import fs from 'fs';

const path = 'src/components/BusinessPartners/BusinessPartnersMap.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find the nested BusinessPartnersLeafletMap and move it outside
const regex = /\n};\n\nconst BusinessPartnersLeafletMap: React\.FC<\{[\s\S]*?\}\n    \);\n  }\n/m;
const match = content.match(regex);

if (match) {
  content = content.replace(match[0], '\n');
  content = content.replace('export default BusinessPartnersMap;', match[0].replace('\n};\n\n', '\n\n') + '\nexport default BusinessPartnersMap;');
  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed syntax error by moving BusinessPartnersLeafletMap');
} else {
  console.log('Regex did not match');
}
