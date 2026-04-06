import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Eye, Printer, Download, MoreHorizontal, Share2, Edit, Calculator, Trash2 } from 'lucide-react';
import { RelationshipMapModal } from '../RelationshipMap';
import { formatCurrency } from '../../utils/formatters';
import { generateTrackingCode } from '../../utils/trackingCodeGenerator';
import { establishments } from '../../data/establishmentsData';

interface Order {
  id: number;
  status: string;
  numero: string;
  dataEmissao: string;
  dataEntrada: string;
  dataPrevisaoEntrega: string;
  transportador: string;
  valorFrete: number;
  cliente: string;
  cidadeDestino: string;
  ufDestino: string;
  valorPedido: number;
  chaveAcesso: string;
  serie?: string;
  establishmentId?: string;
  date?: string;
  number?: string;
  trackingCode?: string;
}

interface OrdersTableProps {
  orders: Order[];
  selectedOrders: number[];
  onSelectAll: (isSelected: boolean) => void;
  onSelectOrder: (orderId: number, isSelected: boolean) => void;
  onAction: (orderId: number, action: string) => void;
  onEdit?: (orderId: string) => void;
  canEdit?: (order: any) => { canEdit: boolean; reason?: string };
  isLoading: boolean;
}

export const OrdersTable = React.memo<OrdersTableProps>(({
  orders,
  selectedOrders,
  onSelectAll,
  onSelectOrder,
  onAction,
  onEdit,
  canEdit,
  isLoading
}) => {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState<keyof Order>('dataEmissao');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
  const [showRelationshipMap, setShowRelationshipMap] = useState(false);
  const [selectedOrderForMap, setSelectedOrderForMap] = useState<any>(null);

  // Helper function to get tracking code for an order
  const getOrderTrackingCode = (order: Order): string => {
    if (order.trackingCode) {
      return order.trackingCode;
    }

    try {
      const establishment = establishments.find(est => 
        est.id.toString() === order.establishmentId || 
        est.id.toString() === order.establishmentId
      );
      
      if (!establishment) {
        return `TMS-${order.numero}`;
      }
      
      return generateTrackingCode(
        order.numero || order.number || '',
        new Date(order.date || order.dataEmissao || new Date()),
        establishment.codigo,
        establishment.trackingPrefix || 'TGL'
      );
    } catch (error) {
      return `TMS-${order.numero}`;
    }
  };
  // Handle sorting
  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply sorting to data
  const sortedOrders = [...orders].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (aValue === undefined || aValue === null) aValue = '' as any;
    if (bValue === undefined || bValue === null) bValue = '' as any;
    
    // Special handling for dates
    if (typeof aValue === 'string' && (sortField.includes('data') || sortField.includes('Data'))) {
      aValue = new Date(aValue).getTime() as any;
      bValue = new Date((bValue as string) || '').getTime() as any;
    }
    
    // Special handling for numbers stored as strings
    if (typeof aValue === 'string' && !isNaN(Number(aValue))) {
      aValue = Number(aValue) as any;
      bValue = Number(bValue) as any;
    }
    
    if ((aValue as any) < (bValue as any)) return sortDirection === 'asc' ? -1 : 1;
    if ((aValue as any) > (bValue as any)) return sortDirection === 'asc' ? 1 : -1;
    
    // Tie-breaker: sort by numero desc if the primary field is the same
    if (a.numero !== b.numero) {
      const aNum = Number(a.numero) || 0;
      const bNum = Number(b.numero) || 0;
      return bNum - aNum; // always descending for the secondary sort
    }
    
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / rowsPerPage);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    
    try {
      // Extrair apenas o bloco YYYY-MM-DD da string, ignorando Timezone que causa o recuo de -1 dia no BR (-3h)
      const datePart = dateString.split('T')[0];
      const [year, month, day] = datePart.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
    } catch (e) {
      // Ignora erro e cai no fallback
    }
    
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'emitido':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100';
      case 'coletado':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100';
      case 'em_transito':
        return 'bg-blue-600 text-white dark:bg-blue-700 dark:text-blue-50';
      case 'saiu_entrega':
        return 'bg-orange-600 text-white dark:bg-orange-700 dark:text-orange-50';
      case 'entregue':
        return 'bg-green-600 text-white dark:bg-green-700 dark:text-green-50';
      case 'cancelado':
        return 'bg-red-600 text-white dark:bg-red-700 dark:text-red-50';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'emitido':
        return t('orders.status.emitido');
      case 'coletado':
        return t('orders.status.coletado');
      case 'em_transito':
        return t('orders.status.em_transito');
      case 'saiu_entrega':
        return t('orders.status.saiu_entrega');
      case 'entregue':
        return t('orders.status.entregue');
      case 'cancelado':
        return t('orders.status.cancelado');
      default:
        return status;
    }
  };

  // Format chave de acesso for display
  // const formatChaveAcesso = (chave: string) => {
  //   if (chave.length <= 20) return chave;
  //   return `${chave.substring(0, 20)}...`;
  // };

  // Toggle action menu
  const toggleActionMenu = (orderId: number) => {
    setOpenActionMenu(openActionMenu === orderId ? null : orderId);
  };

  // Show relationship map
  const handleShowRelationshipMap = (order: Order) => {
    setSelectedOrderForMap({
      id: `order-${order.id}`,
      type: 'order',
      number: order.numero,
      date: order.dataEmissao,
      status: getStatusLabel(order.status),
      value: order.valorPedido
    });
    setShowRelationshipMap(true);
    setOpenActionMenu(null);
  };

  // Check if all items on current page are selected
  const areAllSelected = paginatedOrders.length > 0 && paginatedOrders.every(order => selectedOrders.includes(order.id));

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
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('orders.table.actions')}
                </th>
                <th 
                  scope="col" 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('orders.table.status')}</span>
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
                    <span>{t('orders.table.serie')}</span>
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
                    <span>{t('orders.table.number')}</span>
                    {sortField === 'numero' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('orders.table.trackingCode')}
                </th>
                <th 
                  scope="col" 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('dataEmissao')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('orders.table.issueDate')}</span>
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
                    <span>{t('orders.table.entryDate')}</span>
                    {sortField === 'dataEntrada' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('dataPrevisaoEntrega')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('orders.table.expectedDate')}</span>
                    {sortField === 'dataPrevisaoEntrega' && (
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
                    <span>{t('orders.table.carrier')}</span>
                    {sortField === 'transportador' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('valorPedido')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('orders.table.orderValue')}</span>
                    {sortField === 'valorPedido' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('valorFrete')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('orders.table.freightValue')}</span>
                    {sortField === 'valorFrete' && (
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
                    <span>{t('orders.table.customer')}</span>
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
                    <span>{t('orders.table.destCity')}</span>
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
                    <span>{t('orders.table.destState')}</span>
                    {sortField === 'ufDestino' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={(e) => onSelectOrder(order.id, e.target.checked)}
                      disabled={isLoading}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                    />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-left text-sm font-medium relative">
                    <div className="flex items-center justify-start space-x-1">
                      {/* View Details */}
                      <button
                        onClick={() => onAction(order.id, 'view-details')}
                        disabled={isLoading}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title={t('orders.table.viewDetails')}
                      >
                        <Eye size={16} />
                      </button>
                      
                      {/* Print Order */}
                      <button
                        onClick={() => onAction(order.id, 'print')}
                        disabled={isLoading}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                        title={t('orders.table.printOrder')}
                      >
                        <Printer size={16} />
                      </button>
                      
                      {/* Download Order */}
                      <button
                        onClick={() => onAction(order.id, 'download')}
                        disabled={isLoading}
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        title={t('orders.table.downloadOrder')}
                      >
                        <Download size={16} />
                      </button>
                      
                      {/* Relationship Map */}
                      <button
                        onClick={() => handleShowRelationshipMap(order)}
                        disabled={isLoading}
                        className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 p-1 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        title={t('orders.table.relationshipMap')}
                      >
                        <Share2 size={16} />
                      </button>
                      
                      {/* More actions button */}
                      <div className="relative">
                        <button
                          onClick={() => toggleActionMenu(order.id)}
                          disabled={isLoading}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                          title={t('orders.table.moreActions')}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        
                        {/* Dropdown menu */}
                        {openActionMenu === order.id && (
                          <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                            <div className="py-1">
                              {/* Additional actions can be added here */}

                              {/* Edit Order */}
                              {onEdit && canEdit && canEdit(order).canEdit && (
                                <button
                                  onClick={() => {
                                    onEdit(order.id.toString());
                                    setOpenActionMenu(null);
                                  }}
                                  disabled={isLoading}
                                  className="w-full text-left px-4 py-2 text-sm text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center space-x-2"
                                >
                                  <Edit size={14} />
                                  <span>{t('orders.table.editOrder')}</span>
                                </button>
                              )}

                              {/* Recalcular Pedido */}
                              <button
                                onClick={() => {
                                  onAction(order.id, 'recalculate');
                                  setOpenActionMenu(null);
                                }}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center space-x-2"
                              >
                                <Calculator size={14} />
                                <span>{t('orders.table.recalcOrder')}</span>
                              </button>

                              <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                              
                              {/* Excluir Pedido */}
                              <button
                                onClick={() => {
                                  onAction(order.id, 'delete');
                                  setOpenActionMenu(null);
                                }}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                              >
                                <Trash2 size={14} />
                                <span>{t('orders.table.deleteOrder')}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {order.serie || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {order.numero}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                    {getOrderTrackingCode(order)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(order.dataEmissao)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(order.dataEntrada)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(order.dataPrevisaoEntrega)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white truncate max-w-[200px]" title={order.transportador}>
                    {order.transportador}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                    {formatCurrency(order.valorPedido)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(order.valorFrete)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white" title={order.cliente}>
                    {order.cliente && order.cliente.length > 30 ? `${order.cliente.substring(0, 30)}...` : order.cliente || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {order.cidadeDestino}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {order.ufDestino}
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
              {t('orders.table.showing')} <span className="font-medium">{paginatedOrders.length}</span> {t('orders.table.of')} <span className="font-medium">{orders.length}</span> {t('orders.table.records')}
            </span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
            >
              <option value={10}>10 {t('orders.table.perPage')}</option>
              <option value={25}>25 {t('orders.table.perPage')}</option>
              <option value={50}>50 {t('orders.table.perPage')}</option>
              <option value={100}>100 {t('orders.table.perPage')}</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('orders.table.prev')}
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t('orders.table.page')} <span className="font-medium">{currentPage}</span> {t('orders.table.of')} <span className="font-medium">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('orders.table.next')}
            </button>
          </div>
        </div>
      </div>

      {/* Relationship Map Modal */}
      {showRelationshipMap && selectedOrderForMap && (
        <RelationshipMapModal
          isOpen={showRelationshipMap}
          onClose={() => setShowRelationshipMap(false)}
          sourceDocument={selectedOrderForMap}
          onDocumentClick={() => {}}
        />
      )}
    </>
  );
});

OrdersTable.displayName = 'OrdersTable';
