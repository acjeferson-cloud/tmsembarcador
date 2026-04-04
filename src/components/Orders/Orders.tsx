import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Plus, FileText, CheckCircle, XCircle, Truck, RefreshCw, ShoppingCart } from 'lucide-react';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { OrdersFilters } from './OrdersFilters';
import { OrdersTable } from './OrdersTable';
import { OrdersActions } from './OrdersActions';
import { OrderDetailsModal } from './OrderDetailsModal';
import { OrderForm } from './OrderForm';
import { orderPdfService } from '../../services/orderPdfService';
import { ordersService } from '../../services/ordersService';
import { useAuth } from '../../hooks/useAuth';
import { freightQuoteService } from '../../services/freightQuoteService';
import { useActivityLogger } from '../../hooks/useActivityLogger';
import { sapIntegrationService } from '../../services/sapService';

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
  trackingCode?: string;
}


export const Orders: React.FC<{ initialId?: string }> = ({ initialId }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  useActivityLogger('Pedidos', 'Acesso', 'Acessou a gestão de Pedidos');

  const breadcrumbItems = [
    { label: 'Área de trabalho' },
    { label: t('orders.pageTitle'), current: true }
  ];

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    orderId: string | null;
    orderNumber: string | null;
  }>({ isOpen: false, orderId: null, orderNumber: null });
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

  const handleImportLatestSAPOrder = async () => {
    setIsLoading(true);
    setToast(null);
    try {
      const response = await sapIntegrationService.importLatestSAPOrder();
      if (!response.success) {
        setToast({ message: response.error || 'Falha na comunicação com SAP Service Layer', type: 'error' });
      } else {
        setToast({ message: response.message || 'Pedido SAP Importado e Integrado!', type: 'success' });
        await loadOrders();
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Erro inesperado ao reciclar API do SAP.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle initial order navigation from Spotlight
  const [lastOpenedInitialId, setLastOpenedInitialId] = useState<string | null>(null);
  useEffect(() => {
    if (initialId && orders.length > 0 && initialId !== lastOpenedInitialId) {
      setLastOpenedInitialId(initialId);
      handleSingleAction(initialId, 'view-details');
    }
  }, [initialId, orders, lastOpenedInitialId]);

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
        chaveAcesso: order.tracking_code || '',
        serie: order.serie || '',
        trackingCode: order.tracking_code || '',
        freight_results: order.freight_results || []
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

  const handleSelectOrder = (orderId: number | string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrders(prev => [...prev, orderId as any]);
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

  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) {
      setToast({ message: 'Por favor, selecione pelo menos um pedido para realizar esta ação.', type: 'warning' });
      return;
    }
    
    setIsLoading(true);
    
    if (action === 'recalculate') {
       try {
           let successCount = 0;
           for (const orderId of selectedOrders) {
               const orderData = await ordersService.getById(orderId.toString());
               if (!orderData || !orderData.id) continue;
               
               const weight = Number(orderData.weight) || 0;
               const volume_qty = Number(orderData.volume_qty) || 1;
               const cubic_meters = Number(orderData.cubic_meters) || 0;
               const order_value = Number(orderData.order_value) || 0;
               
               if (weight === 0 || order_value === 0) continue;
               
               const destZipCode = orderData.destination_zip_code ? orderData.destination_zip_code.replace(/\D/g, '') : undefined;
               
               try {
                 const results = await freightQuoteService.calculateQuote(
                    {
                       destinationZipCode: destZipCode,
                       weight,
                       volumeQty: volume_qty,
                       cubicMeters: cubic_meters,
                       cargoValue: order_value,
                       selectedModals: ['rodoviario', 'aereo', 'aquaviario', 'ferroviario'] 
                    },
                    user?.supabaseUser?.id,
                    user?.name,
                    user?.email
                 );

                 if (results && results.length > 0) {
                     const bestCarrierId = results[0].carrierId;
                     const finalFreightValue = results[0].totalValue;
                     
                     await ordersService.update(orderData.id, {
                         freight_results: results,
                         best_carrier_id: bestCarrierId,
                         carrier_id: bestCarrierId,
                         freight_value: finalFreightValue
                     });
                     successCount++;
                 }
               } catch (innerError) {
                   console.warn(`Skipping order ${orderData.order_number} due to quote error:`, innerError);
               }
           }
           if (successCount > 0) {
               setToast({ message: `Custo de frete recalculado para ${successCount} pedido(s) com sucesso!`, type: 'success' });
               await loadOrders();
           } else {
               setToast({ message: 'Não foi possível recalcular. Verifique pesos e CEPs de destino.', type: 'error' });
           }
        } catch (error) {
            console.error('Erro ao recalcular em massa:', error);
            setToast({ message: 'Erro ao recalcular custos de frete.', type: 'error' });
        }
        setIsLoading(false);
        setSelectedOrders([]);
        return;
    } else if (action === 'export-excel') {
        // Assume fileExportService (if exists later) or just skip it since it wasn't requested for PDF
        setIsLoading(false);
        setSelectedOrders([]);
        return;
    } else if (action === 'export-pdf' || action === 'download' || action === 'print') {
        try {
            // Precisamos dos dados completos (Order interface completa com items/clientes etc)
            const fullOrdersToPrint = await Promise.all(
                selectedOrders.map(async (id) => {
                    return await ordersService.getById(id.toString());
                })
            );
            
            // Remove nulls
            const validOrders = fullOrdersToPrint.filter(o => !!(o && o.id));
            
            if (validOrders.length === 0) {
                 setToast({ message: 'Não foi possível recuperar os dados completos dos pedidos selecionados.', type: 'error' });
                 setIsLoading(false);
                 setSelectedOrders([]);
                 return;
            }

            if (action === 'export-pdf' || action === 'download') {
                orderPdfService.generateOrderPDF(validOrders as any[], 'download');
            } else {
                const pdfUrl = orderPdfService.generateOrderPDF(validOrders as any[], 'print');
                const printWindow = window.open(pdfUrl, '_blank');
                if (printWindow) {
                    printWindow.onload = () => {
                        printWindow.print();
                    };
                }
            }
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            setToast({ message: 'Erro ao processar impressão/download dos pedidos.', type: 'error' });
        }
        
        setIsLoading(false);
        setSelectedOrders([]);
        return;
    }
    
    // Default mock response for unmapped actions
    setTimeout(() => {
        setIsLoading(false);
        setSelectedOrders([]);
    }, 500);
  };

  const handleSingleAction = async (orderId: number | string, action: string) => {
    const order = orders.find(o => o.id.toString() === orderId.toString());
    if (action === 'recalculate') {
       setIsLoading(true);
       try {
           const orderData = await ordersService.getById(orderId.toString());
           if (!orderData || !orderData.id) throw new Error('Pedido não encontrado no banco');

           const weight = Number(orderData.weight) || 0;
           const volume_qty = Number(orderData.volume_qty) || 1;
           const cubic_meters = Number(orderData.cubic_meters) || 0;
           const order_value = Number(orderData.order_value) || 0;
           
           if (weight === 0 || order_value === 0) {
               throw new Error('Pedido sem peso ou valor. Edite-o e preencha estes dados.');
           }

           const destZipCode = orderData.destination_zip_code ? orderData.destination_zip_code.replace(/\D/g, '') : undefined;

           const results = await freightQuoteService.calculateQuote(
              {
                 destinationZipCode: destZipCode,
                 weight,
                 volumeQty: volume_qty,
                 cubicMeters: cubic_meters,
                 cargoValue: order_value,
                 selectedModals: ['rodoviario', 'aereo', 'aquaviario', 'ferroviario'] 
              },
              user?.supabaseUser?.id,
              user?.name,
              user?.email
           );

           if (results && results.length > 0) {
               const bestCarrierId = results[0].carrierId;
               const finalFreightValue = results[0].totalValue;
               await ordersService.update(orderData.id, {
                   freight_results: results,
                   best_carrier_id: bestCarrierId,
                   carrier_id: bestCarrierId,
                   freight_value: finalFreightValue
               });
               setToast({ message: 'Frete recalculado com sucesso!', type: 'success' });
               await loadOrders();
           } else {
               setToast({ message: 'Nenhuma transportadora atende a esta cotação ou CEP não coberto.', type: 'warning' });
           }
       } catch (error: any) {
           console.error(error);
           setToast({ message: error.message || 'Erro ao recalcular frete.', type: 'error' });
       }
       setIsLoading(false);
       return;
    }

    // Para visualização de detalhes usamos o objeto do banco para carregar os itens
    if (action === 'view-details') {
      setIsLoading(true);
      try {
        const fullOrderData = await ordersService.getById(orderId.toString());
        if (fullOrderData) {
          setSelectedOrder({
            id: fullOrderData.id || '',
            status: fullOrderData.status,
            numero: fullOrderData.order_number,
            dataEmissao: fullOrderData.issue_date,
            dataEntrada: fullOrderData.entry_date,
            dataPrevisaoEntrega: fullOrderData.expected_delivery || '',
            transportador: fullOrderData.carrier_name,
            valorFrete: fullOrderData.freight_value,
            cliente: fullOrderData.customer_name,
            cidadeDestino: fullOrderData.destination_city,
            ufDestino: fullOrderData.destination_state,
            valorPedido: fullOrderData.order_value,
            chaveAcesso: fullOrderData.tracking_code || '',
            serie: fullOrderData.serie || '',
            trackingCode: fullOrderData.tracking_code || '',
            freight_results: fullOrderData.freight_results || [],
            items: fullOrderData.items || []
          });
          setShowDetailsModal(true);
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes do pedido', err);
        setToast({ message: 'Erro ao carregar detalhes do pedido.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    setIsLoading(true);

    try {
      // Para as demais ações, buscamos o objeto completo do banco (com Itens e Relacionamentos)
      const cachedOrder = orders.find(o => o.id === orderId);
      if (!cachedOrder) throw new Error('Pedido não encontrado na base de dados atual.');

      let order: any = cachedOrder;
      
      if (action === 'print' || action === 'download') {
         const fullOrderData = await ordersService.getById(orderId.toString());
         if (!fullOrderData) throw new Error('Falha ao obter detalhamento do pedido para geração do documento.');
         order = fullOrderData;
      }

      switch (action) {
        case 'print':
          const printUrl = orderPdfService.generateOrderPDF([order] as any, 'print');
          const printWindow = window.open(printUrl, '_blank');
          if (printWindow) {
            printWindow.onload = () => printWindow.print();
          }
          break;
        case 'download':
          orderPdfService.generateOrderPDF([order] as any, 'download');
          break;
        case 'delete':
          setConfirmDialog({
            isOpen: true,
            orderId: order.id.toString(),
            orderNumber: order.order_number || order.numero || ''
          });
          break;
        default:
          break;
      }
    } catch (err: any) {
      console.error('Erro na ação single:', err);
      setToast({ message: `Erro ao processar: ${err.message || 'Erro desconhecido.'}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.orderId) return;
    
    setIsLoading(true);
    try {
      const result = await ordersService.delete(confirmDialog.orderId);
      if (result.success) {
        setToast({ message: 'Pedido excluído com sucesso!', type: 'success' });
        await loadOrders();
      } else {
        setToast({ message: result.error || 'Erro ao excluir pedido.', type: 'error' });
      }
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      setToast({ message: 'Erro ao processar exclusão do pedido.', type: 'error' });
    } finally {
      setIsLoading(false);
      setConfirmDialog({ isOpen: false, orderId: null, orderNumber: null });
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('orders.pageTitle')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('orders.pageDescription')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleImportLatestSAPOrder}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            title="Conecta no ERP e traz automaticamente o último Pedido"
          >
            <ShoppingCart size={20} className={isLoading ? 'animate-bounce' : ''} />
            <span>Último Pedido SAP</span>
          </button>
          
          <button
            onClick={() => setShowOrderForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>{t('orders.actions.insertOrder')}</span>
          </button>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? t('orders.actions.loading') : t('orders.actions.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('orders.summary.total')}</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('orders.summary.emitido')}</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('orders.summary.coletado')}</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('orders.summary.em_transito')}</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('orders.summary.saiu_entrega')}</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('orders.summary.entregue')}</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('orders.summary.cancelado')}</p>
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('orders.table.notFound')}</h3>
          <p className="text-gray-600 dark:text-gray-400">{t('orders.table.tryAdjusting')}</p>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl flex items-center space-x-4">
            <RefreshCw size={24} className="text-blue-600 animate-spin" />
            <p className="text-gray-800 dark:text-gray-200 font-medium">{t('orders.actions.processing')}</p>
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={t('orders.dialogs.deleteTitle')}
        message={t('orders.dialogs.deleteMessage', { orderNumber: confirmDialog.orderNumber || '' })}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, orderId: null, orderNumber: null })}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};