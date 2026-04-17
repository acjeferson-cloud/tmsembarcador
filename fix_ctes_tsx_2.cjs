const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/CTes.tsx', 'utf8');

// 1. signature
content = content.replace(
    'const handleGenerateDivergenceReport = async (cteId: string | number) => {',
    'const handleGenerateDivergenceReport = async (cteId: string | number, passedRejectionReason?: string) => {'
); 

// 2. object payload. Ensure we only replace in the reportData object
content = content.replace(
    'status: fullCTe.status,        comparisonData      };      setDivergenceReportData(reportData);',
    'status: fullCTe.status,        comparisonData, rejectionReason: passedRejectionReason      };      setDivergenceReportData(reportData);'
);

// 3. Prompt callback
const promptRegex = /if \(promptReport\) \{[\s\S]*?handleGenerateDivergenceReport\(rejectedId\);[\s\S]*?\}, 500\);\s*\}/;
const promptReplacement = `if (promptReport) {
        setTimeout(() => {
          setConfirmDialog({
             isOpen: true,
             cteId: rejectedId,
             cteNumber: rejectedNumber,
             action: 'report_divergence_prompt',
             title: 'CT-e Reprovado',
             message: \`O CT-e \${rejectedNumber} foi reprovado. Deseja gerar o relatório de divergência agora?\`,
             onConfirm: () => {
                handleGenerateDivergenceReport(rejectedId, reasonDescription);
                setConfirmDialog({...confirmDialog, isOpen: false});
             },
             onCancel: () => setConfirmDialog({...confirmDialog, isOpen: false})
          });
        }, 500);
      }`;

content = content.replace(promptRegex, promptReplacement);

fs.writeFileSync('src/components/CTes/CTes.tsx', content, 'utf8');
