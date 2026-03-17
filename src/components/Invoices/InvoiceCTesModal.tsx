import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, FileText, Download, Printer, Search, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';

interface CTe {
  id: number;
  numero: string;
  serie: string;
  dataEmissao: string;
  valor: number;
  status: string;
}

interface InvoiceCTesModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: number;
  invoiceNumber?: string;
}

export const InvoiceCTesModal: React.FC<InvoiceCTesModalProps> = ({
  isOpen,
  onClose,
  invoiceId,
  invoiceNumber
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [ctes, setCtes] = useState<CTe[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && invoiceId) {
      loadCTes();
    } else {
      setCtes([]);
    }
  }, [isOpen, invoiceId]);

  const loadCTes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('ctes')
        .select('*')
        .eq('invoice_id', invoiceId);
        
      if (error) throw error;
      
      if (data) {
        setCtes(data.map((item: any) => ({
          id: item.id,
          numero: item.numero || '',
          serie: item.serie || '',
          dataEmissao: item.data_emissao || new Date().toISOString(),
          valor: Number(item.valor_total || 0),
          status: item.status || 'Pendente'
        })));
      }
    } catch (error) {
      console.error('Error fetching CT-es:', error);
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
    switch (status) {
      case 'Aprovado':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'Reprovado':
        return <XCircle size={16} className="text-red-500" />;
      case 'Pendente':
        return <Clock size={16} className="text-yellow-500" />;
      default:
        return null;
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return 'bg-green-100 text-green-800';
      case 'Reprovado':
        return 'bg-red-100 text-red-800';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <FileText size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">CT-es da Nota Fiscal</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Invoice Info */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nota Fiscal: <span className="font-semibold text-gray-900 dark:text-white">{invoiceNumber}</span>
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
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Carregando CT-es...
                    </td>
                  </tr>
                ) : (
                  filteredCTes.map((cte) => (
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
                )))}
              </tbody>
            </table>
          </div>
          
          {!isLoading && filteredCTes.length === 0 && (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Nenhum CT-e encontrado.</p>
            </div>
          )}
          
          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800 font-medium">Total de CT-es: {ctes.length}</p>
                <p className="text-xs text-blue-700 mt-1">
                  Valor total: {formatCurrency(ctes.reduce((sum, cte) => sum + cte.valor, 0))}
                </p>
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