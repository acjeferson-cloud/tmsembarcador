import React from 'react';
import { Eye, FileText, Download, Calendar, Clock, CheckCircle, AlertCircle, XCircle, RefreshCw, Building, MapPin, Printer } from 'lucide-react';
import { ElectronicDocument } from '../../data/electronicDocumentsData';
import { formatCurrency } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

interface DocumentCardProps {
  document: ElectronicDocument;
  onView: (document: ElectronicDocument) => void;
  onPrint?: (doc: ElectronicDocument) => void;
  onDownloadXml?: (doc: ElectronicDocument) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ 
  document, 
  onView,
  onPrint,
  onDownloadXml
}) => {
  const { t } = useTranslation();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'autorizado': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-gray-100 text-gray-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      case 'processando': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'autorizado': return <CheckCircle size={14} />;
      case 'cancelado': return <XCircle size={14} />;
      case 'rejeitado': return <AlertCircle size={14} />;
      case 'processando': return <RefreshCw size={14} className="animate-spin" />;
      default: return <FileText size={14} />;
    }
  };

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'NFe': return 'bg-purple-100 text-purple-800';
      case 'CTe': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{document.numeroDocumento}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{document.tipo} - {t('electronicDocs.card.model')} {document.modelo}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(document.tipo)}`}>
            {document.tipo}
          </div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
            {getStatusIcon(document.status)}
            <span className="ml-1 capitalize">{t(`electronicDocs.status.${document.status.toLowerCase()}`)}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Building size={14} />
          <span className="truncate">{document.emitente.razaoSocial}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <FileText size={14} />
          <span className="font-mono text-xs">{document.chaveAcesso.substring(0, 20)}...</span>
        </div>
        
        {document.destinatario && (
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <MapPin size={14} />
            <span className="truncate">{document.destinatario.razaoSocial}</span>
          </div>
        )}
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Calendar size={14} />
          <span>{t('electronicDocs.card.authorizedAt')}: {formatDateTime(document.dataAutorizacao)}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Clock size={14} />
          <span>{t('electronicDocs.card.importedAt')}: {formatDateTime(document.dataImportacao)}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t('electronicDocs.card.totalValue')}:</span>
            <span className="font-semibold text-gray-900 dark:text-white ml-1">{formatCurrency(document.valorTotal)}</span>
          </div>
          {document.tipo === 'CTe' && document.pesoTotal && (
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('electronicDocs.card.weight')}:</span>
              <span className="font-semibold text-gray-900 dark:text-white ml-1">{document.pesoTotal} kg</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <button 
              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-1 text-sm shadow-sm"
              onClick={() => { if (onPrint) onPrint(document); }}
            >
              <Printer size={16} />
              <span>{document.tipo === 'NFe' ? t('electronicDocs.card.printDanfe') : t('electronicDocs.card.printDacte')}</span>
            </button>
            <button 
              className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-1 text-sm shadow-sm"
              onClick={() => { if (onDownloadXml) onDownloadXml(document); }}
            >
              <Download size={16} />
              <span>{t('electronicDocs.card.downloadXml')}</span>
            </button>
          </div>
          
          <button 
            onClick={() => onView(document)}
            className="w-full bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1 text-sm"
          >
            <Eye size={16} />
            <span>{t('electronicDocs.card.view')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
