const fs = require('fs');
let content = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

if (!content.includes('tmsTotalValue?: number;')) {
    content = content.replace("totalValue: number;", "totalValue: number;\n  tmsTotalValue?: number;");
}

let patch1Done = false;
const search1 = "totalTMS += tax.tmsValue;\n           totalCTE += tax.cteValue;";
if (content.includes(search1)) {
    content = content.replace(search1, "");
    patch1Done = true;
}

let patch2Done = false;
const search2 = "const formatTotal = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;";
const replacement2 = `const formatTotal = (v: number) => \`R$ \${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\`;
        
        let finalTMS = data.tmsTotalValue !== undefined ? data.tmsTotalValue : totalTMS;
        let finalCTE = data.totalValue !== undefined ? data.totalValue : totalCTE;
        let finalDiff = finalCTE - finalTMS;`;

if (content.includes(search2)) {
    content = content.replace(search2, replacement2);
    patch2Done = true;
}

const search3 = "doc.text(formatTotal(totalTMS), colXs[1] + 2, yPos + 5.5);\n        doc.text(formatTotal(totalCTE), colXs[2] + 2, yPos + 5.5);";
const replacement3 = "doc.text(formatTotal(finalTMS), colXs[1] + 2, yPos + 5.5);\n        doc.text(formatTotal(finalCTE), colXs[2] + 2, yPos + 5.5);";

let patch3Done = false;
if (content.includes(search3)) {
    content = content.replace(search3, replacement3);
    content = content.replace("if (Math.abs(totalDiff) > 0.01) {", "if (Math.abs(finalDiff) > 0.01) {");
    content = content.replace("doc.text(`${totalDiff > 0 ? '+' : ''}${formatTotal(totalDiff)}`,", "doc.text(`${finalDiff > 0 ? '+' : ''}${formatTotal(finalDiff)}`,");
    patch3Done = true;
}

fs.writeFileSync('src/services/cteDivergenceReportService.ts', content, 'utf8');
console.log(`Patches: ${patch1Done}, ${patch2Done}, ${patch3Done}`);
