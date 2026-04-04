const fs = require('fs');
let content = fs.readFileSync('src/components/ImplementationCenter/ImplementationCenter.tsx', 'utf8');

// 1. Initial State
content = content.replace(
  "nfeXmlNetworkAddress: '',\n    fiscalModule: 'skill'",
  "nfeXmlNetworkAddress: '',\n    cteXmlNetworkAddress: '',\n    fiscalModule: 'skill'"
);

// 2. loadERPConfig
content = content.replace(
  "nfeXmlNetworkAddress: config.nfe_xml_network_address || '',\n        fiscalModule: config.fiscal_module || 'skill'",
  "nfeXmlNetworkAddress: config.nfe_xml_network_address || '',\n        cteXmlNetworkAddress: config.cte_xml_network_address || '',\n        fiscalModule: config.fiscal_module || 'skill'"
);

// 3. handleTestConnection
content = content.replace(
  "nfe_xml_network_address: erpConfig.nfeXmlNetworkAddress,\n        fiscal_module: erpConfig.fiscalModule,",
  "nfe_xml_network_address: erpConfig.nfeXmlNetworkAddress,\n        cte_xml_network_address: erpConfig.cteXmlNetworkAddress,\n        fiscal_module: erpConfig.fiscalModule,"
);

// 4. handleSaveErpConfig
content = content.replace(
  "nfe_xml_network_address: erpConfig.nfeXmlNetworkAddress,\n        fiscal_module: erpConfig.fiscalModule,",
  "nfe_xml_network_address: erpConfig.nfeXmlNetworkAddress,\n        cte_xml_network_address: erpConfig.cteXmlNetworkAddress,\n        fiscal_module: erpConfig.fiscalModule,"
);

// 5. handleERPFileUpload
content = content.replace(
  "nfeXmlNetworkAddress: firstRecord.fiscal_module || '',\n          fiscalModule: firstRecord.fiscal_module || ''",
  "nfeXmlNetworkAddress: firstRecord.fiscal_module || '',\n          cteXmlNetworkAddress: '',\n          fiscalModule: firstRecord.fiscal_module || ''"
);

// 6. UI block
const oldUIBlock = `{/* Additional Configuration */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      {t('implementationCenter.erpIntegration.additional.title')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.additional.nfeXmlAddress')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.nfeXmlNetworkAddress}
                          onChange={(e) => handleErpConfigChange('nfeXmlNetworkAddress', e.target.value)}
                          placeholder="\\\\servidor\\xmls\\nfe"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Módulo Fiscal
                        </label>
                        <select
                          value={erpConfig.fiscalModule}
                          onChange={(e) => handleErpConfigChange('fiscalModule', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="skill">SKILL - Triple One</option>
                          <option value="invent">INVENT - TaxPlus</option>
                        </select>
                      </div>
                    </div>
                  </div>`;

const newUIBlock = `{/* Additional Configuration */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      {t('implementationCenter.erpIntegration.additional.title')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Módulo Fiscal
                        </label>
                        <select
                          value={erpConfig.fiscalModule}
                          onChange={(e) => handleErpConfigChange('fiscalModule', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="skill">SKILL - Triple One</option>
                          <option value="invent">INVENT - TaxPlus</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.additional.nfeXmlAddress')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.nfeXmlNetworkAddress}
                          onChange={(e) => handleErpConfigChange('nfeXmlNetworkAddress', e.target.value)}
                          placeholder="\\\\servidor\\\\xmls\\\\nfe"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.additional.cteXmlAddress')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.cteXmlNetworkAddress}
                          onChange={(e) => handleErpConfigChange('cteXmlNetworkAddress', e.target.value)}
                          placeholder="\\\\servidor\\\\xmls\\\\cte"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>`;

// Use regex matching for the UI block to ignore minor spacing differences
const startText = "{/* Additional Configuration */}";
const endText = "                  {/* Save and Test Buttons */}";
const startIndex = content.indexOf(startText);
const endIndex = content.indexOf(endText);
if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newUIBlock + '\\n\\n' + content.substring(endIndex);
} else {
  console.log("Could not find UI block limits");
}

fs.writeFileSync('src/components/ImplementationCenter/ImplementationCenter.tsx', content);
console.log("Done");
