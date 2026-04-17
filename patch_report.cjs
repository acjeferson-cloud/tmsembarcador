const fs = require('fs');
let content = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

// 1. Fix Typo
content = content.replace("doc.text('TRAN?LISE DE DIVERGSNCIAS DETALHADA', margin + 2, yPos + 5.5);", "doc.text('ANÁLISE DE DIVERGÊNCIAS DETALHADA', margin + 2, yPos + 5.5);");
content = content.replace("doc.text('TRANÁLISE DE DIVERGÊNCIAS DETALHADA', margin + 2, yPos + 5.5);", "doc.text('ANÁLISE DE DIVERGÊNCIAS DETALHADA', margin + 2, yPos + 5.5);");

// 2. Interface
content = content.replace(
  "status: 'correct' | 'divergent';\n      calculation?: {",
  "status: 'correct' | 'divergent';\n      calculation?: {\n        formula: string;\n        baseValue: number;\n    }[];\n  }\n\nexport interface DivergenceReportData"
); // oops, regex is better

fs.writeFileSync('src/services/cteDivergenceReportService.ts', content, 'utf8');
