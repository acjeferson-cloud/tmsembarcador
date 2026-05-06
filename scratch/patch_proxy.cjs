const fs = require('fs');
let code = fs.readFileSync('tms-erp-proxy/index.js', 'utf8');

const target = `.eq('cnpj', billData.customer_document || '')
        .not('sap_cardcode', 'is', null)
        .limit(1);`;

const replacement = `.eq('cnpj', billData.customer_document || '')
        .eq('organization_id', billData.organization_id)
        .not('sap_cardcode', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1);`;

code = code.replace(target, replacement);

fs.writeFileSync('tms-erp-proxy/index.js', code);
console.log('Proxy patched successfully!');
