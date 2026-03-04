import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Search, Plus, Filter, Download, FileText, CheckCircle, XCircle, AlertCircle, Clock, Truck, MapPin, DollarSign, FileCheck, Printer, RefreshCw, Eye, Calendar, Package, ShoppingCart } from 'lucide-react';
import { OrdersFilters } from './OrdersFilters';
import { OrdersTable } from './OrdersTable';
import { OrdersActions } from './OrdersActions';
import { OrderDetailsModal } from './OrderDetailsModal';
import { OrderForm } from './OrderForm';
import { ordersService } from '../../services/ordersService';
import { useAuth } from '../../hooks/useAuth';

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
}


export const Orders: React.FC = () => {
  const { user } = useAuth();
  const breadcrumbItems = [
    { label: 'Área de trabalho' },
    { label: 'Pedidos', current: true }
  ];

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [filters, setFilters] = useState({
    transportador: '',
    cliente: '',
    periodoEmissao: { start: '', end: '' },
    periodoEntrada: { start: '', end: '' },
    periodoPrevisao: { start: '', end: '' },
    ufDestino: '',
    cidadeDestino: '',
    status: [] as string[],
    numeroPedido: ''
  });

  // Load orders from database
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersService.getAll();
      const mappedData = data.map(order => ({
        id: order.id || '',
        status: order.status,
        numero: order.order_number,
        dataEmissao: order.issue_date,
        dataEntrada: order.entry_date,
        dataPrevisaoEntrega: order.expected_delivery || '',
        transportador: order.carrier_name,
        valorFrete: order.freight_value,
        cliente: order.customer_name,
        cidadeDestino: order.destination_city,
        ufDestino: order.destination_state,
        valorPedido: order.order_value,
        chaveAcesso: order.tracking_code || ''
      }));
      setOrders(mappedData as any);
      setFilteredOrders(mappedData as any);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setError('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to orders
  useEffect(() => {
    const applyFilters = () => {
      let result = [...orders];
      
      // Filter by transportador
      if (filters.transportador) {
        result = result.filter(order => 
          order.transportador.toLowerCase().includes(filters.transportador.toLowerCase())
        );
      }
      
      // Filter by cliente
      if (filters.cliente) {
        result = result.filter(order => 
          order.cliente.toLowerCase().includes(filters.cliente.toLowerCase())
        );
      }
      
      // Filter by período de emissão
      if (filters.periodoEmissao.start && filters.periodoEmissao.end) {
        const startDate = new Date(filters.periodoEmissao.start);
        const endDate = new Date(filters.periodoEmissao.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        result = result.filter(order => {
          const emissaoDate = new Date(order.dataEmissao);
          return emissaoDate >= startDate && emissaoDate <= endDate;
        });
      }
      
      // Filter by período de entrada
      if (filters.periodoEntrada.start && filters.periodoEntrada.end) {
        const startDate = new Date(filters.periodoEntrada.start);
        const endDate = new Date(filters.periodoEntrada.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        result = result.filter(order => {
          const entradaDate = new Date(order.dataEntrada);
          return entradaDate >= startDate && entradaDate <= endDate;
        });
      }
      
      // Filter by período de previsão
      if (filters.periodoPrevisao.start && filters.periodoPrevisao.end) {
        const startDate = new Date(filters.periodoPrevisao.start);
        const endDate = new Date(filters.periodoPrevisao.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        result = result.filter(order => {
          const previsaoDate = new Date(order.dataPrevisaoEntrega);
          return previsaoDate >= startDate && previsaoDate <= endDate;
        });
      }
      
      // Filter by UF destino
      if (filters.ufDestino) {
        result = result.filter(order => order.ufDestino === filters.ufDestino);
      }
      
      // Filter by cidade destino
      if (filters.cidadeDestino) {
        result = result.filter(order => 
          order.cidadeDestino.toLowerCase().includes(filters.cidadeDestino.toLowerCase())
        );
      }
      
      // Filter by status
      if (filters.status.length > 0) {
        result = result.filter(order => filters.status.includes(order.status));
      }
      
      // Filter by número do pedido
      if (filters.numeroPedido) {
        result = result.filter(order => 
          order.numero.toLowerCase().includes(filters.numeroPedido.toLowerCase())
        );
      }
      
      setFilteredOrders(result);
    };
    
    applyFilters();
  }, [orders, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrders(filteredOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleEditOrder = async (orderId: string) => {
    try {
      const orderData = await ordersService.getById(orderId);
      if (orderData) {
        setEditingOrder(orderData);
        setShowOrderForm(true);
      }
    } catch (error) {
      console.error('Erro ao carregar pedido para edição:', error);
      setError('Erro ao carregar dados do pedido');
    }
  };

  const canEditOrder = (order: any): { canEdit: boolean; reason?: string } => {
    // Verifica se o pedido tem NF, Coleta, CT-e ou Fatura associados
    // Por enquanto, vamos permitir editar qualquer pedido (depois você pode adicionar validações)
    return { canEdit: true };
  };

  const handleBulkAction = (action: string) => {
    if (selectedOrders.length === 0) {
      alert('Por favor, selecione pelo menos um pedido para realizar esta ação.');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      switch (action) {
        case 'print':
          alert(`Gerando impressão para ${selectedOrders.length} pedido(s) selecionado(s).`);
          break;
        case 'download':
          alert(`Baixando ${selectedOrders.length} pedido(s) selecionado(s).`);
          break;
        default:
          break;
      }
      
      setIsLoading(false);
      // Clear selection after action
      setSelectedOrders([]);
    }, 1000);
  };

  const handleSingleAction = (orderId: number, action: string) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        setIsLoading(false);
        return;
      }
      
      switch (action) {
        case 'view-details':
          setSelectedOrder(order);
          setShowDetailsModal(true);
          break;
        case 'print':
          alert(`Gerando impressão para o pedido ${order.numero}.`);
          break;
        case 'download':
          alert(`Baixando pedido ${order.numero}.`);
          break;
        default:
          break;
      }
      
      setIsLoading(false);
    }, 500);
  };

  const refreshData = async () => {
    setIsLoading(true);
    setLoading(true);
    await loadOrders();
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-400">Carregando pedidos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">Erro ao carregar pedidos: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pedidos</h1>
          <p className="text-gray-600 dark:text-gray-400">Visualize e gerencie todos os pedidos importados no sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowOrderForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Inserir Pedido</span>
          </button>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Carregando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Pedidos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{orders.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Emitidos</p>
              <p className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mt-1">
                {orders.filter(order => order.status === 'emitido').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Coletados</p>
              <p className="text-2xl font-semibold text-blue-400 mt-1">
                {orders.filter(order => order.status === 'coletado').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck size={20} className="text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Em Trânsito</p>
              <p className="text-2xl font-semibold text-blue-600 mt-1">
                {orders.filter(order => order.status === 'em_transito').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saiu p/ Entrega</p>
              <p className="text-2xl font-semibold text-orange-600 mt-1">
                {orders.filter(order => order.status === 'saiu_entrega').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Truck size={20} className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entregues</p>
              <p className="text-2xl font-semibold text-green-600 mt-1">
                {orders.filter(order => order.status === 'entregue').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cancelados</p>
              <p className="text-2xl font-semibold text-red-600 mt-1">
                {orders.filter(order => order.status === 'cancelado').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle size={20} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <OrdersFilters 
        onFilterChange={handleFilterChange} 
        filters={filters}
      />

      {/* Bulk Actions */}
      <OrdersActions 
        selectedCount={selectedOrders.length}
        onAction={handleBulkAction}
        isLoading={isLoading}
      />

      {/* Orders Table */}
      <OrdersTable
        orders={filteredOrders}
        selectedOrders={selectedOrders}
        onSelectAll={handleSelectAll}
        onSelectOrder={handleSelectOrder}
        onAction={handleSingleAction}
        onEdit={handleEditOrder}
        canEdit={canEditOrder}
        isLoading={isLoading}
      />

      {/* No Results */}
      {filteredOrders.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum pedido encontrado</h3>
          <p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou importar novos pedidos.</p>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl flex items-center space-x-4">
            <RefreshCw size={24} className="text-blue-600 animate-spin" />
            <p className="text-gray-800 dark:text-gray-200 font-medium">Processando...</p>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          order={selectedOrder}
        />
      )}

      {/* Order Form Modal */}
      {showOrderForm && user && (
        <OrderForm
          onClose={() => {
            setShowOrderForm(false);
            setEditingOrder(null);
          }}
          onSave={() => {
            setShowOrderForm(false);
            setEditingOrder(null);
            refreshData();
          }}
          userId={user.id}
          order={editingOrder}
        />
      )}
    </div>
  );
};