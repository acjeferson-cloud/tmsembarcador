const fs = require('fs');
const file = 'c:/desenvolvimento/tmsembarcador/src/components/FreightRates/FreightRateValuesForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add HelpCircle to imports
content = content.replace("import { X, Plus, Trash2 } from 'lucide-react';", "import { X, Plus, Trash2, HelpCircle } from 'lucide-react';");

// Add showHelpModal state
const STATE_INJECTION = `
  const [showHelpModal, setShowHelpModal] = useState(false);
`;
content = content.replace('  const { t } = useTranslation();', '  const { t } = useTranslation();\n' + STATE_INJECTION);

// Extract the 3 div blocks
const block1Regex = /<div className="bg-blue-50 border border-blue-200 rounded p-3">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/;
const match1 = content.match(block1Regex);

const block2Regex = /<div className="bg-amber-50 border border-amber-200 rounded p-3">([\s\S]*?)<\/div>\s*<\/div>/;
const match2 = content.match(block2Regex);

const block3Regex = /<div className="bg-emerald-50 border border-emerald-200 rounded p-3 mt-4 mb-4">([\s\S]*?)<\/div>\s*<\/div>/;
const match3 = content.match(block3Regex);

// Replace the chunks with an empty string + the button
const buttonInjection = `
              <button 
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-white border border-gray-300 px-3 py-1 rounded text-sm shadow-sm hover:bg-gray-50 transition-colors mr-2"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="font-medium">{t('logisticsSimulator.helpButton')}</span>
              </button>
`;

const headerRegex = /(<h3 className="text-lg font-semibold text-gray-900 dark:text-white">\{t\('carriers.freightRates.values.sectionDetails'\)\}<\/h3>)/;
content = content.replace(headerRegex, `$1\n              <div className="flex items-center">` + buttonInjection);

const btnRegex = /(<button\s*type="button"\s*onClick=\{handleAddDetail\}[\s\S]*?<\/button>)/;
content = content.replace(btnRegex, `$1\n              </div>`);

const spaceYDivRegex = /<div className="space-y-3 mb-4">[\s\S]*?{t\('carriers.freightRates.values.infoSemTaxas.desc2'\)}<\/p>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
content = content.replace(spaceYDivRegex, "");

const emeraldDivRegex = /{?\/\* Info Tipo Cálculo: Multiplicador \*\/}?\s*<div className="bg-emerald-50 border border-emerald-200 rounded p-3 mt-4 mb-4">[\s\S]*?<\/ul>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
content = content.replace(emeraldDivRegex, "");

// Append the modal at the end before final export
const MODAL_CODE = `
      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                <HelpCircle className="w-6 h-6 text-blue-600" />
                Como é calculado?
              </h2>
              <button 
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 text-gray-700 dark:text-gray-300">
              ${match1 ? match1[0] : ''}
              ${match2 ? match2[0] : ''}
              ${match3 ? match3[0] : ''}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <button 
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
              >
                {t('logisticsSimulator.helpModal.close', 'Fechar')}
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(/<\/div>\s*<\/div>\s*\);\s*};\s*export/m, `    </div>\n${MODAL_CODE}\n  </div>\n  );\n};\nexport`);

fs.writeFileSync(file, content);
console.log("Successfully patched FreightRateValuesForm!");
