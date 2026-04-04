const fs = require('fs');

let content = fs.readFileSync('src/components/ImplementationCenter/ImplementationCenter.tsx', 'utf8');

// 1. Remove the fields `outboundNFItem`, `cteWithoutNFItem`, and `cteUsage`.
// Also rename `transitoryAccount` placeholder, and rename `inboundControlAccount` label mapping, wait:
// 
// First, let's just rewrite the entire "Invoice Configuration" block from scratch:
const newInvoiceBlock = `{/* Invoice Configuration */}
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
                          placeholder="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.invoice.inboundControlAccount')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.inboundNFControlAccount}
                          onChange={(e) => handleErpConfigChange('inboundNFControlAccount', e.target.value)}
                          placeholder="1.1.02.001"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>`;

const startIndex = content.indexOf('{/* Invoice Configuration */}');
const endIndex = content.indexOf('{/* Additional Configuration */}');

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + newInvoiceBlock + '\\n\\n                  ' + content.substring(endIndex);
}

fs.writeFileSync('src/components/ImplementationCenter/ImplementationCenter.tsx', content);
console.log('Done rewriting Invoice Block');
