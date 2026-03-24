import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Search, Download, Upload, FileText, FileCheck, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { DocumentCard } from './DocumentCard';
import { DocumentView } from './DocumentView';
import { DocumentUpload } from './DocumentUpload';
import { electronicDocumentsService } from '../../services/electronicDocumentsService';
import { getDanfeHtml } from '../../utils/danfeGenerator';
import { getDacteHtml } from '../../utils/dacteGenerator';
import { generateNfeXml, generateCteXml } from '../../utils/xmlGenerator';
import { parseXML } from '../../services/xmlService';
import { useTranslation } from 'react-i18next';

type DocumentType = 'NFe' | 'CTe';
type DocumentStatus = 'processing' | 'authorized' | 'cancelled' | 'denied';

export const ElectronicDocuments: React.FC = () => {
  const { t } = useTranslation();
  const breadcrumbItems = [
    { label: t('electronicDocs.title'), current: true }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | DocumentType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DocumentStatus>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [showView, setShowView] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const itemsPerPage = 12;

  // Load documents from database
  useEffect(() => {
    loadDocuments();
  }, [refreshKey]);

  const loadDocuments = async () => {
    try {
      const data = await electronicDocumentsService.getAll();
      const mappedData = data.map(doc => {
        let parsedData: any = {};
        if (doc.xml_content) {
          try {
            parsedData = parseXML(doc.xml_content);
          } catch (e) {
            console.error('Error parsing XML:', e);
          }
        } else {
            console.warn(`No xml_content for ${doc.document_number}`);
        }
        
        return {
          id: doc.id,
          tipo: doc.document_type,
          modelo: doc.model,
          numeroDocumento: doc.document_number,
          serie: doc.series,
          chaveAcesso: doc.access_key,
          protocoloAutorizacao: doc.authorization_protocol,
          dataAutorizacao: parsedData.dataAutorizacao || doc.authorization_date || doc.import_date,
          dataImportacao: doc.import_date,
          status: doc.status,
          emitente: {
            razaoSocial: doc.issuer_name,
            cnpj: doc.issuer_document,
            endereco: doc.issuer_address,
            ...parsedData.emitente
          },
          destinatario: doc.recipient_name ? {
            razaoSocial: doc.recipient_name,
            cnpj: doc.recipient_document,
            endereco: doc.recipient_address,
            ...parsedData.destinatario
          } : (parsedData.destinatario || null),
          valorTotal: doc.total_value,
          valorIcms: doc.icms_value,
          valorFrete: doc.freight_value,
          pesoTotal: doc.total_weight,
          modalTransporte: doc.transport_mode,
          xmlContent: doc.xml_content
        };
      });
      setDocumentsList(mappedData);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
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

  const handlePrintDocument = (document: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = document.tipo === 'NFe' 
        ? getDanfeHtml(document) 
        : getDacteHtml(document);

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // We give the browser a small tick for the font/CSS rendering of the DOM
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleDownloadXml = (document: any) => {
    let xmlContent = '';
    
    if (document.tipo === 'NFe') {
      xmlContent = generateNfeXml(document);
    } else {
      xmlContent = generateCteXml(document);
    }
    
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.tipo}_${document.chaveAcesso}.xml`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
        onPrint={handlePrintDocument}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('electronicDocs.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('electronicDocs.subtitle')}</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Upload size={20} />
          <span>{t('electronicDocs.importXmls')}</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('electronicDocs.stats.totalDocuments')}</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('electronicDocs.status.authorized')}</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('electronicDocs.types.nfe')}</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('electronicDocs.types.cte')}</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('electronicDocs.status.processing')}</p>
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
              placeholder={t('electronicDocs.searchPlaceholder')}
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
            <option value="all">{t('electronicDocs.allTypes')}</option>
            <option value="NFe">{t('electronicDocs.types.nfe')}</option>
            <option value="CTe">{t('electronicDocs.types.cte')}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('electronicDocs.allStatuses')}</option>
            <option value="autorizado">{t('electronicDocs.status.authorized')}</option>
            <option value="cancelado">{t('electronicDocs.status.canceled')}</option>
            <option value="rejeitado">{t('electronicDocs.status.rejected')}</option>
            <option value="processando">{t('electronicDocs.status.processing')}</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('electronicDocs.filterDate.all')}</option>
            <option value="today">{t('electronicDocs.filterDate.today')}</option>
            <option value="week">{t('electronicDocs.filterDate.week')}</option>
            <option value="month">{t('electronicDocs.filterDate.month')}</option>
          </select>
          
          <button 
            onClick={handleExport}
            className="border border-gray-300 hover:bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download size={18} />
            <span>{t('common.export')}</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
          <span>Total: {filteredDocuments.length} {t('electronicDocs.stats.documents')}</span>
          <span>{t('electronicDocs.stats.page')} {currentPage} {t('electronicDocs.stats.of')} {totalPages}</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <CheckCircle size={14} className="text-green-600" />
              <span>{stats.autorizado} {t('electronicDocs.status.authorized').toLowerCase()}s</span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertCircle size={14} className="text-red-600" />
              <span>{stats.rejeitado} {t('electronicDocs.status.denied').toLowerCase()}s</span>
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
            onPrint={handlePrintDocument}
            onDownloadXml={handleDownloadXml}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('electronicDocs.stats.showing')} {startIndex + 1} {t('electronicDocs.stats.to')} {Math.min(startIndex + itemsPerPage, filteredDocuments.length)} {t('electronicDocs.stats.of')} {filteredDocuments.length} {t('electronicDocs.stats.documents')}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('electronicDocs.pagination.previous')}
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
                {t('electronicDocs.pagination.next')}
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('electronicDocs.noDocuments')}</h3>
          <p className="text-gray-600 dark:text-gray-400">{t('electronicDocs.subtitle')}</p>
        </div>
      )}

      {/* Integration Info */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-2">{t('electronicDocs.integration.title')}</h3>
        <p className="text-green-800 mb-4">
          {t('electronicDocs.integration.description')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-100 dark:border-green-900">
            <p className="font-semibold text-green-900">{t('electronicDocs.integration.validation.title')}</p>
            <p className="text-green-700">{t('electronicDocs.integration.validation.desc')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-100 dark:border-green-900">
            <p className="font-semibold text-green-900">{t('electronicDocs.integration.generation.title')}</p>
            <p className="text-green-700">{t('electronicDocs.integration.generation.desc')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-100 dark:border-green-900">
            <p className="font-semibold text-green-900">{t('electronicDocs.integration.control.title')}</p>
            <p className="text-green-700">{t('electronicDocs.integration.control.desc')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-100 dark:border-green-900">
            <p className="font-semibold text-green-900">{t('electronicDocs.integration.storage.title')}</p>
            <p className="text-green-700">{t('electronicDocs.integration.storage.desc')}</p>
          </div>
        </div>
      </div>

    </div>
  );
};