const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/CTes.tsx', 'utf8');

const regex = /const reportData:\s*DivergenceReportData = \{[\s\S]*?comparisonData\s*\};/;
const match = content.match(regex);

if (match) {
    const original = match[0];
    const replacement = original.replace('};', '  rejectionReason };');
    content = content.replace(original, replacement);
    fs.writeFileSync('src/components/CTes/CTes.tsx', content, 'utf8');
    console.log("Success");
} else {
    // If it was already replaced with "rejectionReason"
    if (content.includes("rejectionReason")) {
        console.log("Already has rejectionReason");
    } else {
        console.log("Failed to find reportData");
    }
}
