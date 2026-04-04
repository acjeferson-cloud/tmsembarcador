import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, FileText, Download, Printer, Calendar, Truck, DollarSign, CheckCircle, Clock, User, MapPin, Package, ShoppingCart } from 'lucide-react';
import { QuoteResultsTable } from '../FreightQuote/QuoteResultsTable';
import { orderPdfService } from '../../services/orderPdfService';
import { ordersService } from '../../services/ordersService';
import { UnifiedTrackingTimeline } from '../Shared/UnifiedTrackingTimeline';

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
  freight_results?: any[];
  items?: any[];
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'freight'>('details');
  const [isProcessing, setIsProcessing] = useState(false);
  
  if (!isOpen) return null;
  
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
  
  // Use real items from order
  const items = order.items || [];

  const handleDocumentAction = async (action: 'print' | 'download') => {
    setIsProcessing(true);
    try {
      const fullOrderData = await ordersService.getById(order.id.toString());
      if (!fullOrderData) throw new Error('Falha ao obter dados completos do pedido.');

      if (action === 'download') {
        orderPdfService.generateOrderPDF([fullOrderData] as any[], 'download');
      } else {
        const pdfUrl = orderPdfService.generateOrderPDF([fullOrderData] as any[], 'print');
        const printWindow = window.open(pdfUrl, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      }
    } catch (error) {
      alert('Erro ao gerar documento do pedido.');
    } finally {
      setIsProcessing(false);
    }
  };

  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <ShoppingCart size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('orders.details.title')}</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleDocumentAction('print')}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm disabled:opacity-50"
            >
              <Printer size={16} />
              <span>{isProcessing ? t('orders.actions.processing') : t('orders.table.printOrder')}</span>
            </button>
            <button
              onClick={() => handleDocumentAction('download')}
              disabled={isProcessing}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm disabled:opacity-50"
            >
              <Download size={16} />
              <span>{isProcessing ? t('orders.actions.processing') : t('orders.table.downloadOrder')}</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText size={16} />
                <span>{t('orders.details.tabs.details')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'items'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Package size={16} />
                <span>{t('orders.details.tabs.items')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('freight')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'freight'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Truck size={16} />
                <span>{t('orders.details.tabs.freight')}</span>
              </div>
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Header with Status */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{order.numero}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{t('orders.table.issueDate')}: {formatDate(order.dataEmissao)} | {t('orders.table.expectedDate')}: {formatDate(order.dataPrevisaoEntrega)}</p>
                </div>
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              
              {/* Main Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('orders.details.basicInfo')}</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-blue-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.table.issueDate')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(order.dataEmissao)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-green-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.table.entryDate')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(order.dataEntrada)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-orange-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.table.expectedDate')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(order.dataPrevisaoEntrega)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FileText className="text-purple-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.form.accessKey')}</p>
                          <p className="font-medium text-gray-900 dark:text-white font-mono text-xs break-all">{order.chaveAcesso}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Transportador Info */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('orders.details.carrierInfo')}</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Truck className="text-blue-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.table.carrier')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{order.transportador}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <DollarSign className="text-green-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.table.freightValue')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(order.valorFrete)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                  {/* Cliente Info */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('orders.details.customerInfo')}</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <User className="text-blue-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.table.customer')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{order.cliente}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="text-red-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.table.destCity')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{order.cidadeDestino}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="text-purple-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.table.destState')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{order.ufDestino}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Financial Info */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('orders.details.financialInfo')}</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="text-green-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.table.orderValue')}</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(order.valorPedido)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <DollarSign className="text-blue-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.table.freightValue')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(order.valorFrete)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <DollarSign className="text-purple-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.form.totalPrice')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(order.valorPedido + order.valorFrete)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Status Timeline */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('orders.details.timeline')}</h4>
                <UnifiedTrackingTimeline 
                  documentType="order" 
                  documentValue={order.numero} 
                  documentObj={order}
                />
              </div>
            </div>
          ) : activeTab === 'items' ? (
            <div className="space-y-6">
              {/* Items Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t('orders.details.itemsTitle')}</h4>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('orders.details.columns.code')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('orders.details.columns.description')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('orders.details.columns.quantity')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('orders.details.columns.unitValue')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('orders.details.columns.totalValue')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                      {items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-gray-50 dark:bg-gray-900">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {item.product_code || item.codigo || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {item.product_description || item.descricao || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {item.quantity || item.quantidade || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {formatCurrency(item.unit_price || item.valorUnitario || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {formatCurrency((item.total_price || item.valorTotal) || ((item.quantity || item.quantidade || 0) * (item.unit_price || item.valorUnitario || 0)))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('orders.details.summary.totalItems')}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{items.length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('orders.details.summary.itemsValue')}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(items.reduce((sum, item) => sum + ((item.total_price || item.valorTotal) || ((item.quantity || item.quantidade || 0) * (item.unit_price || item.valorUnitario || 0))), 0))}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('orders.details.summary.totalOrderValue')}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(items.reduce((sum, item) => sum + ((item.total_price || item.valorTotal) || ((item.quantity || item.quantidade || 0) * (item.unit_price || item.valorUnitario || 0))), 0) + (order.valorFrete || 0))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'freight' ? (
            <div className="space-y-6">
              {order.freight_results && order.freight_results.length > 0 ? (
                <QuoteResultsTable results={order.freight_results} cargoValue={order.valorPedido} />
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
                  <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{t('orders.details.noFreight')}</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    {t('orders.details.noFreightDesc')}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};