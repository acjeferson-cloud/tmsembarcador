import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Calendar, 
  Filter, 
  RefreshCw, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  BarChart3,
  Truck,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  MapPin
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CTEAuditReportProps {
  onBack: () => void;
}

export const CTEAuditReport: React.FC<CTEAuditReportProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    transportador: '',
    statusAuditoria: '',
    uf: '',
    numeroCte: ''
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [reportData, setReportData] = useState<any[]>([]);
  
  // Generate mock data for the report
  useEffect(() => {
    generateMockData();
  }, [appliedFilters]);

  const generateMockData = () => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const data = [];
      
      // Generate between 10-30 rows of mock data
      const rowCount = Math.floor(Math.random() * 20) + 10;
      
      for (let i = 0; i < rowCount; i++) {
        const status = ['Aprovado', 'Reprovado', 'Dentro da Tolerância'][Math.floor(Math.random() * 3)];
        const valorCTe = (Math.random() * 5000 + 500).toFixed(2);
        const valorCusto = (parseFloat(valorCTe) * (Math.random() * 0.2 + 0.9)).toFixed(2);
        const diferenca = (((parseFloat(valorCTe) / parseFloat(valorCusto)) - 1) * 100).toFixed(2);
        
        const row = {
          'Nº CT-e': `${Math.floor(Math.random() * 9000) + 1000}`,
          'Série': `${Math.floor(Math.random() * 10)}`,
          'Data de emissão': new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('pt-BR'),
          'Transportador': ['Transportadora ABC', 'Logística XYZ', 'Express Transportes', 'Rápido Entregas'][Math.floor(Math.random() * 4)],
          'UF de destino': ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS'][Math.floor(Math.random() * 6)],
          'Valor do CT-e (XML)': valorCTe,
          'Valor de custo (TMS)': valorCusto,
          'Diferença (%)': `${diferenca}%`,
          'Status da auditoria': status,
          'Motivo da Reprovação': status === 'Reprovado' ? 
            ['Valor acima do permitido', 'Transportador não autorizado', 'Rota incorreta'][Math.floor(Math.random() * 3)] : 
            '-',
          'Nome do usuário': ['João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Pereira'][Math.floor(Math.random() * 4)]
        };
        
        data.push(row);
      }
      
      setReportData(data);
      setIsLoading(false);
      setLastUpdated(new Date());
    }, 1500);
  };

  const handleApplyFilters = (filters: Record<string, any>) => {
    setAppliedFilters(filters);
    // This will trigger the useEffect to regenerate mock data
  };

  const handleExportExcel = () => {
    alert('Exportação para Excel iniciada. O arquivo será baixado em breve.');
  };

  const handleExportPDF = () => {
    alert('Exportação para PDF iniciada. O arquivo será baixado em breve.');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    generateMockData();
  };

  // Process data for charts
  const processChartData = () => {
    // Count status distribution
    const statusCounts: Record<string, number> = {};
    
    reportData.forEach(row => {
      const status = row['Status da auditoria'];
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    
    // Group by transportador for bar chart
    const transportadorData: Record<string, any> = {};
    
    reportData.forEach(row => {
      const transportador = row['Transportador'];
      const status = row['Status da auditoria'];
      
      if (!transportadorData[transportador]) {
        transportadorData[transportador] = {
          name: transportador,
          Aprovado: 0,
          Reprovado: 0,
          'Dentro da Tolerância': 0
        };
      }
      
      transportadorData[transportador][status]++;
    });
    
    const barData = Object.values(transportadorData);
    
    return { barData, pieData };
  };

  const { barData, pieData } = processChartData();
  
  // Colors for charts
  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

  // Fields for the report
  const reportFields = [
    'Nº CT-e', 'Série', 'Data de emissão', 'Transportador', 'UF de destino',
    'Valor do CT-e (XML)', 'Valor de custo (TMS)', 'Diferença (%)',
    'Status da auditoria', 'Motivo da Reprovação', 'Nome do usuário'
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Voltar para Relatórios</span>
          </button>
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatório de Auditoria de CT-es</h1>
            <p className="text-gray-600 dark:text-gray-400">Apresenta o resultado das auditorias automáticas realizadas sobre os CT-es importados</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
          >
            <Download size={16} />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
          >
            <Download size={16} />
            <span>PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
          >
            <Printer size={16} />
            <span>Imprimir</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Carregando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h2>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
          >
            {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        
        {showFilters && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Period Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>Período</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    name="startDate"
                    value={appliedFilters.startDate || ''}
                    onChange={(e) => setAppliedFilters({...appliedFilters, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <span className="flex items-center text-gray-500 dark:text-gray-400">a</span>
                  <input
                    type="date"
                    name="endDate"
                    value={appliedFilters.endDate || ''}
                    onChange={(e) => setAppliedFilters({...appliedFilters, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Carrier Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                  <Truck size={16} />
                  <span>Transportador</span>
                </label>
                <select
                  name="transportador"
                  value={appliedFilters.transportador || ''}
                  onChange={(e) => setAppliedFilters({...appliedFilters, transportador: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Todos os Transportadores</option>
                  <option value="Transportadora ABC">Transportadora ABC</option>
                  <option value="Logística XYZ">Logística XYZ</option>
                  <option value="Express Transportes">Express Transportes</option>
                  <option value="Rápido Entregas">Rápido Entregas</option>
                </select>
              </div>

              {/* Audit Status Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                  <AlertTriangle size={16} />
                  <span>Status da Auditoria</span>
                </label>
                <select
                  name="statusAuditoria"
                  value={appliedFilters.statusAuditoria || ''}
                  onChange={(e) => setAppliedFilters({...appliedFilters, statusAuditoria: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Todos os Status</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Reprovado">Reprovado</option>
                  <option value="Dentro da Tolerância">Dentro da Tolerância</option>
                </select>
              </div>

              {/* UF Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                  <MapPin size={16} />
                  <span>UF</span>
                </label>
                <select
                  name="uf"
                  value={appliedFilters.uf || ''}
                  onChange={(e) => setAppliedFilters({...appliedFilters, uf: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Todas as UFs</option>
                  <option value="SP">SP</option>
                  <option value="RJ">RJ</option>
                  <option value="MG">MG</option>
                  <option value="PR">PR</option>
                  <option value="SC">SC</option>
                  <option value="RS">RS</option>
                </select>
              </div>

              {/* CT-e Number Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                  <FileText size={16} />
                  <span>Nº CT-e</span>
                </label>
                <input
                  type="text"
                  name="numeroCte"
                  value={appliedFilters.numeroCte || ''}
                  onChange={(e) => setAppliedFilters({...appliedFilters, numeroCte: e.target.value})}
                  placeholder="Digite o número do CT-e"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setAppliedFilters({
                  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0],
                  transportador: '',
                  statusAuditoria: '',
                  uf: '',
                  numeroCte: ''
                })}
                className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors text-sm"
              >
                Limpar Filtros
              </button>
              <button
                onClick={() => handleApplyFilters(appliedFilters)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Last Updated Info */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Calendar size={16} />
          <span>Última atualização: {lastUpdated.toLocaleString('pt-BR')}</span>
        </div>
        <div className="text-gray-600 dark:text-gray-400">
          {reportData.length} registros encontrados
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <BarChart3 size={18} className="text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gráficos</h2>
          </div>
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
          >
            {showCharts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        
        {showCharts && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Distribuição de Status por Transportador</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Aprovado" fill="#10B981" />
                      <Bar dataKey="Reprovado" fill="#EF4444" />
                      <Bar dataKey="Dentro da Tolerância" fill="#F59E0B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Distribuição Geral de Status</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}`, 'Quantidade']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="mt-8 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Resumo Estatístico</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <p className="text-sm text-green-800 font-medium">Total Aprovados</p>
                  <p className="text-xl font-bold text-green-600">
                    {reportData.filter(row => row['Status da auditoria'] === 'Aprovado').length}
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                  <p className="text-sm text-red-800 font-medium">Total Reprovados</p>
                  <p className="text-xl font-bold text-red-600">
                    {reportData.filter(row => row['Status da auditoria'] === 'Reprovado').length}
                  </p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                  <p className="text-sm text-yellow-800 font-medium">Dentro da Tolerância</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {reportData.filter(row => row['Status da auditoria'] === 'Dentro da Tolerância').length}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800 font-medium">Taxa de Aprovação</p>
                  <p className="text-xl font-bold text-blue-600">
                    {(reportData.filter(row => row['Status da auditoria'] === 'Aprovado').length / reportData.length * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <FileText size={18} className="text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dados do Relatório</h2>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center">
                <RefreshCw size={40} className="text-blue-500 animate-spin mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Carregando dados do relatório...</p>
              </div>
            </div>
          ) : (
            <div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {reportFields.map((field, index) => (
                      <th 
                        key={index}
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:bg-gray-700"
                      >
                        <div className="flex items-center space-x-1">
                          <span>{field}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                  {reportData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:bg-gray-900">
                      {reportFields.map((field, colIndex) => {
                        const value = row[field];
                        let cellClass = '';
                        
                        // Apply special formatting for certain fields
                        if (field === 'Status da auditoria') {
                          if (value === 'Aprovado') cellClass = 'text-green-600 bg-green-50';
                          else if (value === 'Reprovado') cellClass = 'text-red-600 bg-red-50';
                          else if (value === 'Dentro da Tolerância') cellClass = 'text-yellow-600 bg-yellow-50';
                        }
                        
                        if (field === 'Diferença (%)') {
                          const numValue = parseFloat(value);
                          if (numValue > 5) cellClass = 'text-red-600';
                          else if (numValue < -5) cellClass = 'text-red-600';
                          else if (numValue === 0) cellClass = 'text-gray-500';
                          else cellClass = 'text-yellow-600';
                        }
                        
                        return (
                          <td 
                            key={colIndex} 
                            className={`px-6 py-4 whitespace-nowrap text-sm ${cellClass}`}
                          >
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando <span className="font-medium">1</span> a <span className="font-medium">{reportData.length}</span> de <span className="font-medium">{reportData.length}</span> resultados
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={true}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  
                  <button
                    className="px-3 py-1 border border-gray-300 bg-blue-600 text-white rounded-md text-sm font-medium"
                  >
                    1
                  </button>
                  
                  <button
                    disabled={true}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Opções de Relatório</h3>
        <p className="text-blue-800 mb-4">
          Este relatório pode ser exportado em diferentes formatos para análise e compartilhamento.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center space-x-3">
            <Download size={20} className="text-green-600" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Excel</p>
              <p className="text-gray-600 dark:text-gray-400">Exportar para planilha</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center space-x-3">
            <Download size={20} className="text-red-600" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">PDF</p>
              <p className="text-gray-600 dark:text-gray-400">Exportar para documento</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center space-x-3">
            <Printer size={20} className="text-blue-600" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Imprimir</p>
              <p className="text-gray-600 dark:text-gray-400">Enviar para impressora</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
