const fs = require('fs');
let content = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

const target1 = `        doc.text(\`Emissǜo CT-e: \${new Date(data.emissionDate).toLocaleDateString('pt-BR')}\`, margin + 2, yPos + 5);
        doc.text(\`Status TMS: \${data.status}\`, margin + 60, yPos + 5);
        doc.text(\`Valor Original CT-e: R$ \${data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\`, margin + 140, yPos + 5);
        yPos += 12;`;

const replacement1 = `        doc.text(\`Emissǜo CT-e: \${new Date(data.emissionDate).toLocaleDateString('pt-BR')}\`, margin + 2, yPos + 5);
        doc.text(\`Status TMS: \${data.status}\`, margin + 60, yPos + 5);
        doc.text(\`Valor Original CT-e: R$ \${data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\`, margin + 140, yPos + 5);
        
        if (data.rejectionReason) {
            yPos += 7;
            doc.setTextColor(220, 53, 69);
            doc.setFont('helvetica', 'bold');
            doc.text(\`Motivo da Reprovação: \${data.rejectionReason}\`, margin + 2, yPos + 3);
            doc.setTextColor(51, 51, 51);
            doc.setFont('helvetica', 'normal');
        }
        
        yPos += 12;`;

if (content.includes(target1)) {
    content = content.replace(target1, replacement1);
} else {
    // try generic fallback
    const genericTargetRegex = /doc\.text\(`Valor Original CT-e:[\s\S]*?yPos \+= 12;/;
    content = content.replace(genericTargetRegex, replacement1.trim().substring(replacement1.indexOf('doc.text(`Valor Original CT-e:')));
}

fs.writeFileSync('src/services/cteDivergenceReportService.ts', content, 'utf8');
