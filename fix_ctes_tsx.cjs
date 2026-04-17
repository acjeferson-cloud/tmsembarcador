const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/CTes.tsx', 'utf8');

// 1. handleGenerateDivergenceReport signature
content = content.replace(
    'const handleGenerateDivergenceReport = async (cteId: string | number) => {',
    'const handleGenerateDivergenceReport = async (cteId: string | number, rejectionReason?: string) => {'
);

// 2. Add rejectionReason to reportData object
const targetReportData = `status: fullCTe.status,
        comparisonData
      };`;
const replacementReportData = `status: fullCTe.status,
        comparisonData,
        rejectionReason
      };`;
content = content.replace(targetReportData, replacementReportData);

// 3. handleRejectConfirm
const targetPrompt = `if (promptReport) {
        setTimeout(() => {
          setConfirmDialog({
             isOpen: true,
             cteId: rejectedId,
             cteNumber: rejectedNumber,
             action: 'report_divergence_prompt',
             title: 'CT-e Reprovado',
             message: \`O CT-e \${rejectedNumber} foi reprovado. Deseja gerar o relatrio de divergǦncia agora?\`,
             onConfirm: () => {
                handleGenerateDivergenceReport(rejectedId);
                setConfirmDialog({...confirmDialog, isOpen: false});
             },
             onCancel: () => setConfirmDialog({...confirmDialog, isOpen: false})
          });
        }, 500);
      }`;

const replacementPrompt = `if (promptReport) {
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
      
// Because of TS encoding issues with accents, use regex for safety:
const promptRegex = /if \(promptReport\) {[\s\S]*?handleGenerateDivergenceReport\(rejectedId\);[\s\S]*?}, 500\);\s*}/;
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
