const fs = require('fs');
let content = fs.readFileSync('src/components/FreightQuote/FreightQuote.tsx', 'utf8');

const oldStr = `                {/* Valor NF */}
                      setCargoValueFormatted(formatted);`;

const newStr = `                {/* Valor NF */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 whitespace-nowrap">
                    <DollarSign className="w-4 h-4 inline mr-1 text-green-500" />
                    {t('freightQuote.form.cargoValue')}
                  </label>
                  <input
                    type="text"
                    required
                    value={cargoValueFormatted}
                    onChange={(e) => {
                      const formatted = formatNumber(e.target.value, 2);
                      setCargoValueFormatted(formatted);`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('src/components/FreightQuote/FreightQuote.tsx', content);
console.log('Fixed');
