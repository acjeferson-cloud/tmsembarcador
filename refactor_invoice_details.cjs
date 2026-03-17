const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'usuário', 'Desktop', 'TmsEmbarcador', 'tmsembarcador', 'src', 'components', 'Invoices', 'InvoiceDetailsModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
content = content.replace(
  "import { invoicesCostService, InvoiceCarrierCost } from '../../services/invoicesCostService';\nimport { carriersService } from '../../services/carriersService';\nimport { supabase } from '../../lib/supabase';",
  "import { QuoteResultsTable } from '../FreightQuote/QuoteResultsTable';\nimport { supabase } from '../../lib/supabase';"
);

// 2. Interfaces
content = content.replace(
  "  previsaoEntrega?: string;\n}",
  "  previsaoEntrega?: string;\n  freight_results?: any[];\n}"
);

// 3. States and useEffect
content = content.replace(
  `  const [activeTab, setActiveTab] = useState<'details' | 'costs' | 'ctes'>('details');
  const [carrierCosts, setCarrierCosts] = useState<InvoiceCarrierCost[]>([]);
  const [isLoadingCosts, setIsLoadingCosts] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'details') {
        loadInvoiceDetails();
      } else if (activeTab === 'costs') {
        loadCosts();
      }
    }
  }, [isOpen, activeTab, invoice.id]);`,
  `  const [activeTab, setActiveTab] = useState<'details' | 'costs' | 'ctes'>('details');
  const [customer, setCustomer] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'details') {
      loadInvoiceDetails();
    }
  }, [isOpen, activeTab, invoice.id]);`
);

// 4. Remove loadCosts and calculateCostsForAllCarriers
const startToken = '  const loadCosts = async () => {';
const endToken = '  if (!isOpen) return null;';
const startIndex = content.indexOf(startToken);
const endIndex = content.indexOf(endToken);
if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
}

// 5. Tabs
content = content.replace(
  "                <Receipt size={16} />\n                <span>Custos</span>",
  "                <Truck size={16} />\n                <span>Custos de Frete</span>"
);

// 6. Remove totalFreightCosts
content = content.replace(
  "  // Calculate total costs\n  const totalFreightCosts = carrierCosts.reduce((sum, cost) => sum + cost.total_value, 0);\n  \n  return (",
  "  return ("
);

// 7. Replace Freight Tab content
const tabStartStr = "          ) : activeTab === 'costs' ? (";
const tabEndStr = "          ) : activeTab === 'ctes' ? (";
const tabStartIndex = content.indexOf(tabStartStr);
const tabEndIndex = content.indexOf(tabEndStr);

if (tabStartIndex !== -1 && tabEndIndex !== -1) {
  const replacement = 
"          ) : activeTab === 'costs' ? (\n" +
"            <div className=\"space-y-6\">\n" +
"              {invoice.freight_results && invoice.freight_results.length > 0 ? (\n" +
"                <QuoteResultsTable results={invoice.freight_results} cargoValue={invoice.valorNFe} />\n" +
"              ) : (\n" +
"                <div className=\"bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center\">\n" +
"                  <Truck className=\"w-16 h-16 text-gray-300 mx-auto mb-4\" />\n" +
"                  <h3 className=\"text-xl font-medium text-gray-900 dark:text-white mb-2\">Sem custo de frete</h3>\n" +
"                  <p className=\"text-gray-500 dark:text-gray-400 max-w-md mx-auto\">\n" +
"                    Nenhum custo de frete calculado ou salvo para esta nota fiscal. Selecione as notas fiscais na listagem e escolha a opção recalcular custos de frete.\n" +
"                  </p>\n" +
"                </div>\n" +
"              )}\n" +
"            </div>\n";
  
  content = content.substring(0, tabStartIndex) + replacement + content.substring(tabEndIndex);
}

fs.writeFileSync(filePath, content);
console.log('Update successful');
