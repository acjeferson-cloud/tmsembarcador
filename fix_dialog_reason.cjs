const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/CTes.tsx', 'utf8');

// 1.
content = content.replace(
    "type?: 'danger' | 'warning' | 'info' | 'error';",
    "type?: 'danger' | 'warning' | 'info' | 'error';\n      rejectionReason?: string;"
);

// 2.
content = content.replace(
    "action: 'report_divergence_prompt',",
    "action: 'report_divergence_prompt',\n             rejectionReason: reasonDescription,"
);

// 3.
content = content.replace(
    "openDivergenceReport(confirmDialog.cteId);",
    "openDivergenceReport(confirmDialog.cteId, confirmDialog.rejectionReason);"
);

// 4. Remember I previously corrupted handleGenerateDivergenceReport into openDivergenceReport? 
// No, I added the param correctly! Let's just make sure.
content = content.replace("rejectionReason: passedRejectionReason ", "rejectionReason: passedRejectionReason");

fs.writeFileSync('src/components/CTes/CTes.tsx', content, 'utf8');
console.log("Replaced");
