import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Printer, Calendar, Filter, RefreshCw, FileText, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { ReportFilters } from './ReportFilters';
import { ReportTable } from './ReportTable';
import { ReportCharts } from './ReportCharts';
import { CTEAuditReport } from './CTEAuditReport';
import { getCurrentSessionContext } from '../../lib/sessionContext';
import { isDemoOrganizationSync } from '../../utils/organizationHelpers';

interface ReportProps {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  fields: string[];
  filters: string[];
}

interface ReportViewerProps {
  report: ReportProps;
  onBack: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, onBack }) => {
  // For CT-e audit report, use the dedicated component
  if (report.id === 'cte-audit') {
    return <CTEAuditReport onBack={onBack} />;
  }

  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [mockData, setMockData] = useState<any[]>([]);
  
  const Icon = report.icon;
  
  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-600';
      case 'green': return 'bg-green-100 text-green-600';
      case 'red': return 'bg-red-100 text-red-600';
      case 'orange': return 'bg-orange-100 text-orange-600';
      case 'purple': return 'bg-purple-100 text-purple-600';
      case 'indigo': return 'bg-indigo-100 text-indigo-600';
      case 'teal': return 'bg-teal-100 text-teal-600';
      case 'cyan': return 'bg-cyan-100 text-cyan-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Generate mock data based on report type - APENAS para organization de demonstração
  useEffect(() => {
    generateMockData();
  }, [report.id, appliedFilters]);

  const generateMockData = async () => {
    setIsLoading(true);

    // Verificar se é organization de demonstração
    const context = await getCurrentSessionContext();
    const isDemo = isDemoOrganizationSync(context.organizationId);

    // Se NÃO for demonstração, retornar array vazio
    if (!isDemo) {
      setMockData([]);
      setIsLoading(false);
      return;
    }

    // Simulate API call delay
    setTimeout(() => {
      const data = [];
      
      // Generate between 10-30 rows of mock data
      const rowCount = Math.floor(Math.random() * 20) + 10;
      
      for (let i = 0; i < rowCount; i++) {
        const row: Record<string, any> = {};
        
        // Generate data based on report type
        switch (report.id) {
          case 'invoice-reconciliation':
            row['Nº da fatura'] = `FAT-${Math.floor(Math.random() * 9000) + 1000}`;
            row['Transportador'] = ['Transportadora ABC', 'Logística XYZ', 'Express Transportes', 'Rápido Entregas'][Math.floor(Math.random() * 4)];
            row['Período'] = `${new Date(2025, Math.floor(Math.random() * 12), 1).toLocaleDateString('pt-BR')} a ${new Date(2025, Math.floor(Math.random() * 12), 28).toLocaleDateString('pt-BR')}`;
            row['Valor da fatura'] = (Math.random() * 10000 + 1000).toFixed(2);
            row['Total de CT-es vinculados'] = Math.floor(Math.random() * 20) + 1;
            row['Valor total dos CT-es'] = (parseFloat(row['Valor da fatura']) * (Math.random() * 0.2 + 0.9)).toFixed(2);
            row['Diferença entre valor faturado e aprovado'] = (parseFloat(row['Valor da fatura']) - parseFloat(row['Valor total dos CT-es'])).toFixed(2);
            row['Status da conciliação'] = Math.abs(parseFloat(row['Diferença entre valor faturado e aprovado'])) < 10 ? 'OK' : 'Divergente';
            row['Data de recebimento e processamento'] = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('pt-BR');
            break;
            
          case 'deliveries-occurrences':
            row['Nº CT-e'] = `${Math.floor(Math.random() * 9000) + 1000}`;
            row['Transportador'] = ['Transportadora ABC', 'Logística XYZ', 'Express Transportes', 'Rápido Entregas'][Math.floor(Math.random() * 4)];
            row['Data de entrega'] = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('pt-BR');
            row['Código da Ocorrência'] = `${Math.floor(Math.random() * 99) + 1}`.padStart(3, '0');
            row['Descrição'] = ['Entrega realizada', 'Cliente ausente', 'Endereço não localizado', 'Mercadoria danificada'][Math.floor(Math.random() * 4)];
            row['Tipo'] = ['Informativa', 'Crítica'][Math.floor(Math.random() * 2)];
            row['Status final da entrega'] = ['Entregue', 'Pendente', 'Devolvido'][Math.floor(Math.random() * 3)];
            row['Data e hora da ocorrência'] = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)).toLocaleString('pt-BR');
            row['Cidade/UF'] = ['São Paulo/SP', 'Rio de Janeiro/RJ', 'Belo Horizonte/MG', 'Curitiba/PR'][Math.floor(Math.random() * 4)];
            break;
            
          case 'nfe-without-cte':
            row['Nº NF-e'] = `${Math.floor(Math.random() * 9000) + 1000}`;
            row['Data de emissão'] = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('pt-BR');
            row['Destinatário'] = ['Cliente A Ltda', 'Empresa B S.A.', 'Comércio C Ltda', 'Indústria D S.A.'][Math.floor(Math.random() * 4)];
            row['Valor'] = (Math.random() * 5000 + 500).toFixed(2);
            row['Status logístico'] = ['Pendente de embarque', 'Em tratativa'][Math.floor(Math.random() * 2)];
            row['Estabelecimento emissor'] = ['Matriz', 'Filial SP', 'Filial RJ', 'Filial MG'][Math.floor(Math.random() * 4)];
            row['UF de destino'] = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS'][Math.floor(Math.random() * 6)];
            break;
            
          case 'rejection-history':
            row['Tipo de documento'] = ['CT-e', 'Fatura'][Math.floor(Math.random() * 2)];
            row['Nº documento'] = row['Tipo de documento'] === 'CT-e' ? `${Math.floor(Math.random() * 9000) + 1000}` : `FAT-${Math.floor(Math.random() * 9000) + 1000}`;
            row['Transportador'] = ['Transportadora ABC', 'Logística XYZ', 'Express Transportes', 'Rápido Entregas'][Math.floor(Math.random() * 4)];
            row['Data'] = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('pt-BR');
            row['Valor envolvido'] = (Math.random() * 5000 + 500).toFixed(2);
            row['Motivo da reprovação'] = ['Valor acima do permitido', 'Transportador não autorizado', 'Rota incorreta', 'Documentação incompleta'][Math.floor(Math.random() * 4)];
            row['Responsável pela decisão'] = ['João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Pereira'][Math.floor(Math.random() * 4)];
            row['Observações'] = Math.random() > 0.5 ? 'Verificar com o transportador' : '';
            break;
            
          case 'carrier-efficiency':
            row['Transportador'] = ['Transportadora ABC', 'Logística XYZ', 'Express Transportes', 'Rápido Entregas'][Math.floor(Math.random() * 4)];
            row['% de CT-es aprovados sem divergência'] = (Math.random() * 30 + 70).toFixed(2) + '%';
            row['% de entregas com ocorrências críticas'] = (Math.random() * 20).toFixed(2) + '%';
            row['% de notas atendidas no prazo (SLA de entrega)'] = (Math.random() * 20 + 80).toFixed(2) + '%';
            row['Média de diferença de valor entre custo previsto e CT-e'] = (Math.random() * 10).toFixed(2) + '%';
            row['Taxa de rejeição de faturas'] = (Math.random() * 15).toFixed(2) + '%';
            break;
            
          case 'xml-download-history':
            row['Usuário'] = ['João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Pereira'][Math.floor(Math.random() * 4)];
            row['Data/hora do download'] = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)).toLocaleString('pt-BR');
            row['Qtde de CT-es exportados'] = Math.floor(Math.random() * 50) + 1;
            row['Nome do arquivo gerado'] = `ctes_export_${Math.floor(Math.random() * 9000) + 1000}.zip`;
            row['Intervalo de data selecionado'] = `${new Date(2025, Math.floor(Math.random() * 12), 1).toLocaleDateString('pt-BR')} a ${new Date(2025, Math.floor(Math.random() * 12), 28).toLocaleDateString('pt-BR')}`;
            row['Transportadores envolvidos'] = Math.floor(Math.random() * 5) + 1;
            break;
            
          case 'tolerance-usage':
            row['Nº CT-e'] = `${Math.floor(Math.random() * 9000) + 1000}`;
            row['Transportador'] = ['Transportadora ABC', 'Logística XYZ', 'Express Transportes', 'Rápido Entregas'][Math.floor(Math.random() * 4)];
            row['Valor do CT-e'] = (Math.random() * 5000 + 500).toFixed(2);
            row['Valor do custo'] = (parseFloat(row['Valor do CT-e']) * (Math.random() * 0.2 + 0.9)).toFixed(2);
            row['Diferença (R$)'] = (parseFloat(row['Valor do CT-e']) - parseFloat(row['Valor do custo'])).toFixed(2);
            row['Tolerância aplicada (%)'] = (Math.random() * 10).toFixed(2) + '%';
            row['Data da auditoria'] = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('pt-BR');
            row['Usuário responsável'] = ['João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Pereira'][Math.floor(Math.random() * 4)];
            row['Justificativa'] = Math.random() > 0.5 ? 'Dentro da tolerância contratual' : '';
            break;
            
          default:
            // Generic data for any other report type
            report.fields.forEach(field => {
              row[field] = `Valor ${i + 1} para ${field}`;
            });
        }
        
        data.push(row);
      }
      
      setMockData(data);
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
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClass(report.color)}`}>
            <Icon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{report.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">{report.description}</p>
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
            <ReportFilters 
              reportId={report.id}
              filters={report.filters}
              onApplyFilters={handleApplyFilters}
            />
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
          {mockData.length} registros encontrados
        </div>
      </div>

      {/* Charts Section (for applicable reports) */}
      {['carrier-efficiency', 'deliveries-occurrences', 'rejection-history'].includes(report.id) && (
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
              <ReportCharts 
                reportId={report.id}
                data={mockData}
              />
            </div>
          )}
        </div>
      )}

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
            <ReportTable 
              fields={report.fields}
              data={mockData}
            />
          )}
        </div>
      </div>
    </div>
  );
};
