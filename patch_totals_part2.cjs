const fs = require('fs');
let content = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

const regex3 = /let finalDiff = finalCTE - finalTMS;[\s\S]*?doc\.text\(formatTotal\(totalTMS\), colXs\[1\] \+ 2, yPos \+ 5\.5\);\s*doc\.text\(formatTotal\(totalCTE\), colXs\[2\] \+ 2, yPos \+ 5\.5\);\s*if \(Math\.abs\(totalDiff\) > 0\.01\) {\s*doc\.setTextColor\(220, 53, 69\);\s*doc\.text\(`\$\{totalDiff > 0 \? '\+' : ''\}\$\{formatTotal\(totalDiff\)\}`, colXs\[3\] \+ 2, yPos \+ 5\.5\);/m;

const replacement3 = `let finalDiff = finalCTE - finalTMS;
        
        doc.text(formatTotal(finalTMS), colXs[1] + 2, yPos + 5.5);
        doc.text(formatTotal(finalCTE), colXs[2] + 2, yPos + 5.5);
        
        if (Math.abs(finalDiff) > 0.01) {
            doc.setTextColor(220, 53, 69);
            doc.text(\`\${finalDiff > 0 ? '+' : ''}\${formatTotal(finalDiff)}\`, colXs[3] + 2, yPos + 5.5);`;

if(content.match(regex3)) {
    content = content.replace(regex3, replacement3);
    fs.writeFileSync('src/services/cteDivergenceReportService.ts', content, 'utf8');
    console.log("Success");
} else {
    console.log("Failed to match regex 3");
}

