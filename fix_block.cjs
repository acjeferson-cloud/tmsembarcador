const fs = require('fs');
let c = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

const startIdx = c.indexOf('      doc.line(centerSig2');
const endIdx = c.indexOf('      return doc.output(\'blob\');');

if (startIdx > -1 && endIdx > -1) {
    const newStr = `      doc.line(centerSig2 - (sigWidth / 2), yPos, centerSig2 + (sigWidth / 2), yPos);
      doc.text("Gestor de Logística / Auditoria", centerSig2, yPos + 5, { align: 'center' });
      
      for (let i = 1; i <= doc.getNumberOfPages(); i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setFillColor(255, 255, 255);
          const footerY = pageHeight - 12;
          doc.rect(pageWidth - margin - 30, footerY - 3, 30, 5, 'F');
          doc.text(\`Página \${i} de \${totalPages}\`, pageWidth - margin, footerY, { align: 'right' });
      }

`;
    c = c.substring(0, startIdx) + newStr + c.substring(endIdx);
    fs.writeFileSync('src/services/cteDivergenceReportService.ts', c, 'utf8');
    console.log("Block restored!");
} else {
    console.log("Indexes not found");
}
