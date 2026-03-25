import fs from 'fs';
const file = 'c:\\desenvolvimento\\tmsembarcador\\src\\services\\pickupsService.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/observacoes: \\`Coleta criada automaticamente a partir de \\\${group\.invoices\.length} NFe\(s\)\\`/g, 'observacoes: `Coleta criada automaticamente a partir de ${group.invoices.length} NFe(s)`');
code = code.replace(/observacoes: \\`Coleta criada automaticamente a partir de \\\${group\.invoices\.length} nota\(s\) fiscal\(is\)\\`/g, 'observacoes: `Coleta criada automaticamente a partir de ${group.invoices.length} nota(s) fiscal(is)`');

fs.writeFileSync(file, code, 'utf8');
console.log('Fixed pickupsService.ts string interpolation');
