import React, { useState, useMemo } from 'react';
import { Calendar, MapPin, Package, DollarSign, RefreshCw, Eye, Users, ChevronLeft, ChevronRight, Printer, Download } from 'lucide-react';
import { FreightQuoteHistory, QuoteResult } from '../../services/freightQuoteService';
import { formatCurrency } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { quotePdfService } from '../../services/quotePdfService';

type ExtendedHistory = FreightQuoteHistory & {
  quote_number?: number;
  user_display_name?: string;
  users?: { nome: string };
  business_partners?: { nome_fantasia: string; cpf_cnpj: string };
  origin_city?: { nome: string; states?: { sigla: string } };
  destination_city?: { nome: string; states?: { sigla: string } };
};

interface QuoteHistoryTableProps {
  history: FreightQuoteHistory[];
  onRefresh: () => void;
}

export const QuoteHistoryTable: React.FC<QuoteHistoryTableProps> = ({ history, onRefresh }) => {
  const { t } = useTranslation();
  const { user, currentEstablishment } = useAuth();
  const [selectedQuote, setSelectedQuote] = useState<FreightQuoteHistory | null>(null);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sort history by quote_number descending
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const numA = (a as ExtendedHistory).quote_number || 0;
      const numB = (b as ExtendedHistory).quote_number || 0;
      return numB - numA;
    });
  }, [history]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = sortedHistory.slice(startIndex, endIndex);

  // Reset to page 1 when history changes
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedQuotes([]);
  }, [history]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedQuotes(paginatedHistory.map(q => q.id));
    } else {
      setSelectedQuotes([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedQuotes(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: 'print' | 'download') => {
    if (selectedQuotes.length === 0) return;
    setIsProcessing(true);
    try {
      const selectedData = history.filter(q => selectedQuotes.includes(q.id));
      if (action === 'download') {
        await quotePdfService.generateQuotePDF(selectedData, 'download', { user, establishment: currentEstablishment });
      } else {
        const pdfUrl = await quotePdfService.generateQuotePDF(selectedData, 'print', { user, establishment: currentEstablishment });
        const printWindow = window.open(pdfUrl, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      }
    } catch (error) {
      console.error("Error generating quote PDF", error);
      alert('Erro ao gerar documento de cotação.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('freightQuote.history.title')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('freightQuote.history.subtitle', { count: sortedHistory.length })}</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedQuotes.length > 0 && (
            <>
              <button
                onClick={() => handleBulkAction('print')}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm disabled:opacity-50"
              >
                <Printer size={16} />
                <span>{isProcessing ? t('freightQuote.history.processing') || 'Processando...' : t('orders.actions.print')}</span>
              </button>
              <button
                onClick={() => handleBulkAction('download')}
                disabled={isProcessing}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm disabled:opacity-50"
              >
                <Download size={16} />
                <span>{isProcessing ? t('freightQuote.history.processing') || 'Processando...' : t('orders.actions.download')}</span>
              </button>
            </>
          )}
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            {t('freightQuote.history.refresh')}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={paginatedHistory.length > 0 && selectedQuotes.length === paginatedHistory.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('freightQuote.history.columns.number')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('freightQuote.history.columns.date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('freightQuote.history.columns.user')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('freightQuote.history.columns.partner')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('freightQuote.history.columns.origin')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('freightQuote.history.columns.destination')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('freightQuote.history.columns.modals')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('freightQuote.history.columns.weightVolume')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('freightQuote.history.columns.cargoValue')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('freightQuote.history.columns.bestOffer')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('freightQuote.history.columns.deliveryDeadline')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('freightQuote.history.columns.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
            {paginatedHistory.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-6 py-12 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">{t('freightQuote.history.emptyState')}</p>
                </td>
              </tr>
            ) : (
              paginatedHistory.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50 dark:bg-gray-900">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedQuotes.includes(quote.id)}
                      onChange={() => handleSelectRow(quote.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                      {(quote as ExtendedHistory).quote_number || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 dark:text-white">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(quote.created_at).toLocaleString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      {(quote as ExtendedHistory).user_display_name || (quote as ExtendedHistory).users?.nome || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      {(quote as ExtendedHistory).business_partners?.cpf_cnpj && `${(quote as ExtendedHistory).business_partners?.cpf_cnpj} - `}
                      {(quote as ExtendedHistory).business_partners?.nome_fantasia || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {(quote as ExtendedHistory).origin_city ? `${(quote as ExtendedHistory).origin_city?.nome}/${(quote as ExtendedHistory).origin_city?.states?.sigla}` : (quote.origin_zip_code || '-')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {(quote as ExtendedHistory).destination_city ? `${(quote as ExtendedHistory).destination_city?.nome}/${(quote as ExtendedHistory).destination_city?.states?.sigla}` : (quote.destination_zip_code || '-')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {quote.selected_modals && quote.selected_modals.length > 0 ? (
                        quote.selected_modals.map((modal: string) => (
                          <span
                            key={modal}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              modal === 'rodoviario' ? 'bg-purple-100 text-purple-700' :
                              modal === 'aereo' ? 'bg-sky-100 text-sky-700' :
                              modal === 'aquaviario' ? 'bg-cyan-100 text-cyan-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {modal === 'rodoviario' && '🚛'}
                            {modal === 'aereo' && '✈️'}
                            {modal === 'aquaviario' && '🚢'}
                            {modal === 'ferroviario' && '🚂'}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">{t('freightQuote.modals.all')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {quote.weight}kg / {quote.volume_qty} vol
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                      {formatCurrency(quote.cargo_value)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-green-600">
                        {formatCurrency(quote.best_carrier_value || 0)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {quote.quote_results?.length || 0} transportadoras
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {quote.delivery_days !== undefined && quote.delivery_deadline ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {t('freightQuote.results.days', { count: quote.delivery_days })}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(quote.delivery_deadline).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => setSelectedQuote(quote)}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {t('freightQuote.history.pagination.showing')} <span className="font-medium">{startIndex + 1}</span> {t('freightQuote.history.pagination.to')} <span className="font-medium">{Math.min(endIndex, sortedHistory.length)}</span> {t('freightQuote.history.pagination.of')} <span className="font-medium">{sortedHistory.length}</span> {t('freightQuote.history.pagination.results')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('common.previous')}
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {t('common.next')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 text-base font-bold">
                  {(selectedQuote as ExtendedHistory).quote_number || '-'}
                </span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('freightQuote.history.modal.title')}</h3>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('freightQuote.history.columns.date')}</label>
                  <p className="text-sm text-gray-900 dark:text-white">{new Date(selectedQuote.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('freightQuote.history.columns.user')}</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {(selectedQuote as ExtendedHistory).user_display_name || (selectedQuote as ExtendedHistory).users?.nome || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('freightQuote.history.columns.partner')}</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {(selectedQuote as ExtendedHistory).business_partners?.cpf_cnpj && `${(selectedQuote as ExtendedHistory).business_partners?.cpf_cnpj} - `}
                    {(selectedQuote as ExtendedHistory).business_partners?.nome_fantasia || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('freightQuote.history.columns.weightVolume')}</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedQuote.weight}kg / {selectedQuote.volume_qty} vol</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('freightQuote.history.columns.cargoValue')}</label>
                  <p className="text-sm text-gray-900 dark:text-white">{formatCurrency(selectedQuote.cargo_value)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('freightQuote.history.columns.origin')}</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {(selectedQuote as ExtendedHistory).origin_city ? `${(selectedQuote as ExtendedHistory).origin_city?.nome}/${(selectedQuote as ExtendedHistory).origin_city?.states?.sigla}` : (selectedQuote.origin_zip_code || '-')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('freightQuote.history.columns.destination')}</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {(selectedQuote as ExtendedHistory).destination_city ? `${(selectedQuote as ExtendedHistory).destination_city?.nome}/${(selectedQuote as ExtendedHistory).destination_city?.states?.sigla}` : (selectedQuote.destination_zip_code || '-')}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('freightQuote.history.columns.modals')}</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedQuote.selected_modals && selectedQuote.selected_modals.length > 0 ? (
                      selectedQuote.selected_modals.map((modal: string) => (
                        <span
                          key={modal}
                          className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium ${
                            modal === 'rodoviario' ? 'bg-purple-100 text-purple-800' :
                            modal === 'aereo' ? 'bg-sky-100 text-sky-800' :
                            modal === 'aquaviario' ? 'bg-cyan-100 text-cyan-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {modal === 'rodoviario' && t('freightQuote.modals.road')}
                          {modal === 'aereo' && t('freightQuote.modals.air')}
                          {modal === 'aquaviario' && t('freightQuote.modals.sea')}
                          {modal === 'ferroviario' && t('freightQuote.modals.rail')}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('freightQuote.modals.all')}</span>
                    )}
                  </div>
                </div>
                {selectedQuote.delivery_days !== undefined && selectedQuote.delivery_deadline && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('freightQuote.history.columns.deliveryDeadline')}</label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {t('freightQuote.results.days', { count: selectedQuote.delivery_days })} - {new Date(selectedQuote.delivery_deadline).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>

              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">{t('freightQuote.history.modal.results')}</h4>
              <div className="space-y-2">
                {selectedQuote.quote_results?.map((result: QuoteResult, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.isNominated ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900 dark:text-white">{result.carrierName}</span>
                        {result.modal && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            result.modal === 'rodoviario' ? 'bg-purple-100 text-purple-800' :
                            result.modal === 'aereo' ? 'bg-sky-100 text-sky-800' :
                            result.modal === 'aquaviario' ? 'bg-cyan-100 text-cyan-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {result.modal === 'rodoviario' && '🚛'}
                            {result.modal === 'aereo' && '✈️'}
                            {result.modal === 'aquaviario' && '🚢'}
                            {result.modal === 'ferroviario' && '🚂'}
                          </span>
                        )}
                        {result.isNominated && (
                          <span className="ml-2 text-xs text-green-600 font-medium">{t('freightQuote.results.nominated').toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{t('freightQuote.history.modal.percentLowest')}</span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                              (result.percentageAboveLowest || 0) === 0
                                ? 'bg-green-100 text-green-800'
                                : (result.percentageAboveLowest || 0) <= 10
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.percentageAboveLowest !== undefined
                                ? `${result.percentageAboveLowest.toFixed(2)}%`
                                : '0.00%'
                              }
                            </span>
                          </div>
                          {selectedQuote.cargo_value && selectedQuote.cargo_value > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{t('freightQuote.history.modal.percentInvoice')}</span>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                                ((result.totalValue * 100) / selectedQuote.cargo_value) <= 5
                                  ? 'bg-green-100 text-green-800'
                                  : ((result.totalValue * 100) / selectedQuote.cargo_value) <= 10
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {((result.totalValue * 100) / selectedQuote.cargo_value).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}%
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(result.totalValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
