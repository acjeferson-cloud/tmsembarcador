import React, { useState, useMemo } from 'react';
import { Calendar, MapPin, Package, DollarSign, RefreshCw, Eye, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { FreightQuoteHistory } from '../../services/freightQuoteService';
import { formatCurrency } from '../../utils/formatters';

interface QuoteHistoryTableProps {
  history: FreightQuoteHistory[];
  onRefresh: () => void;
}

export const QuoteHistoryTable: React.FC<QuoteHistoryTableProps> = ({ history, onRefresh }) => {
  const [selectedQuote, setSelectedQuote] = useState<FreightQuoteHistory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sort history by quote_number descending
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const numA = (a as any).quote_number || 0;
      const numB = (b as any).quote_number || 0;
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
  }, [history]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Histórico de Cotações</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{sortedHistory.length} simulações realizadas</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Atualizar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nº
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usuário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Parceiro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Origem
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Destino
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Modais
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Peso/Vol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Valor Mercadoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Melhor Oferta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Prazo de Entrega
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
            {paginatedHistory.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-6 py-12 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Nenhuma cotação encontrada</p>
                </td>
              </tr>
            ) : (
              paginatedHistory.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50 dark:bg-gray-900">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                      {(quote as any).quote_number || '-'}
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
                      {(quote as any).user_display_name || (quote as any).users?.nome || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      {(quote as any).business_partners?.nome_fantasia || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {(quote as any).origin_city ? `${(quote as any).origin_city.nome}/${(quote as any).origin_city.states?.sigla}` : (quote.origin_zip_code || '-')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {(quote as any).destination_city ? `${(quote as any).destination_city.nome}/${(quote as any).destination_city.states?.sigla}` : (quote.destination_zip_code || '-')}
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
                        <span className="text-xs text-gray-400">Todos</span>
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
                          {quote.delivery_days} {quote.delivery_days === 1 ? 'dia' : 'dias'}
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
            Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{Math.min(endIndex, sortedHistory.length)}</span> de <span className="font-medium">{sortedHistory.length}</span> resultados
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
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
              Próxima
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
                  {(selectedQuote as any).quote_number || '-'}
                </span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detalhes da Cotação</h3>
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
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data</label>
                  <p className="text-sm text-gray-900 dark:text-white">{new Date(selectedQuote.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuário</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {(selectedQuote as any).user_display_name || (selectedQuote as any).users?.nome || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Parceiro de Negócios</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {(selectedQuote as any).business_partners?.nome_fantasia || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Peso / Volumes</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedQuote.weight}kg / {selectedQuote.volume_qty} vol</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor da Mercadoria</label>
                  <p className="text-sm text-gray-900 dark:text-white">{formatCurrency(selectedQuote.cargo_value)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Origem</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {(selectedQuote as any).origin_city ? `${(selectedQuote as any).origin_city.nome}/${(selectedQuote as any).origin_city.states?.sigla}` : (selectedQuote.origin_zip_code || '-')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Destino</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {(selectedQuote as any).destination_city ? `${(selectedQuote as any).destination_city.nome}/${(selectedQuote as any).destination_city.states?.sigla}` : (selectedQuote.destination_zip_code || '-')}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Modais Selecionados</label>
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
                          {modal === 'rodoviario' && '🚛 Rodoviário'}
                          {modal === 'aereo' && '✈️ Aéreo'}
                          {modal === 'aquaviario' && '🚢 Aquaviário'}
                          {modal === 'ferroviario' && '🚂 Ferroviário'}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">Todos os modais</span>
                    )}
                  </div>
                </div>
                {selectedQuote.delivery_days !== undefined && selectedQuote.delivery_deadline && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Prazo de Entrega</label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedQuote.delivery_days} {selectedQuote.delivery_days === 1 ? 'dia' : 'dias'} - {new Date(selectedQuote.delivery_deadline).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>

              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Resultados</h4>
              <div className="space-y-2">
                {selectedQuote.quote_results?.map((result: any, index: number) => (
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
                          <span className="ml-2 text-xs text-green-600 font-medium">NOMEADO</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">% menor:</span>
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
                              <span className="text-xs text-gray-500 dark:text-gray-400">% NF-e:</span>
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
