import React, { useState } from 'react';
import { X, FileText, Download, Printer, Calendar, Truck, DollarSign, CheckCircle, XCircle, Clock, Eye, RefreshCw, ThumbsUp, ThumbsDown, Clock as ArrowClockwise } from 'lucide-react';
import { billsService } from '../../services/billsService';

interface Bill {
  id: number;
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

interface BillDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill;
}

export const BillDetailsModal: React.FC<BillDetailsModalProps> = ({
  isOpen,
  onClose,
  bill
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'ctes'>('details');
  
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
      case 'Importada':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100';
      case 'Auditada e aprovada':
        return 'bg-green-600 text-white dark:bg-green-700 dark:text-green-50';
      case 'Auditada e reprovada':
        return 'bg-orange-600 text-white dark:bg-orange-700 dark:text-orange-50';
      case 'Com NF-e Referenciada':
        return 'bg-indigo-600 text-white dark:bg-indigo-700 dark:text-indigo-50';
      case 'Cancelada':
        return 'bg-red-600 text-white dark:bg-red-700 dark:text-red-50';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    return status;
  };
  
  // Calculate difference percentage
  const calculateDifference = () => {
    if (bill.valorCTes === 0 || bill.valorCusto === 0) return 0;
    return ((bill.valorCTes - bill.valorCusto) / bill.valorCusto) * 100;
  };
  
  // Get value comparison color
  const getValueComparisonColor = () => {
    if (bill.valorCTes === bill.valorCusto) return 'text-green-600';
    
    const diff = calculateDifference();
    if (diff === 0) return 'text-green-600';
    
    // Assuming a tolerance of ±5%
    if (Math.abs(diff) <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Generate real CT-es for the bill
  const [ctes, setCtes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    const loadLinkedCtes = async () => {
      try {
        setIsLoading(true);
        const data = await billsService.getLinkedCtes(bill.id.toString());
        
        const formattedCtes = data.map((link: any) => {
          const cte = link.ctes_complete;
          let valorCustoCalculado = 0;
          if (cte && cte.carrier_costs && cte.carrier_costs.length > 0) {
            const icmsBaseCost = cte.carrier_costs.find((c: any) => c.cost_type === 'icms_base');
            if (icmsBaseCost) {
              valorCustoCalculado = parseFloat(icmsBaseCost.cost_value || '0');
            }
          }
          return {
            id: link.id,
            numero: link.cte_number || (cte ? cte.number : 'N/A'),
            serie: link.cte_series || (cte ? cte.series : '-'),
            dataEmissao: cte?.issue_date || new Date().toISOString(),
            valor: cte ? parseFloat(cte.total_value || 0) : 0,
            valorCusto: valorCustoCalculado,
            status: cte ? cte.status : 'Desconhecido'
          };
        });
        
        setCtes(formattedCtes);
      } catch (error) {
// /*log_removed*/
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && activeTab === 'ctes') {
      loadLinkedCtes();
    }
  }, [isOpen, activeTab, bill.id]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <FileText size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalhes da Fatura</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            >
              <Printer size={16} />
              <span>Imprimir DACTE</span>
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
                <span>Detalhes da Fatura</span>
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
                <span>CT-es da Fatura ({bill.cteCount})</span>
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
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{bill.numero}</h3>
                  <p className="text-gray-600 dark:text-gray-400">Emissão: {formatDate(bill.dataEmissao)} | Vencimento: {formatDate(bill.dataVencimento)}</p>
                </div>
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                  {getStatusLabel(bill.status)}
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
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(bill.dataEmissao)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-red-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Data de Vencimento</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(bill.dataVencimento)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-green-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Data de Entrada</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(bill.dataEntrada)}</p>
                        </div>
                      </div>
                      {bill.dataAprovacao && (
                        <div className="flex items-center space-x-3">
                          <Calendar className="text-purple-500 flex-shrink-0" size={20} />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Data de Aprovação</p>
                            <p className="font-medium text-gray-900 dark:text-white">{formatDate(bill.dataAprovacao)}</p>
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
                          <p className="font-medium text-gray-900 dark:text-white">{bill.transportador}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FileText className="text-green-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">CT-es Vinculados</p>
                          <p className="font-medium text-gray-900 dark:text-white">{bill.cteCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                  {/* Financial Info */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Financeiras</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="text-blue-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Valor do(s) CT-e(s)</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(bill.valorCTes)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <DollarSign className="text-red-500 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Valor de Desconto</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(bill.valorDesconto)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <DollarSign className={`flex-shrink-0 ${getValueComparisonColor()}`} size={20} />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Valor de Custo</p>
                          <p className={`font-medium ${getValueComparisonColor()}`}>
                            {formatCurrency(bill.valorCusto)}
                            <span className="text-xs ml-2">
                              ({calculateDifference().toFixed(2)}% de diferença)
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Info */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status da Fatura</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        {bill.status === 'auditada_aprovada' ? (
                          <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                        ) : bill.status === 'auditada_reprovada' ? (
                          <XCircle className="text-red-500 flex-shrink-0" size={20} />
                        ) : (
                          <Clock className="text-yellow-500 flex-shrink-0" size={20} />
                        )}
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Status Atual</p>
                          <p className="font-medium text-gray-900 dark:text-white">{getStatusLabel(bill.status)}</p>
                        </div>
                      </div>
                      
                      {/* Conditional actions based on status */}
                      <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-wrap gap-2">
                          {bill.status !== 'auditada_aprovada' && (
                            <>
                              <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded flex items-center space-x-1">
                                <RefreshCw size={14} />
                                <span>Recalcular</span>
                              </button>
                              <button className="px-3 py-1 bg-green-600 text-white text-sm rounded flex items-center space-x-1">
                                <ThumbsUp size={14} />
                                <span>Aprovar</span>
                              </button>
                              <button className="px-3 py-1 bg-red-600 text-white text-sm rounded flex items-center space-x-1">
                                <ThumbsDown size={14} />
                                <span>Reprovar</span>
                              </button>
                            </>
                          )}
                          
                          {(bill.status === 'auditada_aprovada' || bill.status === 'auditada_reprovada') && (
                            <button className="px-3 py-1 bg-yellow-600 text-white text-sm rounded flex items-center space-x-1">
                              <ArrowClockwise size={14} />
                              <span>Estornar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Comparison Summary */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">Resumo da Conciliação</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800 font-medium">Valor do(s) CT-e(s)</p>
                    <p className="text-xl font-bold text-blue-900">{formatCurrency(bill.valorCTes)}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800 font-medium">Valor de Custo</p>
                    <p className={`text-xl font-bold ${getValueComparisonColor()}`}>{formatCurrency(bill.valorCusto)}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800 font-medium">Diferença</p>
                    <p className={`text-xl font-bold ${getValueComparisonColor()}`}>
                      {formatCurrency(bill.valorCTes - bill.valorCusto)}
                      <span className="text-sm ml-2">({calculateDifference().toFixed(2)}%)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* CT-es Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">CT-es Vinculados à Fatura</h4>
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
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4">Carregando CT-es...</td>
                        </tr>
                      ) : ctes.map((cte) => (
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
                              cte.status.includes('Aprovado') ? 'bg-green-100 text-green-800' : 
                              cte.status.includes('Reprovado') || cte.status.includes('Cancelado') ? 'bg-red-100 text-red-800' : 
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
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{bill.cteCount}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Valor Total</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(bill.valorCTes)}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Valor Médio</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(bill.valorCTes / bill.cteCount)}
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