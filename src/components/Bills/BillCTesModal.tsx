import React, { useState, useEffect } from 'react';
import { billsService } from '../../services/billsService';
import { X, FileText, Download, Printer, Search, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';

interface CTe {
  id: number;
  numero: string;
  serie: string;
  dataEmissao: string;
  valor: number;
  valorCusto: number;
  status: string;
}

interface BillCTesModalProps {
  isOpen: boolean;
  onClose: () => void;
  billId?: string | number;
  billNumber?: string;
}

export const BillCTesModal: React.FC<BillCTesModalProps> = ({
  isOpen,
  onClose,
  billId,
  billNumber
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ctes, setCtes] = useState<CTe[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && billId) {
      loadLinkedCtes();
    } else {
      setCtes([]);
    }
  }, [isOpen, billId]);

  const loadLinkedCtes = async () => {
    try {
      setIsLoading(true);
      const data = await billsService.getLinkedCtes(billId!.toString());
      
      const formattedCtes = data.map((link: any) => {
        const cte = link.ctes_complete;
        
        // Calcula o Valor Custo da mesma forma que a tela principal de CT-es
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
// console.error('Erro ao buscar CT-es:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter CT-es based on search term
  const filteredCTes = ctes.filter(cte => 
    cte.numero.includes(searchTerm)
  );
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('aprovado') || s.includes('normal')) return <CheckCircle size={16} className="text-green-500" />;
    if (s.includes('reprovado') || s.includes('cancelado')) return <XCircle size={16} className="text-red-500" />;
    if (s.includes('pendente')) return <Clock size={16} className="text-yellow-500" />;
    return <CheckCircle size={16} className="text-gray-500" />; // fallback
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('aprovado') || s.includes('normal')) return 'bg-green-100 text-green-800';
    if (s.includes('reprovado') || s.includes('cancelado')) return 'bg-red-100 text-red-800';
    if (s.includes('pendente')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  // Calculate difference percentage
  const calculateDifference = (cte: CTe) => {
    if (cte.valor === 0 || cte.valorCusto === 0) return 0;
    return ((cte.valor - cte.valorCusto) / cte.valorCusto) * 100;
  };

  // Get value comparison color
  const getValueComparisonColor = (cte: CTe) => {
    if (cte.valor === cte.valorCusto) return 'text-green-600';
    
    const diff = calculateDifference(cte);
    if (diff === 0) return 'text-green-600';
    
    // Assuming a tolerance of ±5%
    if (Math.abs(diff) <= 5) return 'text-yellow-600';
    return 'text-red-600 dark:text-red-400';
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <FileText size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">CT-es da Fatura</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Bill Info */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fatura: <span className="font-semibold text-gray-900 dark:text-white">{billNumber}</span>
            </p>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por número de CT-e..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          
          {/* CT-es Table */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
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
                    Valor CT-e
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor Custo
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
                ) : filteredCTes.map((cte) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(cte.valor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col">
                        <span className={`font-medium ${getValueComparisonColor(cte)}`}>
                          {formatCurrency(cte.valorCusto)}
                        </span>
                        {cte.valorCusto > 0 && (
                          <span className={`text-xs ${getValueComparisonColor(cte)}`}>
                            {calculateDifference(cte) > 0 ? '+' : ''}{calculateDifference(cte).toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusColor(cte.status)}`}>
                        {getStatusIcon(cte.status)}
                        <span className="ml-1">{cte.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Visualizar DACTE"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Download XML"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                          title="Consultar na SEFAZ"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCTes.length === 0 && (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Nenhum CT-e encontrado.</p>
            </div>
          )}
          
          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-12">
                <div>
                  <p className="text-sm text-blue-800 font-medium dark:text-blue-300">Total de CT-es: {ctes.length}</p>
                  <p className="text-sm font-bold text-blue-700 mt-1 dark:text-blue-400">
                    Valor CT-e: {formatCurrency(ctes.reduce((sum, cte) => sum + cte.valor, 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-800 font-medium opacity-0">Espacador</p>
                  <p className="text-sm font-bold text-green-700 mt-1 dark:text-green-400">
                    Valor Custo: {formatCurrency(ctes.reduce((sum, cte) => sum + cte.valorCusto, 0))}
                  </p>
                </div>
              </div>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Exportar Lista
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};