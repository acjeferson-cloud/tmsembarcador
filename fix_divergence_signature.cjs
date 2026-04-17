const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/CTes.tsx', 'utf8');

content = content.replace(
    'const openDivergenceReport = async (cteId: string) => {',
    'const openDivergenceReport = async (cteId: string, passedRejectionReason?: string) => {'
);

fs.writeFileSync('src/components/CTes/CTes.tsx', content, 'utf8');
