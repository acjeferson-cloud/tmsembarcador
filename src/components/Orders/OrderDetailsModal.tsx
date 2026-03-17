import React, { useState } from 'react';
import { X, FileText, Download, Printer, Calendar, Truck, DollarSign, CheckCircle, Clock, User, MapPin, Package, ShoppingCart } from 'lucide-react';
import { QuoteResultsTable } from '../FreightQuote/QuoteResultsTable';
import { orderPdfService } from '../../services/orderPdfService';

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
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'freight'>('details');
  
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
        return 'bg-blue-100 text-blue-800';
      case 'coletado':
        return 'bg-indigo-100 text-indigo-800';
      case 'em_transito':
        return 'bg-blue-300 text-blue-800';
      case 'saiu_entrega':
        return 'bg-orange-100 text-orange-800';
      case 'entregue':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
  
  // Use real items from order
  const items = order.items || [];

  const handlePrint = () => {
    const pdfUrl = orderPdfService.generateOrderPDF([order] as any[], 'print');
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleDownload = () => {
    orderPdfService.generateOrderPDF([order] as any[], 'download');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <ShoppingCart size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalhes do Pedido</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            >
              <Printer size={16} />
              <span>Imprimir Pedido</span>
            </button>
            <button
              onClick={handleDownload}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            >
              <Download size={16} />
              <span>Download Pedido</span>
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
                <span>Detalhes do Pedido</span>
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
                <span>Itens do Pedido</span>
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
                <span>Custos de Frete</span>
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
                  <p className="text-gray-600 dark:text-gray-400">Emissão: {formatDate(order.dataEmissao)} | Previsão de Entrega: {formatDate(order.dataPrevisaoEntrega)}</p>
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
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Básicas</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-blue-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Data de Emissão</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(order.dataEmissao)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-green-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Data de Entrada</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(order.dataEntrada)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-orange-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Previsão de Entrega</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(order.dataPrevisaoEntrega)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FileText className="text-purple-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Chave de Acesso</p>
                          <p className="font-medium text-gray-900 dark:text-white font-mono text-xs break-all">{order.chaveAcesso}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Transportador Info */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações do Transportador</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Truck className="text-blue-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Transportador</p>
                          <p className="font-medium text-gray-900 dark:text-white">{order.transportador}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <DollarSign className="text-green-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Valor do Frete</p>
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
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações do Cliente</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <User className="text-blue-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Cliente</p>
                          <p className="font-medium text-gray-900 dark:text-white">{order.cliente}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="text-red-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Cidade de Destino</p>
                          <p className="font-medium text-gray-900 dark:text-white">{order.cidadeDestino}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="text-purple-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">UF de Destino</p>
                          <p className="font-medium text-gray-900 dark:text-white">{order.ufDestino}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Financial Info */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Financeiras</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="text-green-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Valor do Pedido</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(order.valorPedido)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <DollarSign className="text-blue-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Valor do Frete</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(order.valorFrete)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <DollarSign className="text-purple-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(order.valorPedido + order.valorFrete)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Status Timeline */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Histórico de Status</h4>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    {[
                      { status: 'emitido', label: 'Pedido Emitido', date: '15/01/2025 08:30', active: order.status === 'emitido', completed: ['coletado', 'em_transito', 'saiu_entrega', 'entregue'].includes(order.status) },
                      { status: 'coletado', label: 'Coletado', date: '15/01/2025 14:45', active: order.status === 'coletado', completed: ['em_transito', 'saiu_entrega', 'entregue'].includes(order.status) },
                      { status: 'em_transito', label: 'Em Trânsito', date: '16/01/2025 08:15', active: order.status === 'em_transito', completed: ['saiu_entrega', 'entregue'].includes(order.status) },
                      { status: 'saiu_entrega', label: 'Saiu p/Entrega', date: '17/01/2025 14:00', active: order.status === 'saiu_entrega', completed: ['entregue'].includes(order.status) },
                      { status: 'entregue', label: 'Entregue', date: '17/01/2025 16:45', active: order.status === 'entregue', completed: order.status === 'entregue' }
                    ].map((step, index) => (
                      <div key={index} className="relative flex items-start space-x-4">
                        {/* Timeline dot */}
                        <div className={`
                          relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm
                          ${step.active 
                            ? 'bg-blue-600 text-white' 
                            : step.completed 
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-400'
                          }
                        `}>
                          {step.active ? (
                            <Clock size={20} />
                          ) : step.completed ? (
                            <CheckCircle size={20} />
                          ) : (
                            <Clock size={20} />
                          )}
                        </div>
                        
                        {/* Event content */}
                        <div className="flex-1 min-w-0">
                          <div className={`
                            p-4 rounded-lg border-2 transition-all
                            ${step.active 
                              ? 'border-blue-200 bg-blue-50' 
                              : step.completed 
                                ? 'border-green-200 bg-green-50' 
                                : 'border-gray-200 bg-gray-50'
                            }
                          `}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className={`
                                  font-semibold
                                  ${step.active 
                                    ? 'text-blue-900' 
                                    : step.completed 
                                      ? 'text-green-900' 
                                      : 'text-gray-700'
                                  }
                                `}>
                                  {step.label}
                                </h4>
                              </div>
                              <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                                <div>{step.date}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'items' ? (
            <div className="space-y-6">
              {/* Items Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Itens do Pedido</h4>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Código
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Quantidade
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Valor Unitário
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Valor Total
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total de Itens</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{items.length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Valor dos Itens</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(items.reduce((sum, item) => sum + ((item.total_price || item.valorTotal) || ((item.quantity || item.quantidade || 0) * (item.unit_price || item.valorUnitario || 0))), 0))}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Valor Total do Pedido</p>
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
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Sem custo de frete</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Nenhum custo de frete calculado ou salvo para este pedido.
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