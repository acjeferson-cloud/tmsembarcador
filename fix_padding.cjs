const fs = require('fs');

// 1. Fix freightCostCalculator.ts
let calc = fs.readFileSync('src/services/freightCostCalculator.ts', 'utf8');
const calcOld = `          // Limpa o documento para comparação (remove pontuação)
          const cleanDoc = recipientDocument.replace(/[^\\d]/g, '');`;

const calcNew = `          // Limpa o documento para comparação (remove pontuação)
          let cleanDoc = recipientDocument.replace(/[^\\d]/g, '');
          
          // Aplica o mesmo padding da importação do Excel para encontrar códigos incorretos
          if (cleanDoc.length > 11 && cleanDoc.length < 14) {
            cleanDoc = cleanDoc.padStart(14, '0');
          } else if (cleanDoc.length > 0 && cleanDoc.length < 11) {
            cleanDoc = cleanDoc.padStart(11, '0');
          }`;
          
calc = calc.replace(calcOld, calcNew);
fs.writeFileSync('src/services/freightCostCalculator.ts', calc);

// 2. Fix FreightQuote.tsx
let quote = fs.readFileSync('src/components/FreightQuote/FreightQuote.tsx', 'utf8');
quote = quote.replace(`{t('freightQuote.form.partner')} / CNPJ`, `{t('freightQuote.form.partner')} / CNPJ/CPF`);
fs.writeFileSync('src/components/FreightQuote/FreightQuote.tsx', quote);

console.log('Fixed padding and label');
