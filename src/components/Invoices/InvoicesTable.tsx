import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Eye, Edit2, MoreHorizontal, Share2, Trash2, ClipboardCheck, RefreshCw } from 'lucide-react';
import { RelationshipMapModal } from '../RelationshipMap';

interface Invoice {
  id: string;
  status: string;
  direction?: 'outbound' | 'inbound' | 'reverse';
  baseCusto?: string;
  serie: string;
  numero: string;
  dataEmissao: string;
  dataEntrada: string;
  previsaoEntrega: string | null;
  transportador: string;
  valorNFe: number;
  valorCusto: number;
  cliente: string;
  cidadeDestino: string;
  ufDestino: string;
  chaveAcesso?: string;
  tolerancia_valor_fatura?: number;
  tolerancia_percentual_fatura?: number;
}

interface InvoicesTableProps {
  invoices: Invoice[];
  selectedInvoices: string[];
  onSelectAll: (isSelected: boolean) => void;
  onSelectInvoice: (invoiceId: string, isSelected: boolean) => void;
  onAction: (invoiceId: string, action: string) => void;
  isLoading: boolean;
}

export const InvoicesTable = React.memo<InvoicesTableProps>(({
  invoices,
  selectedInvoices,
  onSelectAll,
  onSelectInvoice,
  onAction,
  isLoading
}) => {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState<keyof Invoice>('dataEmissao');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [showRelationshipMap, setShowRelationshipMap] = useState(false);
  const [selectedInvoiceForMap, setSelectedInvoiceForMap] = useState<any>(null);

  // Handle sorting
  const handleSort = (field: keyof Invoice) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply sorting to data
  const sortedInvoices = [...invoices].sort((a, b) => {
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
    
    // Null checks for accurate sorting
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
    if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    
    // Tie-breaker: sort by numero desc if the primary field is the same
    if (a.numero !== b.numero) {
      const aNum = Number(a.numero) || 0;
      const bNum = Number(b.numero) || 0;
      return bNum - aNum; // always descending for the secondary sort
    }
    
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedInvoices.length / rowsPerPage);
  const paginatedInvoices = sortedInvoices.slice(
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
  const calculateDifference = (invoice: Invoice) => {
    if (invoice.valorNFe === 0 || invoice.valorCusto === 0) return 0;
    return ((invoice.valorNFe - invoice.valorCusto) / invoice.valorCusto) * 100;
  };

  // Get value comparison color
  const getValueComparisonColor = (invoice: Invoice) => {
    const diffAmount = invoice.valorNFe - invoice.valorCusto;
    
    // Prevent float precision issues (do not ignore 1 cent)
    if (Math.abs(diffAmount) < 0.001) return 'text-green-600';
    
    // Divergences: can be positive (overcharge) or negative (undercharge)
    const diffPercent = calculateDifference(invoice);
    const maxVal = Number(invoice.tolerancia_valor_fatura || 0);
    const maxPct = Number(invoice.tolerancia_percentual_fatura || 0);

    const absDiffAmount = Math.abs(diffAmount);
    const absDiffPercent = Math.abs(diffPercent);



    // If no tolerances are configured, any overcharge/undercharge is a divergence
    if (maxVal === 0 && maxPct === 0) {

      return 'text-red-600';
    }

    const isWithinAmount = maxVal > 0 && absDiffAmount <= maxVal;
    const isWithinPercent = maxPct > 0 && absDiffPercent <= maxPct;

    const exceedsAmount = maxVal > 0 && absDiffAmount > maxVal;
    const exceedsPercent = maxPct > 0 && absDiffPercent > maxPct;

    // Se ultrapassar QUALQUER uma das tolerâncias configuradas, é divergência grave (Vermelho)
    if (exceedsAmount || exceedsPercent) {

      return 'text-red-600';
    }

    // Se não ultrapassou, mas está dentro de alguma tolerância (Amarelo)
    if (isWithinAmount || isWithinPercent) {

      return 'text-yellow-600';
    }

    // Exceeds tolerances / Fallback

    return 'text-red-600';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'emitida':
      case 'nfe_emitida':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100';
      case 'coletada':
      case 'coletado_transportadora':
      case 'coleta_realizada':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100';
      case 'em trânsito':
      case 'em_transito':
      case 'em_transito_origem':
      case 'em_transito_rota':
        return 'bg-blue-600 text-white dark:bg-blue-700 dark:text-blue-50';
      case 'saiu p/ entrega':
      case 'saiu_entrega':
        return 'bg-orange-600 text-white dark:bg-orange-700 dark:text-orange-50';
      case 'entregue':
      case 'chegada_destino':
        return 'bg-green-600 text-white dark:bg-green-700 dark:text-green-50';
      case 'cancelada':
        return 'bg-red-600 text-white dark:bg-red-700 dark:text-red-50';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'emitida':
      case 'nfe_emitida':
        return t('invoices.status.emitida');
      case 'coletada':
      case 'coletado_transportadora':
      case 'coleta_realizada':
        return t('invoices.status.emColeta');
      case 'em trânsito':
      case 'em_transito':
      case 'em_transito_origem':
      case 'em_transito_rota':
        return t('invoices.status.emTransito');
      case 'saiu p/ entrega':
      case 'saiu_entrega':
        return t('invoices.status.saiuParaEntrega');
      case 'entregue':
      case 'chegada_destino':
        return t('invoices.status.entregue');
      case 'cancelada':
        return t('invoices.status.cancelada');
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : t('invoices.status.emitida');
    }
  };


  // Toggle action menu
  const toggleActionMenu = (invoiceId: string) => {
    setOpenActionMenu(openActionMenu === invoiceId ? null : invoiceId);
  };

  // Show relationship map
  const handleShowRelationshipMap = (invoice: Invoice) => {
    setSelectedInvoiceForMap({
      id: `invoice-${invoice.id}`,
      type: 'invoice',
      number: invoice.numero,
      date: invoice.dataEmissao,
      status: getStatusLabel(invoice.status),
      value: invoice.valorNFe
    });
    setShowRelationshipMap(true);
    setOpenActionMenu(null);
  };

  // Check if all items on current page are selected
  const areAllSelected = paginatedInvoices.length > 0 && paginatedInvoices.every(invoice => selectedInvoices.includes(invoice.id));

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                  {t('invoices.table.actions')}
                </th>
                <th 
                  scope="col" 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('invoices.table.status')}</span>
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
                    <span>{t('invoices.table.serie')}</span>
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
                    <span>{t('invoices.table.number')}</span>
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
                    <span>{t('invoices.table.issueDate')}</span>
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
                    <span>{t('invoices.table.entryDate')}</span>
                    {sortField === 'dataEntrada' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('previsaoEntrega')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('invoices.table.expectedDate')}</span>
                    {sortField === 'previsaoEntrega' && (
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
                    <span>{t('invoices.table.carrier')}</span>
                    {sortField === 'transportador' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('valorNFe')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('invoices.table.nfeValue')}</span>
                    {sortField === 'valorNFe' && (
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
                    <span>{t('invoices.table.costValue')}</span>
                    {sortField === 'valorCusto' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('cliente')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('invoices.table.customer')}</span>
                    {sortField === 'cliente' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('cidadeDestino')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('invoices.table.destCity')}</span>
                    {sortField === 'cidadeDestino' && (
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
                    <span>{t('invoices.table.destState')}</span>
                    {sortField === 'ufDestino' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>

              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={(e) => onSelectInvoice(invoice.id, e.target.checked)}
                      disabled={isLoading}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                    />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-left text-sm font-medium relative">
                    <div className="flex items-center justify-start space-x-1">
                      {/* View Details */}
                      <button
                        onClick={() => onAction(invoice.id, 'view-details')}
                        disabled={isLoading}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title={t('invoices.table.viewDetails')}
                      >
                        <Eye size={16} />
                      </button>


                      {/* Launch Occurrence */}
                      <button
                        onClick={() => onAction(invoice.id, 'lancar-ocorrencia')}
                        disabled={isLoading}
                        className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 p-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        title={t('invoices.table.launchOccurrence')}
                      >
                        <ClipboardCheck size={16} />
                      </button>

                      {/* Recalculate */}
                      <button
                        onClick={() => onAction(invoice.id, 'recalculate')}
                        disabled={isLoading}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title={t('invoices.table.recalculate')}
                      >
                        <RefreshCw size={16} />
                      </button>

                      {/* Relationship Map */}
                      <button
                        onClick={() => handleShowRelationshipMap(invoice)}
                        disabled={isLoading}
                        className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 p-1 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        title={t('invoices.table.relationshipMap')}
                      >
                        <Share2 size={16} />
                      </button>
                      
                      {/* More actions button */}
                      <div className="relative">
                        <button
                          onClick={() => toggleActionMenu(invoice.id)}
                          disabled={isLoading}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                          title={t('invoices.table.moreActions')}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        
                        {/* Dropdown menu */}
                        {openActionMenu === invoice.id && (
                          <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                            <div className="py-1">
                              {/* Edit Invoice */}
                              <button
                                onClick={() => {
                                  onAction(invoice.id, 'edit');
                                  setOpenActionMenu(null);
                                }}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center space-x-2"
                              >
                                <Edit2 size={14} />
                                <span>{t('invoices.table.editInvoice')}</span>
                              </button>
                              
                              {/* Delete */}
                              <button
                                onClick={() => {
                                  onAction(invoice.id, 'delete');
                                  setOpenActionMenu(null);
                                }}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2 border-t border-gray-200 dark:border-gray-700"
                              >
                                <Trash2 size={14} />
                                <span>{t('invoices.table.deleteInvoice')}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {invoice.serie}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <span>{invoice.numero}</span>
                      {invoice.direction === 'reverse' && (
                        <span className="px-2 py-0.5 inline-flex text-[10px] leading-4 font-semibold rounded bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800" title="Logística Reversa">
                          ⮌ Reversa
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(invoice.dataEmissao)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(invoice.dataEntrada)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(invoice.previsaoEntrega)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {invoice.transportador}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                    {formatCurrency(invoice.valorNFe)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col">
                      <span className={`font-medium ${getValueComparisonColor(invoice)}`}>
                        {formatCurrency(invoice.valorCusto)}
                      </span>
                      <span className={`text-xs ${getValueComparisonColor(invoice)}`}>
                        {calculateDifference(invoice) > 0 ? '+' : ''}{calculateDifference(invoice).toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white" title={invoice.cliente}>
                    {invoice.cliente.length > 30 ? `${invoice.cliente.substring(0, 30)}...` : invoice.cliente}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {invoice.cidadeDestino}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {invoice.ufDestino}
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
              {t('invoices.pagination.showing')} <span className="font-medium">{paginatedInvoices.length}</span> {t('invoices.pagination.of')} <span className="font-medium">{invoices.length}</span> {t('invoices.pagination.nfe')}
            </span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
            >
              <option value={10}>10 {t('invoices.pagination.perPage')}</option>
              <option value={25}>25 {t('invoices.pagination.perPage')}</option>
              <option value={50}>50 {t('invoices.pagination.perPage')}</option>
              <option value={100}>100 {t('invoices.pagination.perPage')}</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('invoices.pagination.previous')}
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t('invoices.pagination.page')} <span className="font-medium">{currentPage}</span> {t('invoices.pagination.of')} <span className="font-medium">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('invoices.pagination.next')}
            </button>
          </div>
        </div>
      </div>

      {/* Relationship Map Modal */}
      {showRelationshipMap && selectedInvoiceForMap && (
        <RelationshipMapModal
          isOpen={showRelationshipMap}
          onClose={() => setShowRelationshipMap(false)}
          sourceDocument={selectedInvoiceForMap}
          onDocumentClick={() => {}}
        />
      )}
    </>
  );
});

InvoicesTable.displayName = 'InvoicesTable';