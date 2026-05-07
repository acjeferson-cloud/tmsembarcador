const fs = require('fs');

let quote = fs.readFileSync('src/components/FreightQuote/FreightQuote.tsx', 'utf8');

quote = quote.replace(`{t('freightQuote.form.partner')} / CNPJ/CPF`, `{t('freightQuote.form.partner')} / CNPJ/CPF / Cód.`);
quote = quote.replace(`placeholder="Selecione ou digite CNPJ..."`, `placeholder="Selecione ou digite..."`);

fs.writeFileSync('src/components/FreightQuote/FreightQuote.tsx', quote);

console.log('Fixed label and placeholder');
