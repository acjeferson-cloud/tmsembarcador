const fs = require('fs');

let content = fs.readFileSync('src/components/ImplementationCenter/ImplementationCenter.tsx', 'utf8');

const newContent = `{/* CT-e Configuration */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                      {t('implementationCenter.erpIntegration.cte.title')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.cte.integrationType')}
                        </label>
                        <select
                          value={erpConfig.cteIntegrationType}
                          onChange={(e) => handleErpConfigChange('cteIntegrationType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="manual_draft">Manual - Draft</option>
                          <option value="manual_entry">Manual - Nota Fiscal de entrada</option>
                          <option value="automatic_draft">Automática - Draft</option>
                          <option value="automatic_entry">Automática - Nota Fiscal de entrada</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Billing Configuration */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      {t('implementationCenter.erpIntegration.billing.title')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.cte.cteModel')}
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="99"
                          value={erpConfig.cteModel}
                          onChange={(e) => handleErpConfigChange('cteModel', e.target.value)}
                          placeholder="57"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.billing.nfeItem')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.billingNFeItem}
                          onChange={(e) => handleErpConfigChange('billingNFeItem', e.target.value)}
                          placeholder="FRETE"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.billing.usage')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.billingUsage}
                          onChange={(e) => handleErpConfigChange('billingUsage', e.target.value)}
                          placeholder="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.billing.controlAccount')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.billingControlAccount}
                          onChange={(e) => handleErpConfigChange('billingControlAccount', e.target.value)}
                          placeholder="1.1.01.001"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Invoice Configuration */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                      {t('implementationCenter.erpIntegration.invoice.title')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.cte.invoiceModel')}
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="99"
                          value={erpConfig.invoiceModel}
                          onChange={(e) => handleErpConfigChange('invoiceModel', e.target.value)}
                          placeholder="55"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.invoice.defaultItem')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.invoiceDefaultItem}
                          onChange={(e) => handleErpConfigChange('invoiceDefaultItem', e.target.value)}
                          placeholder="ITEM-PADRAO"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.invoice.transitoryAccount')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.invoiceTransitoryAccount}
                          onChange={(e) => handleErpConfigChange('invoiceTransitoryAccount', e.target.value)}
                          placeholder="1.1.02.001"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.invoice.outboundItem')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.outboundNFItem}
                          onChange={(e) => handleErpConfigChange('outboundNFItem', e.target.value)}
                          placeholder="SERVICO"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.invoice.cteWithoutNfItem')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.cteWithoutNFItem}
                          onChange={(e) => handleErpConfigChange('cteWithoutNFItem', e.target.value)}
                          placeholder="CTE-SEM-NF"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.invoice.cteUsage')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.cteUsage}
                          onChange={(e) => handleErpConfigChange('cteUsage', e.target.value)}
                          placeholder="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.invoice.inboundControlAccount')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.inboundNFControlAccount}
                          onChange={(e) => handleErpConfigChange('inboundNFControlAccount', e.target.value)}
                          placeholder="2.1.01.001"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Configuration */}
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
                          placeholder="\\\\servidor\\xmls\\nfe"
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
                          placeholder="\\\\servidor\\xmls\\cte"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
`;

// Find start and end indices
const startMarker = "{/* CT-e Configuration */}";
let endMarker = "{/* Save and Test Buttons */}";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  // Be careful to slice until endIndex exactly
  content = content.substring(0, startIndex) + newContent + "                  " + content.substring(endIndex);
  
  // Notice I didn't include \\n\\n at the end of newContent or the replacement
} else {
  console.log("Could not find blocks");
}

fs.writeFileSync('src/components/ImplementationCenter/ImplementationCenter.tsx', content);
console.log("Done");
