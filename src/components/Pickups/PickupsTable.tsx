import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Eye, MoreHorizontal, XCircle, Share2, Trash2, CheckCircle } from 'lucide-react';

interface Pickup {
  id: string;
  numeroColeta: string;
  status: string;
  transportador: string;
  quantidadeNotas: number;
  dataCriacao: string;
  usuarioResponsavel: string;
  enderecoColeta: string;
  valorTotal: number;
  dataSolicitacao: string | null;
  dataRealizacao: string | null;
  observacoes: string;
}

interface PickupsTableProps {
  pickups: Pickup[];
  selectedPickups: string[];
  onSelectAll: (isSelected: boolean) => void;
  onSelectPickup: (pickupId: string, isSelected: boolean) => void;
  onAction: (pickupId: string, action: string) => void;
  isLoading: boolean;
}

export const PickupsTable: React.FC<PickupsTableProps> = ({
  pickups,
  selectedPickups,
  onSelectAll,
  onSelectPickup,
  onAction,
  isLoading
}) => {
  const { t } = useTranslation();

  const [sortField, setSortField] = useState<keyof Pickup>('dataCriacao');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  // Handle sorting
  const handleSort = (field: keyof Pickup) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply sorting to data
  const sortedPickups = [...pickups].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Special handling for dates
    if (typeof aValue === 'string' && (sortField.includes('data') || sortField.includes('Data'))) {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue || '').getTime();
    }

    // Special handling for numbers
    if (typeof aValue === 'number') {
      return sortDirection === 'asc' ? aValue - (bValue as number) : (bValue as number) - aValue;
    }

    if (aValue === undefined || aValue === null) return sortDirection === 'asc' ? -1 : 1;
    if (bValue === undefined || bValue === null) return sortDirection === 'asc' ? 1 : -1;

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedPickups.length / rowsPerPage);
  const paginatedPickups = sortedPickups.slice(
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

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'emitida':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100';
      case 'solicitada':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100';
      case 'realizada':
      case 'coleta_realizada':
        return 'bg-green-600 text-white dark:bg-green-700 dark:text-green-50';
      case 'cancelada':
      case 'coleta_cancelada':
        return 'bg-red-600 text-white dark:bg-red-700 dark:text-red-50';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'emitida':
        return t('pickups.status.emitida');
      case 'solicitada':
        return t('pickups.status.solicitada');
      case 'realizada':
      case 'coleta_realizada':
        return t('pickups.status.realizada');
      case 'cancelada':
      case 'coleta_cancelada':
        return t('pickups.status.cancelada');
      default:
        return status;
    }
  };

  const toggleActionMenu = (pickupId: string) => {
    setOpenActionMenu(openActionMenu === pickupId ? null : pickupId);
  };

  // Check if all items on current page are selected
  const areAllSelected = paginatedPickups.length > 0 && paginatedPickups.every(pickup => selectedPickups.includes(pickup.id));

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
        <div className="overflow-visible">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={areAllSelected}
                      onChange={(e) => onSelectAll(e.target.checked)}
                      disabled={isLoading}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                    />
                  </div>
                </th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                  {t('pickups.table.actions')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('pickups.table.status')}</span>
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('numeroColeta')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('pickups.table.pickupNumber')}</span>
                    {sortField === 'numeroColeta' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('dataCriacao')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('pickups.table.issueDate')}</span>
                    {sortField === 'dataCriacao' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('quantidadeNotas')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('pickups.table.nfeQty')}</span>
                    {sortField === 'quantidadeNotas' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('valorTotal')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('pickups.table.nfeValue')}</span>
                    {sortField === 'valorTotal' && (
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
                    <span>{t('pickups.table.carrier')}</span>
                    {sortField === 'transportador' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('usuarioResponsavel')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('pickups.table.creatorUser')}</span>
                    {sortField === 'usuarioResponsavel' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedPickups.map((pickup) => (
                <tr key={pickup.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPickups.includes(pickup.id)}
                      onChange={(e) => onSelectPickup(pickup.id, e.target.checked)}
                      disabled={isLoading}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                    />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => onAction(pickup.id, 'view-details')}
                        title={t('pickups.table.viewDetails')}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <Eye size={18} />
                      </button>

                      {/* 'Confirmar Realização' movido para dentro do menu três pontinhos */}

                      <button
                        onClick={() => onAction(pickup.id, 'view-relationship-map')}
                        title={t('pickups.table.relationshipMap')}
                        className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 p-1 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                      >
                        <Share2 size={18} />
                      </button>

                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => toggleActionMenu(pickup.id)}
                          title="Mais {t('pickups.table.actions')}"
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <MoreHorizontal size={20} />
                        </button>

                        {openActionMenu === pickup.id && (
                          <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                            <div className="py-1">
                              {/* Confirmar Realização Action */}
                              {pickup.status !== 'cancelada' && pickup.status !== 'realizada' && pickup.status !== 'coleta_cancelada' && pickup.status !== 'coleta_realizada' && (
                              <button
                                onClick={() => {
                                  onAction(pickup.id, 'realizar');
                                  setOpenActionMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-emerald-700 dark:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 border-b border-gray-200 dark:border-gray-700"
                              >
                                <CheckCircle size={16} />
                                <span>{t('pickups.actions.markAsDone')}</span>
                              </button>
                              )}
                              {pickup.status !== 'cancelada' && pickup.status !== 'realizada' && pickup.status !== 'coleta_cancelada' && pickup.status !== 'coleta_realizada' && (
                              <button
                                onClick={() => {
                                  onAction(pickup.id, 'cancelar');
                                  setOpenActionMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 border-b border-gray-200 dark:border-gray-700"
                              >
                                <XCircle size={16} />
                                <span>{t('pickups.actions.cancel')}</span>
                              </button>
                            )}
                            
                            {/* Delete Action */}
                            <button
                              onClick={() => {
                                onAction(pickup.id, 'delete');
                                setOpenActionMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 border-t border-gray-200 dark:border-gray-700"
                            >
                              <Trash2 size={16} />
                              <span>{t('pickups.actions.delete')}</span>
                            </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(pickup.status)}`}>
                      {getStatusLabel(pickup.status)}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {pickup.numeroColeta}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(pickup.dataCriacao)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-semibold">
                      {pickup.quantidadeNotas}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(pickup.valorTotal)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white truncate max-w-[250px]" title={pickup.transportador}>
                    {pickup.transportador}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {pickup.usuarioResponsavel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex-1 flex justify-between items-center sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {t('pickups.table.previous')}
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t('pickups.table.pageOf', { current: currentPage, total: totalPages })}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {t('pickups.table.next')}
            </button>
          </div>

          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('pickups.table.showingResults', { start: (currentPage - 1) * rowsPerPage + 1, end: Math.min(currentPage * rowsPerPage, sortedPickups.length), total: sortedPickups.length })}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <option value={5}>{t('pickups.table.rowsPerPage', { count: 5 })}</option>
                <option value={10}>{t('pickups.table.rowsPerPage', { count: 10 })}</option>
                <option value={25}>{t('pickups.table.rowsPerPage', { count: 25 })}</option>
                <option value={50}>{t('pickups.table.rowsPerPage', { count: 50 })}</option>
              </select>

              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  {t('pickups.table.previous')}
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-500 text-blue-600 dark:text-blue-300'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  {t('pickups.table.next')}
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
