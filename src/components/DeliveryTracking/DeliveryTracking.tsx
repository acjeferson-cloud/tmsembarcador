import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Search, Package, FileText, Truck, XCircle } from 'lucide-react';
import { trackingService, OrderTrackingData } from '../../services/trackingService';
import { nfeService } from '../../services/nfeService';
import { ctesCompleteService } from '../../services/ctesCompleteService';
import { supabase } from '../../lib/supabase';
import { useActivityLogger } from '../../hooks/useActivityLogger';
import { UnifiedTrackingTimeline } from '../Shared/UnifiedTrackingTimeline';

type DocumentType = 'order' | 'nfe' | 'cte';
type SearchType = 'number' | 'accessKey';

export const DeliveryTracking: React.FC = () => {
  const { t } = useTranslation();
  useActivityLogger('Rastreamento de entregas', 'Acesso', 'Acessou o Rastreamento de Entregas');

  const breadcrumbItems = [
    { label: 'Área de trabalho' },
    { label: t('deliveryTracking.pageTitle'), current: true }
  ];

  const [documentType, setDocumentType] = useState<DocumentType>('order');
  const [searchType, setSearchType] = useState<SearchType>('number');
  const [searchValue, setSearchValue] = useState('');
  const [trackingData, setTrackingData] = useState<OrderTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDocumentTypeLabel = (type: DocumentType): string => {
    const labels = {
      order: t('deliveryTracking.documentTypes.order'),
      nfe: t('deliveryTracking.documentTypes.nfe'),
      cte: t('deliveryTracking.documentTypes.cte')
    };
    return labels[type];
  };

  const getSearchPlaceholder = (): string => {
    if (searchType === 'number') {
      const placeholders = {
        order: t('deliveryTracking.searchPlaceholders.orderNumber'),
        nfe: t('deliveryTracking.searchPlaceholders.nfeNumber'),
        cte: t('deliveryTracking.searchPlaceholders.cteNumber')
      };
      return placeholders[documentType];
    } else {
      const placeholders = {
        order: t('deliveryTracking.searchPlaceholders.trackingCode'),
        nfe: t('deliveryTracking.searchPlaceholders.accessKey'),
        cte: t('deliveryTracking.searchPlaceholders.accessKey')
      };
      return placeholders[documentType];
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError(t('deliveryTracking.errors.emptyValue'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      if (documentType === 'order') {
        const data = await trackingService.fetchOrderTrackingData(searchValue, searchType === 'accessKey');

        if (data) {
          setTrackingData(data);
        } else {
          setError(t('deliveryTracking.errors.orderNotFound', { value: searchValue }));
        }
      } else if (documentType === 'nfe') {
        // Buscar NF-e e depois o pedido relacionado
        const invoices = await nfeService.getAll();
        let found;
        const cleanSearchValue = searchValue.replace(/\s+/g, '');

        if (searchType === 'number') {
          found = invoices.find((inv: any) => inv.numero === cleanSearchValue || inv.number === cleanSearchValue);
        } else {
          found = invoices.find((inv: any) => inv.chave_acesso === cleanSearchValue || inv.access_key === cleanSearchValue);
        }

        if (found) {
          const orderNum = (found as any).order_number || (found as any).numero_pedido;
          let data = null;
          
          if (orderNum) {
            data = await trackingService.fetchOrderTrackingData(orderNum, false);
          }
          
          if (!data) {
            data = await trackingService.fetchTrackingDataFromDocument('nfe', found);
          }
          
          if (data) {
            setTrackingData(data);
          } else {
            setError(t('deliveryTracking.errors.nfeProcessingError'));
          }
        } else {
          setError(t('deliveryTracking.errors.nfeNotFound'));
        }
      } else if (documentType === 'cte') {
        // Buscar CT-e, depois NF-e e depois pedido
        const ctes = await ctesCompleteService.getAll();
        let found;
        const cleanSearchValue = searchValue.replace(/\s+/g, '');

        if (searchType === 'number') {
          found = ctes.find((cte: any) => cte.cte_number === cleanSearchValue || cte.number === cleanSearchValue || cte.numero === cleanSearchValue);
        } else {
          found = ctes.find((cte: any) => cte.access_key === cleanSearchValue || cte.chave_acesso === cleanSearchValue);
        }

        if (found) {
          // Busca direta de order_number ou invoice_number no CT-e
          let orderNumber = (found as any).order_number || (found as any).numero_pedido;
          
          if (!orderNumber && ((found as any).invoice_number || (found as any).numero_nfe)) {
            // Buscar NF-e
            const invNum = (found as any).invoice_number || (found as any).numero_nfe;
            const { data: invoice } = await (supabase as any)
              .from('invoices_nfe')
              .select('order_number')
              .or(`numero.eq.${invNum},number.eq.${invNum}`)
              .maybeSingle();

            if (invoice && invoice.order_number) {
              orderNumber = invoice.order_number;
            }
          }
          
          if (!orderNumber) {
             const { data: cteInvoices } = await (supabase as any)
                .from('ctes_invoices')
                .select('number, observations')
                .eq('cte_id', found.id);
                
             if (cteInvoices && cteInvoices.length > 0) {
               for (const cteInv of cteInvoices) {
                 const matchKey = cteInv.observations?.match(/Chave:\s*([0-9]{44})/);
                 if (matchKey && matchKey[1]) {
                   const { data: n } = await (supabase as any).from('invoices_nfe').select('order_number').eq('chave_acesso', matchKey[1]).maybeSingle();
                   if (n && n.order_number) { orderNumber = n.order_number; break; }
                 } else if (cteInv.number) {
                   const { data: n } = await (supabase as any)
                      .from('invoices_nfe')
                      .select('order_number')
                      .or(`numero.eq.${cteInv.number},number.eq.${cteInv.number}`)
                      .maybeSingle();
                   if (n && n.order_number) { orderNumber = n.order_number; break; }
                 }
               }
             }
          }

          let data = null;
          if (orderNumber) {
            data = await trackingService.fetchOrderTrackingData(orderNumber, false);
          }
          
          if (!data) {
            data = await trackingService.fetchTrackingDataFromDocument('cte', found);
          }
          
          if (data) {
            setTrackingData(data);
          } else {
            setError(t('deliveryTracking.errors.cteProcessingError'));
          }
        } else {
          setError(t('deliveryTracking.errors.cteNotFound'));
        }
      }
    } catch (err) {

      setError(t('deliveryTracking.errors.genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('deliveryTracking.pageTitle')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('deliveryTracking.pageSubtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('deliveryTracking.labels.selectDocument')}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setDocumentType('order');
                  setSearchType('number');
                  setSearchValue('');
                  setTrackingData(null);
                  setError(null);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  documentType === 'order'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Package className={`w-8 h-8 ${documentType === 'order' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${documentType === 'order' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
                    {t('deliveryTracking.documentTypes.order')}
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  setDocumentType('nfe');
                  setSearchType('number');
                  setSearchValue('');
                  setTrackingData(null);
                  setError(null);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  documentType === 'nfe'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <FileText className={`w-8 h-8 ${documentType === 'nfe' ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${documentType === 'nfe' ? 'text-green-900 dark:text-green-100' : 'text-gray-700 dark:text-gray-300'}`}>
                    {t('deliveryTracking.documentTypes.nfe')}
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  setDocumentType('cte');
                  setSearchType('number');
                  setSearchValue('');
                  setTrackingData(null);
                  setError(null);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  documentType === 'cte'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Truck className={`w-8 h-8 ${documentType === 'cte' ? 'text-amber-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${documentType === 'cte' ? 'text-amber-900 dark:text-amber-100' : 'text-gray-700 dark:text-gray-300'}`}>
                    CT-e
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('deliveryTracking.labels.howToSearch', { documentType: getDocumentTypeLabel(documentType) })}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="searchType"
                  value="number"
                  checked={searchType === 'number'}
                  onChange={(e) => {
                    setSearchType(e.target.value as SearchType);
                    setSearchValue('');
                    setTrackingData(null);
                    setError(null);
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {documentType === 'order' ? t('deliveryTracking.searchBy.orderNumber') : t('deliveryTracking.searchBy.number')}
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="searchType"
                  value="accessKey"
                  checked={searchType === 'accessKey'}
                  onChange={(e) => {
                    setSearchType(e.target.value as SearchType);
                    setSearchValue('');
                    setTrackingData(null);
                    setError(null);
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {documentType === 'order' ? t('deliveryTracking.searchBy.trackingCode') : t('deliveryTracking.searchBy.accessKey')}
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('deliveryTracking.labels.enterValue')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder={getSearchPlaceholder()}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading || !searchValue.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                {isLoading ? t('deliveryTracking.labels.buttonSearching') : t('deliveryTracking.labels.buttonSearch')}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {trackingData && (
            <div className="mt-6">
              <UnifiedTrackingTimeline trackingData={trackingData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
