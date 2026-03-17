import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, Printer, RefreshCw, ThumbsUp, ThumbsDown, Clock as ArrowClockwise, Download, MoreHorizontal, Trash2 } from 'lucide-react';

interface Bill {
  id: string | number;
  status: string;
  numero: string;
  dataEmissao: string;
  dataVencimento: string;
  dataEntrada: string;
  dataAprovacao: string | null;
  transportador: string;
  valorCTes: number;
  valorDesconto: number;
  valorCusto: number;
  cteCount: number;
}

interface BillsTableProps {
  bills: Bill[];
  selectedBills: (string | number)[];
  onSelectAll: (isSelected: boolean) => void;
  onSelectBill: (billId: string | number, isSelected: boolean) => void;
  onAction: (billId: string | number, action: string) => void;
  isLoading: boolean;
}

export const BillsTable = React.memo<BillsTableProps>(({
  bills,
  selectedBills,
  onSelectAll,
  onSelectBill,
  onAction,
  isLoading
}) => {
  const [sortField, setSortField] = useState<keyof Bill>('dataEmissao');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openActionMenu, setOpenActionMenu] = useState<string | number | null>(null);

  // Handle sorting
  const handleSort = (field: keyof Bill) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply sorting to data
  const sortedBills = [...bills].sort((a, b) => {
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
  const totalPages = Math.ceil(sortedBills.length / rowsPerPage);
  const paginatedBills = sortedBills.slice(
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
  const calculateDifference = (bill: Bill) => {
    if (bill.valorCTes === 0 || bill.valorCusto === 0) return 0;
    return ((bill.valorCTes - bill.valorCusto) / bill.valorCusto) * 100;
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
        return 'Auditada e Aprovada';
      case 'auditado_reprovado':
        return 'Auditada e Reprovada';
      case 'com_nfe_referenciada':
        return 'Com NF-e Referenciada';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Get value comparison color
  const getValueComparisonColor = (bill: Bill) => {
    if (bill.valorCTes === bill.valorCusto) return 'text-green-600';
    
    const diff = calculateDifference(bill);
    if (diff === 0) return 'text-green-600';
    
    // Assuming a tolerance of ±5%
    if (Math.abs(diff) <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Toggle action menu
  const toggleActionMenu = (billId: number) => {
    setOpenActionMenu(openActionMenu === billId ? null : billId);
  };

  // Check if all items on current page are selected
  const areAllSelected = paginatedBills.length > 0 && paginatedBills.every(bill => selectedBills.includes(bill.id));

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
                onClick={() => handleSort('dataVencimento')}
              >
                <div className="flex items-center space-x-1">
                  <span>Data Vencimento</span>
                  {sortField === 'dataVencimento' && (
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
                onClick={() => handleSort('dataAprovacao')}
              >
                <div className="flex items-center space-x-1">
                  <span>Data Aprovação</span>
                  {sortField === 'dataAprovacao' && (
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
                onClick={() => handleSort('valorCTes')}
              >
                <div className="flex items-center space-x-1">
                  <span>Valor CT-e(s)</span>
                  {sortField === 'valorCTes' && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('valorDesconto')}
              >
                <div className="flex items-center space-x-1">
                  <span>Valor Desconto</span>
                  {sortField === 'valorDesconto' && (
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
              <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
            {paginatedBills.map((bill) => (
              <tr key={bill.id} className="hover:bg-gray-50 dark:bg-gray-900">
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedBills.includes(bill.id)}
                    onChange={(e) => onSelectBill(bill.id, e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                    {getStatusLabel(bill.status)}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {bill.numero}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(bill.dataEmissao)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(bill.dataVencimento)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(bill.dataEntrada)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(bill.dataAprovacao)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {bill.transportador}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  {formatCurrency(bill.valorCTes)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  {formatCurrency(bill.valorDesconto)}
                </td>
                <td className={`px-3 py-4 whitespace-nowrap text-sm font-medium ${getValueComparisonColor(bill)}`}>
                  {formatCurrency(bill.valorCusto)}
                  <span className="text-xs ml-1">
                    ({calculateDifference(bill).toFixed(2)}%)
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                  <div className="flex items-center justify-end space-x-1">
                    {/* View CT-es - Available for all statuses */}
                    <button
                      onClick={() => onAction(bill.id, 'view-ctes')}
                      disabled={isLoading}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title={`Consultar CT-es (${bill.cteCount})`}
                    >
                      <Eye size={16} />
                    </button>
                    
                    {/* View Details - Available for all statuses */}
                    <button
                      onClick={() => onAction(bill.id, 'view-details')}
                      disabled={isLoading}
                      className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                      title="Visualizar Detalhes"
                    >
                      <Eye size={16} />
                    </button>
                    
                    {/* More actions button */}
                    <div className="relative">
                      <button
                        onClick={() => toggleActionMenu(bill.id)}
                        disabled={isLoading}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white p-1 rounded hover:bg-gray-50 dark:bg-gray-900"
                        title="Mais ações"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      
                      {/* Dropdown menu */}
                      {openActionMenu === bill.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                          <div className="py-1">
                            {/* Print DACTE - Available for all statuses */}
                            <button
                              onClick={() => {
                                onAction(bill.id, 'print');
                                setOpenActionMenu(null);
                              }}
                              disabled={isLoading}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-700 flex items-center space-x-2"
                            >
                              <Printer size={14} />
                              <span>Imprimir DACTE</span>
                            </button>
                            
                            {/* Recalculate - Not for approved */}
                            {bill.status !== 'auditada_aprovada' && (
                              <button
                                onClick={() => {
                                  onAction(bill.id, 'recalculate');
                                  setOpenActionMenu(null);
                                }}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-700 flex items-center space-x-2"
                              >
                                <RefreshCw size={14} />
                                <span>Recalcular Fatura</span>
                              </button>
                            )}
                            
                            {/* Approve - Not for approved */}
                            {bill.status !== 'auditada_aprovada' && (
                              <button
                                onClick={() => {
                                  onAction(bill.id, 'approve');
                                  setOpenActionMenu(null);
                                }}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center space-x-2"
                              >
                                <ThumbsUp size={14} />
                                <span>Aprovar Fatura</span>
                              </button>
                            )}
                            
                            {/* Reject - Not for approved */}
                            {bill.status !== 'auditada_aprovada' && (
                              <button
                                onClick={() => {
                                  onAction(bill.id, 'reject');
                                  setOpenActionMenu(null);
                                }}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center space-x-2"
                              >
                                <ThumbsDown size={14} />
                                <span>Reprovar Fatura</span>
                              </button>
                            )}
                            
                            {/* Revert - Only for approved or rejected */}
                            {(bill.status === 'auditada_aprovada' || bill.status === 'auditada_reprovada') && (
                              <button
                                onClick={() => {
                                  onAction(bill.id, 'revert');
                                  setOpenActionMenu(null);
                                }}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 flex items-center space-x-2"
                              >
                                <ArrowClockwise size={14} />
                                <span>Estornar Fatura</span>
                              </button>
                            )}
                            
                            {/* Delete - Available for all */}
                            <button
                              onClick={() => {
                                onAction(bill.id, 'delete');
                                setOpenActionMenu(null);
                              }}
                              disabled={isLoading}
                              className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center space-x-2 border-t border-gray-200 dark:border-gray-700"
                            >
                              <Trash2 size={14} />
                              <span>Excluir Fatura</span>
                            </button>

                            {/* Download XML - Available for all statuses */}
                            <button
                              onClick={() => {
                                onAction(bill.id, 'download');
                                setOpenActionMenu(null);
                              }}
                              disabled={isLoading}
                              className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 flex items-center space-x-2 border-t border-gray-200 dark:border-gray-700"
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
            Mostrando <span className="font-medium">{paginatedBills.length}</span> de <span className="font-medium">{bills.length}</span> faturas
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

BillsTable.displayName = 'BillsTable';