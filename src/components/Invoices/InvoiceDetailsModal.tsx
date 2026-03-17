import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Printer, Calendar, Truck, DollarSign, CheckCircle, XCircle, Clock, Eye, RefreshCw, ThumbsUp, ThumbsDown, Clock as ArrowClockwise, User, MapPin, Building, Receipt, Loader, Package, Hash, Scale } from 'lucide-react';
import { QuoteResultsTable } from '../FreightQuote/QuoteResultsTable';
import { supabase } from '../../lib/supabase';

interface Invoice {
  id: number;
  status: string;
  baseCusto: string;
  statusColeta: string;
  serie: string;
  numero: string;
  dataEmissao: string;
  dataEntrada: string;
  transportador: string;
  cliente: string;
  cidadeDestino: string;
  ufDestino: string;
  valorNFe: number;
  chaveAcesso: string;
  peso?: number;
  volumes?: number;
  naturezaOperacao?: string;
  numeroPedido?: string;
  pisValue?: number;
  cofinsValue?: number;
  icmsValue?: number;
  tipoNota?: string;
  previsaoEntrega?: string;
  freight_results?: any[];
}

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  isOpen,
  onClose,
  invoice
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'costs' | 'ctes'>('details');
  const [customer, setCustomer] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'details') {
      loadInvoiceDetails();
    }
  }, [isOpen, activeTab, invoice.id]);

  const loadInvoiceDetails = async () => {
    setIsLoadingDetails(true);
    try {
      const { data, error } = await supabase
        .from('invoices_nfe')
        .select(`
          *,
          customer:invoices_nfe_customers(*),
          products:invoices_nfe_products(*)
        `)
        .eq('id', invoice.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCustomer(data.customer?.[0] || null);
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes da nota fiscal:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (!isOpen) return null;
  
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  
  // Format currency
  const formatCurrency = (value: number | undefined | null) => {
    if (value == null || isNaN(value)) return 'R$ 0,00';
    return Number(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'emitida':
        return 'bg-gray-100 text-gray-800';
      case 'coletada':
        return 'bg-blue-100 text-blue-800';
      case 'em_transito_origem':
        return 'bg-blue-200 text-blue-800';
      case 'em_transito_rota':
        return 'bg-blue-300 text-blue-800';
      case 'chegada_destino':
        return 'bg-orange-100 text-orange-800';
      case 'saiu_entrega':
        return 'bg-orange-200 text-orange-800';
      case 'entregue':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'emitida':
        return 'Emitida';
      case 'coletada':
        return 'Coletada';
      case 'em_transito_origem':
        return 'Em Trânsito - Origem';
      case 'em_transito_rota':
        return 'Em Trânsito - Rota';
      case 'chegada_destino':
        return 'Chegada Destino';
      case 'saiu_entrega':
        return 'Saiu p/ Entrega';
      case 'entregue':
        return 'Entregue';
      default:
        return status;
    }
  };
  
  // Get base custo label
  const getBaseCustoLabel = (baseCusto: string) => {
    switch (baseCusto) {
      case 'tabela':
        return 'Tabela de Frete';
      case 'negociacao':
        return 'Negociação Individual';
      default:
        return baseCusto;
    }
  };
  
  // Get status coleta label
  const getStatusColetaLabel = (statusColeta: string) => {
    switch (statusColeta) {
      case 'disponivel':
        return 'Disponível para Coleta';
      case 'realizada':
        return 'Coleta Realizada';
      default:
        return statusColeta;
    }
  };
  
  // Generate mock CT-es for the invoice
  const mockCTes = Array.from({ length: 3 }, (_, i) => ({
    id: i + 1,
    numero: (Math.floor(Math.random() * 9000) + 1000).toString(),
    serie: Math.floor(Math.random() * 10).toString(),
    dataEmissao: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    valor: Math.floor(Math.random() * 2000) + 200,
    status: ['Aprovado', 'Reprovado', 'Pendente'][Math.floor(Math.random() * 3)]
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <FileText size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalhes da Nota Fiscal</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            >
              <Printer size={16} />
              <span>Imprimir DANFE</span>
            </button>
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            >
              <Download size={16} />
              <span>Download XML</span>
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
                <span>Detalhes da Nota Fiscal</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('costs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'costs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Receipt size={16} />
                <span>Custos de Frete</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('ctes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'ctes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Truck size={16} />
                <span>CT-es Vinculados</span>
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
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{invoice.numero}</h3>
                  <p className="text-gray-600 dark:text-gray-400">Série: {invoice.serie} | Emissão: {formatDate(invoice.dataEmissao)}</p>
                </div>
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                  {getStatusLabel(invoice.status)}
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
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(invoice.dataEmissao)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-green-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Data de Entrada</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(invoice.dataEntrada)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FileText className="text-purple-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Chave de Acesso</p>
                          <p className="font-medium text-gray-900 dark:text-white font-mono text-xs break-all">{invoice.chaveAcesso}</p>
                        </div>
                      </div>
                      {invoice.tipoNota && (
                        <div className="flex items-center space-x-3">
                          <FileText className="text-indigo-500 flex-shrink-0" size={20} />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Tipo da Nota</p>
                            <p className="font-medium text-gray-900 dark:text-white">{invoice.tipoNota}</p>
                          </div>
                        </div>
                      )}
                      {invoice.naturezaOperacao && (
                        <div className="flex items-center space-x-3">
                          <Receipt className="text-teal-500 flex-shrink-0" size={20} />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Natureza da Operação</p>
                            <p className="font-medium text-gray-900 dark:text-white">{invoice.naturezaOperacao}</p>
                          </div>
                        </div>
                      )}
                      {invoice.numeroPedido && (
                        <div className="flex items-center space-x-3">
                          <Hash className="text-amber-500 flex-shrink-0" size={20} />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Número do Pedido</p>
                            <p className="font-medium text-gray-900 dark:text-white">{invoice.numeroPedido}</p>
                          </div>
                        </div>
                      )}
                      {invoice.previsaoEntrega && (
                        <div className="flex items-center space-x-3">
                          <Calendar className="text-rose-500 flex-shrink-0" size={20} />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Previsão de Entrega</p>
                            <p className="font-medium text-gray-900 dark:text-white">{formatDate(invoice.previsaoEntrega)}</p>
                          </div>
                        </div>
                      )}
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
                          <p className="font-medium text-gray-900 dark:text-white">{invoice.transportador}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <DollarSign className="text-green-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Base para Custo</p>
                          <p className="font-medium text-gray-900 dark:text-white">{getBaseCustoLabel(invoice.baseCusto)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Truck className="text-orange-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Status da Coleta</p>
                          <p className="font-medium text-gray-900 dark:text-white">{getStatusColetaLabel(invoice.statusColeta)}</p>
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
                          <p className="font-medium text-gray-900 dark:text-white">{invoice.cliente}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="text-red-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Cidade de Destino</p>
                          <p className="font-medium text-gray-900 dark:text-white">{invoice.cidadeDestino}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="text-purple-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">UF de Destino</p>
                          <p className="font-medium text-gray-900 dark:text-white">{invoice.ufDestino}</p>
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
                        <div className="w-full">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total da NF-e</p>
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(invoice.valorNFe)}</p>
                        </div>
                      </div>
                      {(invoice.icmsValue || invoice.pisValue || invoice.cofinsValue) && (
                        <div className="pt-3 border-t border-gray-300 space-y-2">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tributos</p>
                          {invoice.icmsValue !== undefined && invoice.icmsValue > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">ICMS</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(invoice.icmsValue)}</span>
                            </div>
                          )}
                          {invoice.pisValue !== undefined && invoice.pisValue > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">PIS</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(invoice.pisValue)}</span>
                            </div>
                          )}
                          {invoice.cofinsValue !== undefined && invoice.cofinsValue > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">COFINS</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(invoice.cofinsValue)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cargo Info */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações de Carga</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Scale className="text-orange-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Peso Total</p>
                          <p className="font-medium text-gray-900 dark:text-white">{invoice.peso ? `${invoice.peso.toFixed(3)} kg` : 'Não informado'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Package className="text-blue-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Volumes</p>
                          <p className="font-medium text-gray-900 dark:text-white">{invoice.volumes || 'Não informado'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              {customer && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Building className="mr-2 text-blue-600" size={20} />
                    Dados Completos do Cliente
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Razão Social / Nome</p>
                      <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">CNPJ</p>
                      <p className="font-medium text-gray-900 dark:text-white">{customer.cnpj}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">CEP</p>
                      <p className="font-medium text-gray-900 dark:text-white">{customer.zip_code}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Endereço</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {customer.address}, {customer.number} - {customer.neighborhood}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Cidade / UF</p>
                      <p className="font-medium text-gray-900 dark:text-white">{customer.city} / {customer.state}</p>
                    </div>
                    {customer.phone && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Telefone</p>
                        <p className="font-medium text-gray-900 dark:text-white">{customer.phone}</p>
                      </div>
                    )}
                    {customer.email && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">E-mail</p>
                        <p className="font-medium text-gray-900 dark:text-white">{customer.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Products Table */}
              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader size={32} className="animate-spin text-blue-600" />
                </div>
              ) : products.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <Package className="mr-2 text-blue-600" size={20} />
                      Produtos da Nota Fiscal ({products.length} {products.length === 1 ? 'item' : 'itens'})
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantidade</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unidade</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Unit.</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Total</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">NCM</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{product.item_order}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-mono">{product.product_code}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs">{product.description}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white font-medium">
                              {Number(product.quantity || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-400">{product.unit}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                              {formatCurrency(product.unit_value)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(product.total_value)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-400 font-mono">
                              {product.ncm || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <td colSpan={6} className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">
                            Total dos Produtos:
                          </td>
                          <td className="px-4 py-3 text-right text-lg font-bold text-green-600">
                            {formatCurrency(products.reduce((sum, p) => sum + p.total_value, 0))}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : !isLoadingDetails ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3">
                    <Package className="text-yellow-600" size={24} />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Nenhum produto encontrado</p>
                      <p className="text-xs text-yellow-600 mt-1">Esta nota fiscal não possui produtos cadastrados.</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Status Timeline */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Histórico de Status</h4>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    {[
                      { status: 'emitida', label: 'Nota Fiscal Emitida', date: '15/01/2025 08:30', active: invoice.status === 'emitida', completed: true },
                      { status: 'coletada', label: 'Coletada pela Transportadora', date: '15/01/2025 14:45', active: invoice.status === 'coletada', completed: ['coletada', 'em_transito_origem', 'em_transito_rota', 'chegada_destino', 'saiu_entrega', 'entregue'].includes(invoice.status) },
                      { status: 'em_transito_origem', label: 'Em Trânsito - Saindo da Origem', date: '15/01/2025 16:20', active: invoice.status === 'em_transito_origem', completed: ['em_transito_origem', 'em_transito_rota', 'chegada_destino', 'saiu_entrega', 'entregue'].includes(invoice.status) },
                      { status: 'em_transito_rota', label: 'Em Trânsito na Rodovia', date: '16/01/2025 08:15', active: invoice.status === 'em_transito_rota', completed: ['em_transito_rota', 'chegada_destino', 'saiu_entrega', 'entregue'].includes(invoice.status) },
                      { status: 'chegada_destino', label: 'Chegada na Cidade de Destino', date: '17/01/2025 10:30', active: invoice.status === 'chegada_destino', completed: ['chegada_destino', 'saiu_entrega', 'entregue'].includes(invoice.status) },
                      { status: 'saiu_entrega', label: 'Saiu para Entrega', date: '17/01/2025 14:00', active: invoice.status === 'saiu_entrega', completed: ['saiu_entrega', 'entregue'].includes(invoice.status) },
                      { status: 'entregue', label: 'Entregue', date: '17/01/2025 16:45', active: invoice.status === 'entregue', completed: ['entregue'].includes(invoice.status) }
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
```
                </div>
              </div>
            </div>
          ) : activeTab === 'costs' ? (
            <div className="space-y-6">
              <QuoteResultsTable results={invoice.freight_results || []} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* CT-es Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">CT-es Vinculados à Nota Fiscal</h4>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Número
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Série
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Data Emissão
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Valor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                      {mockCTes.map((cte) => (
                        <tr key={cte.id} className="hover:bg-gray-50 dark:bg-gray-900">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {cte.numero}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {cte.serie}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(cte.dataEmissao)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {formatCurrency(cte.valor)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              cte.status === 'Aprovado' ? 'bg-green-100 text-green-800' : 
                              cte.status === 'Reprovado' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {cte.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Visualizar
                              </button>
                            </div>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total de CT-es</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{mockCTes.length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Valor Total</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(mockCTes.reduce((sum, cte) => sum + cte.valor, 0))}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Valor Médio</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(mockCTes.reduce((sum, cte) => sum + cte.valor, 0) / mockCTes.length)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};