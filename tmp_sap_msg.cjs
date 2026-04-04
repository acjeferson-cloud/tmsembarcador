const fs = require('fs');
let content = fs.readFileSync('src/services/sapService.ts', 'utf8');

const search = "console.error('Falha ao buscar Transportadora no TMS:', e);";
const replacement = "console.error('Falha ao buscar Transportadora no TMS:', e);";

const messageSearch = "`Pedido ${sapOrder.order_number} do cliente ${finalBusinessPartnerName} importado e mapeado com sucesso! Peso: ${sapOrder.weight}kg | Vol: ${sapOrder.volume_qty}.`";
const messageReplace = "`Pedido ${sapOrder.order_number} importado! Transportadora: ${finalCarrierId ? 'VINCULADA' : 'NÃO VINCULADA' + (sapOrder.carrier_document ? ' (CNPJ SAP: '+sapOrder.carrier_document+')' : ' (CNPJ Não vindo do SAP)')}. Peso: ${sapOrder.weight}kg.`";

if(content.includes(messageSearch)) {
    content = content.replace(messageSearch, messageReplace);
    fs.writeFileSync('src/services/sapService.ts', content);
    console.log('Success replacing sapService message');
} else {
    console.log('Search string not found in sapService.ts');
}
