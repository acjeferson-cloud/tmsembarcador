import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { FileText, Download, RefreshCw, Calendar, Filter, Search, CheckCircle, AlertCircle, Clock, X, Database, Truck, User, Building, MapPin, FileUp, Plus } from 'lucide-react';
import { carriers } from '../../data/mockData';
import { establishments } from '../../data/establishmentsData';
import { brazilianStates } from '../../data/statesData';
import { getCurrentSessionContext } from '../../lib/sessionContext';
import { isDemoOrganizationSync } from '../../utils/organizationHelpers';

// EDI Layout types
type EDILayoutType = 'NOTFIS' | 'CONEMB' | 'OCOREN' | 'DOCCOB';

interface EDIOutputFile {
  id: number;
  name: string;
  layout: EDILayoutType;
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: string;
  size: number;
  recipient: string;
  recordCount: number;
  errorCount: number;
}

export const EDIOutput: React.FC = () => {
  const breadcrumbItems = [
    { label: 'EDI' },
    { label: 'Saída', current: true }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [layoutFilter, setLayoutFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generationData, setGenerationData] = useState({
    layout: 'NOTFIS' as EDILayoutType,
    transportador: '',
    estabelecimento: '',
    periodoInicio: '',
    periodoFim: '',
    uf: '',
    cliente: '',
    observacoes: ''
  });
  const [previewData, setPreviewData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // EDI output files - Mostra dados de exemplo APENAS para organization de demonstração
  const [mockFiles, setMockFiles] = useState<EDIOutputFile[]>([]);

  // Carregar dados mockados apenas para organization de demonstração
  useEffect(() => {
    const loadDemoData = async () => {
      const context = await getCurrentSessionContext();
      const isDemo = isDemoOrganizationSync(context.organizationId);

      if (isDemo) {
        setMockFiles([
          {
            id: 1,
            name: 'NOTFIS_20250115_001.txt',
            layout: 'NOTFIS',
            status: 'completed',
            createdAt: '2025-01-15T10:30:00',
            size: 45678,
            recipient: 'Transportadora ABC',
            recordCount: 120,
            errorCount: 0
          },
          {
            id: 2,
            name: 'CONEMB_20250115_001.txt',
            layout: 'CONEMB',
            status: 'completed',
            createdAt: '2025-01-15T11:45:00',
            size: 23456,
            recipient: 'Transportadora XYZ',
            recordCount: 85,
            errorCount: 0
          },
          {
            id: 3,
            name: 'OCOREN_20250115_001.txt',
            layout: 'OCOREN',
            status: 'error',
            createdAt: '2025-01-15T14:20:00',
            size: 12345,
            recipient: 'Transportadora ABC',
            recordCount: 45,
            errorCount: 3
          },
          {
            id: 4,
            name: 'DOCCOB_20250115_001.txt',
            layout: 'DOCCOB',
            status: 'pending',
            createdAt: '2025-01-15T16:10:00',
            size: 34567,
            recipient: 'Transportadora DEF',
            recordCount: 0,
            errorCount: 0
          },
          {
            id: 5,
            name: 'NOTFIS_20250116_001.txt',
            layout: 'NOTFIS',
            status: 'processing',
            createdAt: '2025-01-16T09:15:00',
            size: 56789,
            recipient: 'Transportadora GHI',
            recordCount: 0,
            errorCount: 0
          }
        ]);
      }
    };

    loadDemoData();
  }, []);

  // Set default dates for period
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    setGenerationData(prev => ({
      ...prev,
      periodoInicio: firstDayOfMonth.toISOString().split('T')[0],
      periodoFim: today.toISOString().split('T')[0]
    }));
  }, []);

  // Apply filters
  const filteredFiles = mockFiles.filter(file => {
    // Search filter
    const matchesSearch = 
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.recipient.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Layout filter
    const matchesLayout = layoutFilter === 'all' || file.layout === layoutFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || file.status === statusFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const fileDate = new Date(file.createdAt);
      const today = new Date();
      
      if (dateFilter === 'today') {
        matchesDate = 
          fileDate.getDate() === today.getDate() &&
          fileDate.getMonth() === today.getMonth() &&
          fileDate.getFullYear() === today.getFullYear();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        matchesDate = fileDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        matchesDate = fileDate >= monthAgo;
      }
    }
    
    return matchesSearch && matchesLayout && matchesStatus && matchesDate;
  });

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-600" />;
      case 'processing':
        return <RefreshCw size={16} className="animate-spin text-blue-600" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-600" />;
      default:
        return <FileText size={16} className="text-gray-600 dark:text-gray-400" />;
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'error':
        return 'Erro';
      case 'processing':
        return 'Processando';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get layout color
  const getLayoutColor = (layout: EDILayoutType) => {
    switch (layout) {
      case 'NOTFIS':
        return 'bg-blue-100 text-blue-800';
      case 'CONEMB':
        return 'bg-green-100 text-green-800';
      case 'OCOREN':
        return 'bg-orange-100 text-orange-800';
      case 'DOCCOB':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Download file
  const handleDownload = (fileId: number) => {
    const file = mockFiles.find(f => f.id === fileId);
    if (!file) return;
    
    alert(`Baixando arquivo ${file.name}`);
  };

  // Handle input change for generation form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGenerationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle generate preview
  const handleGeneratePreview = () => {
    // Validate required fields
    if (!generationData.transportador) {
      alert('Por favor, selecione um transportador');
      return;
    }
    
    if (!generationData.periodoInicio || !generationData.periodoFim) {
      alert('Por favor, informe o período');
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      // Generate mock preview data
      const preview = {
        layout: generationData.layout,
        transportador: carriers.find(c => c.id.toString() === generationData.transportador)?.name || 'Transportador não encontrado',
        periodo: `${new Date(generationData.periodoInicio).toLocaleDateString('pt-BR')} a ${new Date(generationData.periodoFim).toLocaleDateString('pt-BR')}`,
        documentos: Math.floor(Math.random() * 100) + 20,
        registros: {
          cabecalho: 1,
          emitente: 1,
          destinatario: Math.floor(Math.random() * 100) + 20,
          produtos: Math.floor(Math.random() * 300) + 50,
          valores: Math.floor(Math.random() * 100) + 20,
          total: 0
        }
      };
      
      // Calculate total
      preview.registros.total = 
        preview.registros.cabecalho + 
        preview.registros.emitente + 
        preview.registros.destinatario + 
        preview.registros.produtos + 
        preview.registros.valores;
      
      setPreviewData(preview);
      setIsGenerating(false);
    }, 1500);
  };

  // Handle confirm generation
  const handleConfirmGeneration = () => {
    if (!previewData) return;
    
    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      // Create new file entry
      const newFile: EDIOutputFile = {
        id: Math.max(...mockFiles.map(f => f.id)) + 1,
        name: `${generationData.layout}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Math.floor(Math.random() * 999).toString().padStart(3, '0')}.txt`,
        layout: generationData.layout as EDILayoutType,
        status: 'completed',
        createdAt: new Date().toISOString(),
        size: Math.floor(Math.random() * 100000) + 10000,
        recipient: previewData.transportador,
        recordCount: previewData.registros.total,
        errorCount: 0
      };
      
      // Add to mock files
      setMockFiles(prev => [newFile, ...prev]);
      
      // Reset form
      setPreviewData(null);
      setShowGenerateForm(false);
      setIsGenerating(false);
      
      alert(`Arquivo ${newFile.name} gerado com sucesso!`);
    }, 2000);
  };

  // Cancel generation
  const handleCancelGeneration = () => {
    setPreviewData(null);
    if (!isGenerating) {
      setShowGenerateForm(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EDIs de Saída</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie os arquivos EDI gerados para envio aos transportadores</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowGenerateForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Gerar Arquivo EDI</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Carregando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* Generate Form */}
      {showGenerateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gerar Arquivo EDI</h2>
            {!previewData && (
              <button
                onClick={() => setShowGenerateForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-100 dark:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          {!previewData ? (
            <div className="space-y-6">
              {/* Layout Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Arquivo EDI a Ser Gerado *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <input
                      type="radio"
                      id="layout-notfis"
                      name="layout"
                      value="NOTFIS"
                      checked={generationData.layout === 'NOTFIS'}
                      onChange={handleInputChange}
                      className="peer absolute opacity-0 w-0 h-0"
                    />
                    <label
                      htmlFor="layout-notfis"
                      className="flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:bg-gray-50 dark:bg-gray-900"
                    >
                      <FileText size={32} className="text-blue-600 mb-2" />
                      <span className="font-medium text-gray-900 dark:text-white">Notas Fiscais</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">Layout: NOTFIS</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Período *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      name="periodoInicio"
                      value={generationData.periodoInicio}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="flex items-center text-gray-500 dark:text-gray-400">a</span>
                    <input
                      type="date"
                      name="periodoFim"
                      value={generationData.periodoFim}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transportador *
                  </label>
                  <select
                    name="transportador"
                    value={generationData.transportador}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione o transportador</option>
                    {carriers.map(carrier => (
                      <option key={carrier.id} value={carrier.id}>
                        {carrier.codigo} - {carrier.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estabelecimento
                  </label>
                  <select
                    name="estabelecimento"
                    value={generationData.estabelecimento}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos os Estabelecimentos</option>
                    {establishments.map(establishment => (
                      <option key={establishment.id} value={establishment.id}>
                        {establishment.codigo} - {establishment.fantasia || establishment.razaoSocial}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    UF
                  </label>
                  <select
                    name="uf"
                    value={generationData.uf}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas as UFs</option>
                    {brazilianStates.map(state => (
                      <option key={state.id} value={state.abbreviation}>
                        {state.abbreviation} - {state.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observações
                  </label>
                  <textarea
                    name="observacoes"
                    value={generationData.observacoes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Informações adicionais sobre este arquivo EDI..."
                  />
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowGenerateForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGeneratePreview}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <div className="flex items-center space-x-2">
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Gerando...</span>
                    </div>
                  ) : (
                    'Gerar Arquivo'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview Data */}
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumo Prévio</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Layout</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{previewData.layout}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Transportador</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{previewData.transportador}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Período</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{previewData.periodo}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Documentos Identificados</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{previewData.documentos}</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Total de Registros por Tipo</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Cabeçalho</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{previewData.registros.cabecalho}</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Emitente</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{previewData.registros.emitente}</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Destinatário</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{previewData.registros.destinatario}</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Produtos</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{previewData.registros.produtos}</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Valores</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{previewData.registros.valores}</p>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600">Total</p>
                      <p className="text-xl font-bold text-blue-900">{previewData.registros.total}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Preview Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCancelGeneration}
                  disabled={isGenerating}
                  className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmGeneration}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <div className="flex items-center space-x-2">
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Gerando...</span>
                    </div>
                  ) : (
                    'Confirmar Geração'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome de arquivo ou destinatário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          
          <select
            value={layoutFilter}
            onChange={(e) => setLayoutFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Layouts</option>
            <option value="NOTFIS">NOTFIS</option>
            <option value="CONEMB">CONEMB</option>
            <option value="OCOREN">OCOREN</option>
            <option value="DOCCOB">DOCCOB</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="completed">Concluído</option>
            <option value="error">Erro</option>
            <option value="processing">Processando</option>
            <option value="pending">Pendente</option>
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas as Datas</option>
            <option value="today">Hoje</option>
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
          </select>
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Arquivo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Layout
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Destinatário
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data de Criação
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tamanho
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Registros
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
              {filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50 dark:bg-gray-900">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText size={20} className="text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLayoutColor(file.layout)}`}>
                      {file.layout}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {file.recipient}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(file.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(file.status)}`}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(file.status)}
                        <span>{getStatusText(file.status)}</span>
                      </div>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {file.status === 'completed' || file.status === 'error' ? (
                      <div>
                        <span className="font-medium">{file.recordCount}</span>
                        {file.errorCount > 0 && (
                          <span className="text-red-600 ml-2">
                            ({file.errorCount} erro{file.errorCount !== 1 ? 's' : ''})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {file.status === 'completed' && (
                        <button
                          onClick={() => handleDownload(file.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Download
                        </button>
                      )}
                      {file.status === 'error' && (
                        <button
                          className="text-red-600 hover:text-red-900"
                        >
                          Ver Erros
                        </button>
                      )}
                      {(file.status === 'pending' || file.status === 'error') && (
                        <button
                          className="text-green-600 hover:text-green-900"
                        >
                          Reprocessar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum arquivo EDI encontrado</h3>
            <p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou gerar novos arquivos EDI.</p>
          </div>
        )}
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Sobre EDIs de Saída</h3>
        <p className="text-blue-800 mb-4">
          Os arquivos EDI de saída são gerados pelo sistema para envio aos transportadores e parceiros logísticos.
          Cada layout tem uma finalidade específica no processo de comunicação.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">NOTFIS</p>
            <p className="text-blue-700">Envio de notas fiscais</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">CONEMB</p>
            <p className="text-blue-700">Envio de conhecimentos</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">OCOREN</p>
            <p className="text-blue-700">Envio de ocorrências</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">DOCCOB</p>
            <p className="text-blue-700">Envio de faturas</p>
          </div>
        </div>
      </div>

      {/* Technical Requirements */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Informações Técnicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Formato de Saída</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Arquivos de texto (.txt) com codificação UTF-8</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Separadores e delimitadores conforme padrão EDI</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Nomenclatura padronizada para fácil identificação</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Validações</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Validação de campos obrigatórios</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Verificação de consistência de dados</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Logs detalhados para auditoria</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};