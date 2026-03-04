import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, Printer, Download, MoreHorizontal, Share2, Edit } from 'lucide-react';
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
  establishmentId?: string;
  date?: string;
  number?: string;
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
  const [sortField, setSortField] = useState<keyof Order>('dataEmissao');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
  const [showRelationshipMap, setShowRelationshipMap] = useState(false);
  const [selectedOrderForMap, setSelectedOrderForMap] = useState<any>(null);

  // Helper function to get tracking code for an order
  const getOrderTrackingCode = (order: Order): string => {
    try {
      const establishment = establishments.find(est => 
        est.id.toString() === order.establishmentId || 
        est.id.toString() === order.establishmentId
      );
      
      if (!establishment) {
        return `TMS-${order.numero}`;
      }
      
      return generateTrackingCode(establishment.trackingPrefix || 'TGL', establishment.code, parseInt(order.number?.replace('PED-', '') || '0'), new Date(order.date || order.dataEmissao));
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
  const totalPages = Math.ceil(sortedOrders.length / rowsPerPage);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
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
        return 'Emitido';
      case 'coletado':
        return 'Coletado';
      case 'em_transito':
        return 'Em Trânsito';
      case 'saiu_entrega':
        return 'Saiu p/Entrega';
      case 'entregue':
        return 'Entregue';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Format chave de acesso for display
  const formatChaveAcesso = (chave: string) => {
    if (chave.length <= 20) return chave;
    return `${chave.substring(0, 20)}...`;
  };

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
                  onClick={() => handleSort('dataPrevisaoEntrega')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Previsão Entrega</span>
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
                    <span>Transportador</span>
                    {sortField === 'transportador' && (
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
                    <span>Valor Frete</span>
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
                    <span>Cliente</span>
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
                    <span>Cidade Destino</span>
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
                    <span>UF Destino</span>
                    {sortField === 'ufDestino' && (
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
                    <span>Valor Pedido</span>
                    {sortField === 'valorPedido' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código Rastreamento
                </th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
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
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {order.numero}
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
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {order.transportador}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                    {formatCurrency(order.valorFrete)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {order.cliente}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {order.cidadeDestino}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {order.ufDestino}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                    {formatCurrency(order.valorPedido)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                    {getOrderTrackingCode(order)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                    <div className="flex items-center justify-end space-x-1">
                      {/* View Details */}
                      <button
                        onClick={() => onAction(order.id, 'view-details')}
                        disabled={isLoading}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Visualizar Detalhes"
                      >
                        <Eye size={16} />
                      </button>
                      
                      {/* Print Order */}
                      <button
                        onClick={() => onAction(order.id, 'print')}
                        disabled={isLoading}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                        title="Imprimir Pedido"
                      >
                        <Printer size={16} />
                      </button>
                      
                      {/* Download Order */}
                      <button
                        onClick={() => onAction(order.id, 'download')}
                        disabled={isLoading}
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        title="Download Pedido"
                      >
                        <Download size={16} />
                      </button>
                      
                      {/* Relationship Map */}
                      <button
                        onClick={() => handleShowRelationshipMap(order)}
                        disabled={isLoading}
                        className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 p-1 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        title="Mapa de Relações"
                      >
                        <Share2 size={16} />
                      </button>
                      
                      {/* More actions button */}
                      <div className="relative">
                        <button
                          onClick={() => toggleActionMenu(order.id)}
                          disabled={isLoading}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                          title="Mais ações"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        
                        {/* Dropdown menu */}
                        {openActionMenu === order.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                            <div className="py-1">
                              {/* Additional actions can be added here */}
                              <button
                                onClick={() => {
                                  onAction(order.id, 'view-details');
                                  setOpenActionMenu(null);
                                }}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center space-x-2"
                              >
                                <Eye size={14} />
                                <span>Visualizar Detalhes</span>
                              </button>

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
                                  <span>Editar Pedido</span>
                                </button>
                              )}

                              {/* Relationship Map */}
                              <button
                                onClick={() => {
                                  handleShowRelationshipMap(order);
                                  setOpenActionMenu(null);
                                }}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center space-x-2"
                              >
                                <Share2 size={14} />
                                <span>Mapa de Relações</span>
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
              Mostrando <span className="font-medium">{paginatedOrders.length}</span> de <span className="font-medium">{orders.length}</span> registros
            </span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
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
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
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