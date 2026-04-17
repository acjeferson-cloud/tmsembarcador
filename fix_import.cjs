const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/ReportDivergenceModal.tsx', 'utf8');

content = content.replace(
  "import { useInnovations } from '../../hooks/useInnovations';",
  "import { useInnovations } from '../../contexts/InnovationsContext';"
);

fs.writeFileSync('src/components/CTes/ReportDivergenceModal.tsx', content, 'utf8');
