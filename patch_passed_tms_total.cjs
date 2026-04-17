const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/CTes.tsx', 'utf8');

const regex = /totalValue: parseFloat\(fullCTe\.total_value\.toString\(\)\),        status: fullCTe\.status,/m;
const replacement = `totalValue: parseFloat(fullCTe.total_value.toString()),
        tmsTotalValue: parseFloat(fullCTe.carrier_costs?.find((c: any) => c.cost_type === 'total_value')?.cost_value?.toString() || '0'),
        status: fullCTe.status,`;

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/components/CTes/CTes.tsx', content, 'utf8');
    console.log("Success");
} else {
    console.log("Failed to insert tmsTotalValue");
}
