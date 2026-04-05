import React, { useState } from 'react';
import { ArrowLeft, FileText, Calendar, Clock, Building, MapPin, Hash, Package, Truck, Code, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import { ElectronicDocument } from '../../data/electronicDocumentsData';
import { formatCurrency } from '../../utils/formatters';
import { parseXML } from '../../services/xmlService';
import { useTranslation } from 'react-i18next';

interface DocumentViewProps {
  onBack: () => void;
  document: ElectronicDocument;
  onPrint: (document: any) => void;
}

export const DocumentView: React.FC<DocumentViewProps> = ({ onBack, document, onPrint }) => {
  const { t } = useTranslation();
  const [showXml, setShowXml] = useState(false);
  let richDoc = document as any;
  if (document.xmlContent) {
    try {
      const parsed = parseXML(document.xmlContent) as any;
      richDoc = { 
        ...document, 
        ...parsed, 
        emitente: { ...document.emitente, ...parsed.emitente }, 
        destinatario: { ...document.destinatario, ...parsed.destinatario },
        remetente: parsed.remetente || document.remetente,
        tomador: parsed.tomador || document.tomador
      };
    } catch (e) {

    }
  }

  const getStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'authorized' || s === 'autorizado') return t('electronicDocs.status.authorized');
    if (s === 'canceled' || s === 'cancelled' || s === 'cancelado') return t('electronicDocs.status.canceled');
    if (s === 'denied' || s === 'rejeitado') return t('electronicDocs.status.rejected');
    if (s === 'processing' || s === 'processando') return t('electronicDocs.status.processing');
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'authorized') return 'bg-green-100 text-green-800';
    if (s === 'canceled' || s === 'cancelled') return 'bg-gray-100 text-gray-800';
    if (s === 'denied' || s === 'rejeitado') return 'bg-red-100 text-red-800';
    if (s === 'processing') return 'bg-yellow-100 text-yellow-800';
    switch (status) {
      case 'autorizado': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-gray-100 text-gray-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      case 'processando': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
    } catch {
      return dateString;
    }
  };

  const getActionButtonText = () => {
    return document.tipo === 'NFe' ? t('electronicDocs.card.printDanfe') : t('electronicDocs.card.printDacte');
  };

  const handlePrint = () => {
    onPrint(document);
  };

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>{t('electronicDocs.view.back')}</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('electronicDocs.view.title')}</h1>
              <p className="text-gray-600 dark:text-gray-400">{t('electronicDocs.subtitle')}</p>
            </div>
            {document.status === 'autorizado' && (
              <button
                onClick={handlePrint}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Printer size={20} />
                <span>{getActionButtonText()}</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start space-x-6">
              {/* Document Icon */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText size={48} className="text-blue-600" />
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{document.numeroDocumento}</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{document.tipo} - {t('electronicDocs.view.model')} {document.modelo}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.series')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{document.serie}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.status')}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                      {getStatusLabel(document.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.filterType')}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(document.tipo)}`}>
                      {document.tipo}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.sefazProtocol')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{richDoc.protocoloAutorizacao || 'Não disponível'}</p>
                  </div>
                </div>
              </div>

              {/* Value */}
              <div className="text-center">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(document.valorTotal)}</p>
                  <p className="text-sm text-green-700">{t('electronicDocs.view.totalDocument')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Access Key */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('electronicDocs.view.accessKeyLabel')}</h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="font-mono text-lg text-gray-900 dark:text-white break-all">{document.chaveAcesso}</p>
            </div>
          </div>

          {/* Emitente Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('electronicDocs.view.senderData')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Building className="text-blue-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.companyName')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{document.emitente.razaoSocial}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Hash className="text-green-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.cnpj')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{document.emitente.cnpj}</p>
                  </div>
                </div>
                
                {document.emitente.inscricaoEstadual && (
                  <div className="flex items-center space-x-3">
                    <FileText className="text-purple-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.ie')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{document.emitente.inscricaoEstadual}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="text-red-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.address')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{richDoc.emitente.endereco}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="text-orange-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.city')} / {t('electronicDocs.view.uf')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{richDoc.emitente.cidade} - {richDoc.emitente.uf}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="text-teal-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.cep')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{richDoc.emitente.cep}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Destinatário Information (if exists) */}
          {document.destinatario && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('electronicDocs.view.recipientData')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Building className="text-blue-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.companyName')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{document.destinatario.razaoSocial}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Hash className="text-green-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.cnpj')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{document.destinatario.cnpjCpf}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="text-red-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.address')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{richDoc.destinatario?.endereco || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="text-orange-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.city')} / {t('electronicDocs.view.uf')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{(richDoc.destinatario?.cidade && richDoc.destinatario?.uf) ? `${richDoc.destinatario.cidade} - ${richDoc.destinatario.uf}` : '-'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="text-teal-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.cep')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{richDoc.destinatario?.cep || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Financial Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('electronicDocs.view.totals')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(document.valorTotal)}</p>
                <p className="text-sm text-green-700">{t('electronicDocs.view.totalDocument')}</p>
              </div>
              
              {document.valorIcms && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(document.valorIcms)}</p>
                  <p className="text-sm text-blue-700">ICMS</p>
                </div>
              )}
              
              {document.valorFrete && (
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(document.valorFrete)}</p>
                  <p className="text-sm text-purple-700">{t('electronicDocs.view.freight')}</p>
                </div>
              )}
            </div>
          </div>

          {/* CTe Specific Information */}
          {document.tipo === 'CTe' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('electronicDocs.view.transportInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {document.pesoTotal && (
                  <div className="flex items-center space-x-3">
                    <Package className="text-orange-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.totalWeight')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{document.pesoTotal} kg</p>
                    </div>
                  </div>
                )}
                
                {document.modalTransporte && (
                  <div className="flex items-center space-x-3">
                    <Truck className="text-blue-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.transportMode')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{document.modalTransporte}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('electronicDocs.view.dates')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <Calendar className="text-green-500" size={20} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.view.authorizationDate')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(richDoc.dataAutorizacao)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('electronicDocs.card.importedAt')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(document.dataImportacao)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* XML Content */}
          {document.xmlContent && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('electronicDocs.view.xmlContent')}</h3>
                <button
                  onClick={() => setShowXml(!showXml)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>{showXml ? t('electronicDocs.view.hideXml') : t('electronicDocs.view.showXml')}</span>
                  {showXml ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
              
              {showXml && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                  <pre className="text-xs text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap break-all">
                    {document.xmlContent}
                  </pre>
                </div>
              )}
              
              {!showXml && (
                <div className="flex items-center justify-center space-x-2 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg text-gray-500 dark:text-gray-400">
                  <Code size={24} />
                  <span>{t('electronicDocs.view.clickShowXml')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};