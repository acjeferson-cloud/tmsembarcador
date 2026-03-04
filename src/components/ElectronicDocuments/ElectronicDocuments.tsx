import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Search, Plus, Filter, Download, Upload, FileText, Eye, FileCheck, Calendar, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { DocumentCard } from './DocumentCard';
import { DocumentView } from './DocumentView';
import { DocumentUpload } from './DocumentUpload';
import { electronicDocumentsService } from '../../services/electronicDocumentsService';
import { generatePDF } from '../../services/pdfService';

type DocumentType = 'NFe' | 'CTe';
type DocumentStatus = 'processing' | 'authorized' | 'cancelled' | 'denied';

export const ElectronicDocuments: React.FC = () => {
  const breadcrumbItems = [
    { label: 'Documentos Eletrônicos', current: true }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | DocumentType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DocumentStatus>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [showView, setShowView] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 12;

  // Load documents from database
  useEffect(() => {
    loadDocuments();
  }, [refreshKey]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await electronicDocumentsService.getAll();
      const mappedData = data.map(doc => ({
        id: doc.id,
        tipo: doc.document_type,
        modelo: doc.model,
        numeroDocumento: doc.document_number,
        serie: doc.series,
        chaveAcesso: doc.access_key,
        protocoloAutorizacao: doc.authorization_protocol,
        dataAutorizacao: doc.authorization_date || doc.import_date,
        dataImportacao: doc.import_date,
        status: doc.status,
        emitente: {
          razaoSocial: doc.issuer_name,
          cnpj: doc.issuer_document,
          endereco: doc.issuer_address
        },
        destinatario: doc.recipient_name ? {
          razaoSocial: doc.recipient_name,
          cnpj: doc.recipient_document,
          endereco: doc.recipient_address
        } : null,
        valorTotal: doc.total_value,
        valorIcms: doc.icms_value,
        valorFrete: doc.freight_value,
        pesoTotal: doc.total_weight,
        modalTransporte: doc.transport_mode,
        xmlContent: doc.xml_content
      }));
      setDocumentsList(mappedData);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const filteredDocuments = documentsList.filter(doc => {
    const matchesSearch = doc.chaveAcesso.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.numeroDocumento.includes(searchTerm) ||
                         doc.emitente.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.emitente.cnpj.includes(searchTerm) ||
                         (doc.destinatario && doc.destinatario.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || doc.tipo === typeFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const docDate = new Date(doc.dataAutorizacao);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - docDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today':
          matchesDate = diffDays <= 1;
          break;
        case 'week':
          matchesDate = diffDays <= 7;
          break;
        case 'month':
          matchesDate = diffDays <= 30;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedDocuments = filteredDocuments.slice(startIndex, startIndex + itemsPerPage);

  const handleViewDocument = (document: any) => {
    setViewingDocument(document);
    setShowView(true);
  };

  const handleBackToList = () => {
    setShowUpload(false);
    setShowView(false);
    setViewingDocument(null);
  };

  const handleProcessDocument = async (documentId: number, action: 'danfe' | 'dacte') => {
    setIsProcessing(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const document = documentsList.find(d => d.id === documentId);
    if (document) {
      const actionName = action === 'danfe' ? 'DANFE' : 'DACTE';
      
      // Gerar o PDF e abrir em nova aba
      const pdfUrl = generatePDF(document, action);
      window.open(pdfUrl, '_blank');
    }
    
    setIsProcessing(false);
  };

  const handleExport = () => {
    const csvContent = [
      ['Tipo', 'Número', 'Chave de Acesso', 'Emitente', 'CNPJ Emitente', 'Valor Total', 'Data Autorização', 'Status'].join(','),
      ...filteredDocuments.map(doc => [
        doc.tipo,
        doc.numeroDocumento,
        doc.chaveAcesso,
        doc.emitente.razaoSocial,
        doc.emitente.cnpj,
        doc.valorTotal?.toFixed(2) || '0.00',
        doc.dataAutorizacao,
        doc.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documentos_eletronicos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusStats = () => {
    const total = documentsList.length;
    const autorizado = documentsList.filter(d => d.status === 'autorizado').length;
    const cancelado = documentsList.filter(d => d.status === 'cancelado').length;
    const rejeitado = documentsList.filter(d => d.status === 'rejeitado').length;
    const processando = documentsList.filter(d => d.status === 'processando').length;
    
    return { total, autorizado, cancelado, rejeitado, processando };
  };

  const getTypeStats = () => {
    const nfe = documentsList.filter(d => d.tipo === 'NFe').length;
    const cte = documentsList.filter(d => d.tipo === 'CTe').length;
    
    return { nfe, cte };
  };

  const stats = getStatusStats();
  const typeStats = getTypeStats();

  if (showUpload) {
    return (
      <DocumentUpload
        onBack={handleBackToList}
        onUploadComplete={() => {
          setShowUpload(false);
          forceRefresh();
        }}
      />
    );
  }

  if (showView) {
    return (
      <DocumentView
        onBack={handleBackToList}
        document={viewingDocument}
        onProcessDocument={handleProcessDocument}
        isProcessing={isProcessing}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documentos Eletrônicos</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie XMLs de NFe (modelo 55) e CTe (modelo 57)</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Upload size={20} />
          <span>Importar XMLs</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Documentos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Autorizados</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.autorizado}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">NFe (Modelo 55)</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{typeStats.nfe}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileCheck size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CTe (Modelo 57)</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{typeStats.cte}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText size={24} className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Processando</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.processando}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <RefreshCw size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por chave de acesso, número, emitente ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Tipos</option>
            <option value="NFe">NFe (Modelo 55)</option>
            <option value="CTe">CTe (Modelo 57)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="autorizado">Autorizado</option>
            <option value="cancelado">Cancelado</option>
            <option value="rejeitado">Rejeitado</option>
            <option value="processando">Processando</option>
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
          
          <button 
            onClick={handleExport}
            className="border border-gray-300 hover:bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
          <span>Total: {filteredDocuments.length} documentos</span>
          <span>Página {currentPage} de {totalPages}</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <CheckCircle size={14} className="text-green-600" />
              <span>{stats.autorizado} autorizados</span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertCircle size={14} className="text-red-600" />
              <span>{stats.rejeitado} rejeitados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayedDocuments.map((document) => (
          <DocumentCard
            key={`${document.id}-${refreshKey}`}
            document={document}
            onView={handleViewDocument}
            onProcessDocument={handleProcessDocument}
            isProcessing={isProcessing}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredDocuments.length)} de {filteredDocuments.length} documentos
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (page > totalPages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 text-sm rounded transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredDocuments.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <FileText size={48} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum documento encontrado</h3>
          <p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou importar novos XMLs.</p>
        </div>
      )}

      {/* Integration Info */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Integração com SEFAZ</h3>
        <p className="text-green-800 mb-4">
          O sistema processa automaticamente XMLs de NFe (modelo 55) e CTe (modelo 57), validando as informações 
          com a SEFAZ e extraindo todos os dados fiscais relevantes para controle logístico.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-green-900">Validação SEFAZ</p>
            <p className="text-green-700">Chaves de acesso verificadas</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-green-900">Geração DANFE/DACTE</p>
            <p className="text-green-700">PDFs automáticos dos documentos</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-green-900">Controle Fiscal</p>
            <p className="text-green-700">Rastreamento completo</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-green-900">Armazenamento XML</p>
            <p className="text-green-700">Conteúdo completo preservado</p>
          </div>
        </div>
      </div>
    </div>
  );
};