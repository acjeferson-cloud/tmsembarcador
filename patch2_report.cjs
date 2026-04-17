const fs = require('fs');
let content = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

// Fix interface to add rejectionReason
if (!content.includes('rejectionReason?: string;')) {
    content = content.replace("export interface DivergenceReportData {", "export interface DivergenceReportData {\n  rejectionReason?: string;");
}

// Fix typo TRANÁLISE using regex to hit any corrupted accent strings too
content = content.replace(/TRAN[A-Za-z??]+LISE DE DIVERG[A-Za-z??]NCIAS DETALHADA/g, "ANÁLISE DE DIVERGÊNCIAS DETALHADA");
content = content.replace(/TRANÁLISE DE DIVERGÊNCIAS DETALHADA/g, "ANÁLISE DE DIVERGÊNCIAS DETALHADA");

// Render the rejection reason if available in generatePDF
const injectionTarget = `doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text("INFORMAÇÕES INICIAIS", margin + 2, yPos + 5.5);`;

if (content.includes("INFORMAÇÕES INICIAIS") && !content.includes("data.rejectionReason")) {
    const replacement = `doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text("INFORMAÇÕES INICIAIS", margin + 2, yPos + 5.5);
          
          if (data.rejectionReason) {
              const prevY = yPos;
              doc.setTextColor(220, 53, 69); // Red color for reason
              doc.setFont('helvetica', 'bold');
              doc.text(\`Motivo da Reprovação: \${data.rejectionReason}\`, margin + 2, yPos + 22);
              doc.setTextColor(51, 51, 51); // Restore color
              doc.setFont('helvetica', 'normal');
          }`;
    content = content.replace(injectionTarget, replacement);
}

fs.writeFileSync('src/services/cteDivergenceReportService.ts', content, 'utf8');
