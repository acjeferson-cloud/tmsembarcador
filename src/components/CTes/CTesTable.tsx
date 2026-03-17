import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, Printer, RefreshCw, ThumbsUp, ThumbsDown, Clock as ArrowClockwise, Download, MoreHorizontal, Trash2, Scale } from 'lucide-react';

interface CTe {
  id: number;
  status: string;
  serie: string;
  numero: string;
  dataEmissao: string;
  dataEntrada: string;
  dataAprovacao: string | null;
  tipoFrete: string;
  transportador: string;
  ufDestino: string;
  valorCTe: number;
  valorCusto: number;
  tarifaCalculo: string;
  tarifaCalculoId: string;
  chaveAcesso: string;
  nfesReferenciadas: number;
}

interface CTesTableProps {
  ctes: CTe[];
  selectedCTes: number[];
  onSelectAll: (isSelected: boolean) => void;
  onSelectCTe: (cteId: number, isSelected: boolean) => void;
  onAction: (cteId: number, action: string) => void;
  isLoading: boolean;
  userProfile?: string;
}

export const CTesTable = React.memo<CTesTableProps>(({
  ctes,
  selectedCTes,
  onSelectAll,
  onSelectCTe,
  onAction,
  isLoading,
  userProfile
}) => {
  const [sortField, setSortField] = useState<keyof CTe>('dataEmissao');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);

  // Handle sorting
  const handleSort = (field: keyof CTe) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply sorting to data
  const sortedCTes = [...ctes].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Special handling for dates
    if (typeof aValue === 'string' && (sortField.includes('data') || sortField.includes('Data'))) {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue || '').getTime();
    }
    
    // Special handling for numbers stored as strings
    if (typeof aValue === 'string' && !isNaN(Number(aValue))) {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedCTes.length / rowsPerPage);
  const paginatedCTes = sortedCTes.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Calculate difference percentage
  const calculateDifference = (cte: CTe) => {
    if (cte.valorCTe === 0 || cte.valorCusto === 0) return 0;
    return ((cte.valorCTe - cte.valorCusto) / cte.valorCusto) * 100;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'importado':
        return 'bg-white text-gray-800 border border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600';
      case 'auditado_aprovado':
        return 'bg-green-600 text-white dark:bg-green-700 dark:text-green-50';
      case 'auditado_reprovado':
        return 'bg-gray-900 text-white dark:bg-black dark:text-gray-100';
      case 'com_nfe_referenciada':
        return 'bg-yellow-400 text-gray-900 dark:bg-yellow-500 dark:text-gray-900';
      case 'cancelado':
        return 'bg-red-600 text-white dark:bg-red-700 dark:text-red-50';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'importado':
        return 'Importado';
      case 'auditado_aprovado':
        return 'Auditado e Aprovado';
      case 'auditado_reprovado':
        return 'Auditado e Reprovado';
      case 'com_nfe_referenciada':
        return 'Com NF-e Referenciada';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Get value comparison color
  const getValueComparisonColor = (cte: CTe) => {
    if (cte.valorCTe === cte.valorCusto) return 'text-green-600';
    
    const diff = calculateDifference(cte);
    if (diff === 0) return 'text-green-600';
    
    // Assuming a tolerance of ±5%
    if (Math.abs(diff) <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Toggle action menu
  const toggleActionMenu = (cteId: number) => {
    setOpenActionMenu(openActionMenu === cteId ? null : cteId);
  };

  // Check if all items on current page are selected
  const areAllSelected = paginatedCTes.length > 0 && paginatedCTes.every(cte => selectedCTes.includes(cte.id));

  // Format chave de acesso for display
  const formatChaveAcesso = (chave: string) => {
    if (chave.length <= 20) return chave;
    return `${chave.substring(0, 20)}...`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={areAllSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {sortField === 'status' && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('serie')}
              >
                <div className="flex items-center space-x-1">
                  <span>Série</span>
                  {sortField === 'serie' && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('numero')}
              >
                <div className="flex items-center space-x-1">
                  <span>Número</span>
                  {sortField === 'numero' && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('dataEmissao')}
              >
                <div className="flex items-center space-x-1">
                  <span>Data Emissão</span>
                  {sortField === 'dataEmissao' && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('dataEntrada')}
              >
                <div className="flex items-center space-x-1">
                  <span>Data Entrada</span>
                  {sortField === 'dataEntrada' && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('tipoFrete')}
              >
                <div className="flex items-center space-x-1">
                  <span>Tipo</span>
                  {sortField === 'tipoFrete' && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('transportador')}
              >
                <div className="flex items-center space-x-1">
                  <span>Transportador</span>
                  {sortField === 'transportador' && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('ufDestino')}
              >
                <div className="flex items-center space-x-1">
                  <span>UF Destino</span>
                  {sortField === 'ufDestino' && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('valorCTe')}
              >
                <div className="flex items-center space-x-1">
                  <span>Valor CT-e</span>
                  {sortField === 'valorCTe' && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('valorCusto')}
              >
                <div className="flex items-center space-x-1">
                  <span>Valor Custo</span>
                  {sortField === 'valorCusto' && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('tarifaCalculo')}
              >
                <div className="flex items-center space-x-1">
                  <span>Tarifa de Cálculo</span>
                  {sortField === 'tarifaCalculo' && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Chave de Acesso
              </th>
              <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
            {paginatedCTes.map((cte) => (
              <tr key={cte.id} className="hover:bg-gray-50 dark:bg-gray-900">
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedCTes.includes(cte.id)}
                    onChange={(e) => onSelectCTe(cte.id, e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(cte.status)}`}>
                    {getStatusLabel(cte.status)}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {cte.serie}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {cte.numero}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(cte.dataEmissao)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(cte.dataEntrada)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {cte.tipoFrete}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {cte.transportador}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {cte.ufDestino}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  {formatCurrency(cte.valorCTe)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  <div className="flex flex-col">
                    <span className={`font-medium ${getValueComparisonColor(cte)}`}>
                      {formatCurrency(cte.valorCusto)}
                    </span>
                    <span className={`text-xs ${getValueComparisonColor(cte)}`}>
                      {calculateDifference(cte) > 0 ? '+' : ''}{calculateDifference(cte).toFixed(2)}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4 text-sm">
                  {cte.tarifaCalculo ? (
                    <button
                      onClick={() => onAction(cte.id, 'view-tariff')}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-left transition-colors"
                      title="Clique para visualizar a tarifa"
                    >
                      {cte.tarifaCalculo}
                    </button>
                  ) : (
                    <span className="text-gray-400 italic">-</span>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {formatChaveAcesso(cte.chaveAcesso)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                  <div className="flex items-center justify-end space-x-1">
                    {/* View NF-es - Available for all statuses */}
                    <button
                      onClick={() => onAction(cte.id, 'view-nfes')}
                      disabled={isLoading}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title={`Consultar NF-es (${cte.nfesReferenciadas})`}
                    >
                      <Eye size={16} />
                    </button>
                    
                    {/* Print DACTE - Available for all statuses */}
                    <button
                      onClick={() => onAction(cte.id, 'print')}
                      disabled={isLoading}
                      className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                      title="Imprimir DACTE"
                    >
                      <Printer size={16} />
                    </button>

                    {/* Compare Values - Available for all statuses */}
                    <button
                      onClick={() => onAction(cte.id, 'compare-values')}
                      disabled={isLoading}
                      className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                      title="Comparar Valores"
                    >
                      <Scale size={16} />
                    </button>

                    {/* More actions button */}
                    <div className="relative">
                      <button
                        onClick={() => toggleActionMenu(cte.id)}
                        disabled={isLoading}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white p-1 rounded hover:bg-gray-50 dark:bg-gray-900"
                        title="Mais ações"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      
                      {/* Dropdown menu */}
                      {openActionMenu === cte.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                          <div className="py-1">
                            {/* Recalculate - Not for approved */}
                            {cte.status !== 'aprovado' && (
                              <button
                                onClick={() => {
                                  onAction(cte.id, 'recalculate');
                                  setOpenActionMenu(null);
                                }}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-700 flex items-center space-x-2"
                              >
                                <RefreshCw size={14} />
                                <span>Recalcular CT-e</span>
                              </button>
                            )}
                            
                            {/* Approve - Not for approved */}
                            {cte.status !== 'aprovado' && (
                              <button
                                onClick={() => {
                                  onAction(cte.id, 'approve');
                                  setOpenActionMenu(null);
                                }}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center space-x-2"
                              >
                                <ThumbsUp size={14} />
                                <span>Aprovar CT-e</span>
                              </button>
                            )}
                            
                            {/* Reject - Not for approved */}
                            {cte.status !== 'aprovado' && (
                              <button
                                onClick={() => {
                                  onAction(cte.id, 'reject');
                                  setOpenActionMenu(null);
                                }}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center space-x-2"
                              >
                                <ThumbsDown size={14} />
                                <span>Reprovar CT-e</span>
                              </button>
                            )}
                            
                            {/* Revert - Only for approved or rejected */}
                            {(cte.status === 'aprovado' || cte.status === 'reprovado') && (
                              <button
                                onClick={() => {
                                  onAction(cte.id, 'revert');
                                  setOpenActionMenu(null);
                                }}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 flex items-center space-x-2"
                              >
                                <ArrowClockwise size={14} />
                                <span>Estornar CT-e</span>
                              </button>
                            )}
                            
                            {/* Delete - Available for all */}
                            <button
                              onClick={() => {
                                onAction(cte.id, 'delete');
                                setOpenActionMenu(null);
                              }}
                              disabled={isLoading}
                              className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center space-x-2 border-t border-gray-200 dark:border-gray-700"
                            >
                              <Trash2 size={14} />
                              <span>Excluir CT-e</span>
                            </button>

                            {/* Download XML - Available for all statuses */}
                            <button
                              onClick={() => {
                                onAction(cte.id, 'download');
                                setOpenActionMenu(null);
                              }}
                              disabled={isLoading}
                              className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 flex items-center space-x-2"
                            >
                              <Download size={14} />
                              <span>Download XML</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-3 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 sm:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando <span className="font-medium">{paginatedCTes.length}</span> de <span className="font-medium">{ctes.length}</span> CT-es
          </span>
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="text-sm border-gray-300 rounded-md"
          >
            <option value={10}>10 por página</option>
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || isLoading}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || isLoading}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
});

CTesTable.displayName = 'CTesTable';