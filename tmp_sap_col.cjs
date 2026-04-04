const fs = require('fs');
let content = fs.readFileSync('src/services/sapService.ts', 'utf8');

const search = ".eq('documento', rawCarrierCnpj)";
const replacement = ".eq('cpf_cnpj', rawCarrierCnpj)";

if(content.includes(search)) {
    content = content.replace(search, replacement);
    fs.writeFileSync('src/services/sapService.ts', content);
    console.log("Success replacing documento with cpf_cnpj");
} else {
    console.log("Search string not found in sapService.ts");
}
