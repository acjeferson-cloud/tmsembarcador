import React, { useState } from 'react';
import { Search, Filter, Download, Calendar, FileText, AlertTriangle, TrendingDown, BarChart3 } from 'lucide-react';

interface RejectionRecord {
  id: string;
  documentNumber: string;
  documentType: 'CTE' | 'NFE';
  rejectionDate: string;
  rejectionReason: string;
  rejectionCode: string;
  carrier: string;
  origin: string;
  destination: string;
  value: number;
  status: 'Pendente' | 'Corrigido' | 'Cancelado';
}

const mockRejectionData: RejectionRecord[] = [
  {
    id: '1',
    documentNumber: 'CTE-001234',
    documentType: 'CTE',
    rejectionDate: '2024-01-15',
    rejectionReason: 'CNPJ do destinatário inválido',
    rejectionCode: '539',
    carrier: 'Transportadora ABC',
    origin: 'São Paulo - SP',
    destination: 'Rio de Janeiro - RJ',
    value: 1250.00,
    status: 'Corrigido'
  },
  {
    id: '2',
    documentNumber: 'NFE-005678',
    documentType: 'NFE',
    rejectionDate: '2024-01-14',
    rejectionReason: 'Código do produto não encontrado',
    rejectionCode: '215',
    carrier: 'Transportadora XYZ',
    origin: 'Belo Horizonte - MG',
    destination: 'Salvador - BA',
    value: 850.00,
    status: 'Pendente'
  },
  {
    id: '3',
    documentNumber: 'CTE-002468',
    documentType: 'CTE',
    rejectionDate: '2024-01-13',
    rejectionReason: 'Valor do frete incorreto',
    rejectionCode: '402',
    carrier: 'Transportadora DEF',
    origin: 'Porto Alegre - RS',
    destination: 'Curitiba - PR',
    value: 2100.00,
    status: 'Cancelado'
  },
  {
    id: '4',
    documentNumber: 'NFE-007890',
    documentType: 'NFE',
    rejectionDate: '2024-01-12',
    rejectionReason: 'Data de emissão futura',
    rejectionCode: '108',
    carrier: 'Transportadora GHI',
    origin: 'Fortaleza - CE',
    destination: 'Recife - PE',
    value: 675.00,
    status: 'Corrigido'
  },
  {
    id: '5',
    documentNumber: 'CTE-003579',
    documentType: 'CTE',
    rejectionDate: '2024-01-11',
    rejectionReason: 'Inscrição Estadual inválida',
    rejectionCode: '456',
    carrier: 'Transportadora JKL',
    origin: 'Brasília - DF',
    destination: 'Goiânia - GO',
    value: 1800.00,
    status: 'Pendente'
  }
];

const RejectionHistoryReport: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const filteredData = mockRejectionData.filter(record => {
    const matchesSearch = record.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.rejectionReason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.carrier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
    const matchesDocType = selectedDocumentType === 'all' || record.documentType === selectedDocumentType;
    
    return matchesSearch && matchesStatus && matchesDocType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800';
      case 'Corrigido': return 'bg-green-100 text-green-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentTypeColor = (type: string) => {
    return type === 'CTE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  const totalRejections = filteredData.length;
  const pendingRejections = filteredData.filter(r => r.status === 'Pendente').length;
  const correctedRejections = filteredData.filter(r => r.status === 'Corrigido').length;
  const totalValue = filteredData.reduce((sum, record) => sum + record.value, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Histórico de Reprovações
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Acompanhe e analise as reprovações de documentos eletrônicos
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Reprovações</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalRejections}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingRejections}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Corrigidas</p>
              <p className="text-2xl font-bold text-green-600">{correctedRejections}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por documento, motivo ou transportadora..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="Pendente">Pendente</option>
            <option value="Corrigido">Corrigido</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          <select
            value={selectedDocumentType}
            onChange={(e) => setSelectedDocumentType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Tipos</option>
            <option value="CTE">CT-e</option>
            <option value="NFE">NF-e</option>
          </select>

          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data Reprovação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Transportadora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
              {filteredData.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:bg-gray-900">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDocumentTypeColor(record.documentType)}`}>
                        {record.documentType}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {record.documentNumber}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(record.rejectionDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs">
                    <div>
                      <p className="font-medium">{record.rejectionReason}</p>
                      <p className="text-gray-500 dark:text-gray-400">Código: {record.rejectionCode}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {record.carrier}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div>
                      <p>{record.origin}</p>
                      <p className="text-gray-500 dark:text-gray-400">→ {record.destination}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    R$ {record.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhuma reprovação encontrada</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Tente ajustar os filtros para encontrar os registros desejados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RejectionHistoryReport;