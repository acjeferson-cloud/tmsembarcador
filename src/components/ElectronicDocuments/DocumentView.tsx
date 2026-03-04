import React, { useState } from 'react';
import { ArrowLeft, FileText, Download, Calendar, Clock, Building, MapPin, Hash, DollarSign, Package, Truck, RefreshCw, Code, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import { ElectronicDocument } from '../../data/electronicDocumentsData';
import { DanfePreview } from './DanfePreview';
import { DactePreview } from './DactePreview';
import { formatCurrency } from '../../utils/formatters';
import { generatePDF } from '../../services/pdfService';

interface DocumentViewProps {
  onBack: () => void;
  document: ElectronicDocument;
  onProcessDocument: (documentId: number, action: 'danfe' | 'dacte') => void;
  isProcessing: boolean;
}

export const DocumentView: React.FC<DocumentViewProps> = ({ onBack, document, onProcessDocument, isProcessing }) => {
  const [showXml, setShowXml] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const getStatusColor = (status: string) => {
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
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getActionButtonText = () => {
    return document.tipo === 'NFe' ? 'Gerar DANFE' : 'Gerar DACTE';
  };

  const getActionType = (): 'danfe' | 'dacte' => {
    return document.tipo === 'NFe' ? 'danfe' : 'dacte';
  };

  const handleProcessDocument = () => {
    onProcessDocument(document.id, getActionType());
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
            <span>Voltar para Documentos Eletrônicos</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visualizar Documento</h1>
              <p className="text-gray-600 dark:text-gray-400">Detalhes completos do documento eletrônico</p>
            </div>
            {document.status === 'autorizado' && (
              <button
                onClick={handleProcessDocument}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                {isProcessing ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <Printer size={20} />
                )}
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
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{document.tipo} - Modelo {document.modelo}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Série</p>
                    <p className="font-medium text-gray-900 dark:text-white">{document.serie}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                      {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tipo</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(document.tipo)}`}>
                      {document.tipo}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Protocolo SEFAZ</p>
                    <p className="font-medium text-gray-900 dark:text-white">{document.protocoloAutorizacao}</p>
                  </div>
                </div>
              </div>

              {/* Value */}
              <div className="text-center">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(document.valorTotal)}</p>
                  <p className="text-sm text-green-700">Valor Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Access Key */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Chave de Acesso</h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="font-mono text-lg text-gray-900 dark:text-white break-all">{document.chaveAcesso}</p>
            </div>
          </div>

          {/* Emitente Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dados do Emitente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Building className="text-blue-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Razão Social</p>
                    <p className="font-medium text-gray-900 dark:text-white">{document.emitente.razaoSocial}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Hash className="text-green-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">CNPJ</p>
                    <p className="font-medium text-gray-900 dark:text-white">{document.emitente.cnpj}</p>
                  </div>
                </div>
                
                {document.emitente.inscricaoEstadual && (
                  <div className="flex items-center space-x-3">
                    <FileText className="text-purple-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Inscrição Estadual</p>
                      <p className="font-medium text-gray-900 dark:text-white">{document.emitente.inscricaoEstadual}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="text-red-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Endereço</p>
                    <p className="font-medium text-gray-900 dark:text-white">{document.emitente.endereco}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="text-orange-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cidade/UF</p>
                    <p className="font-medium text-gray-900 dark:text-white">{document.emitente.cidade} - {document.emitente.uf}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="text-teal-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">CEP</p>
                    <p className="font-medium text-gray-900 dark:text-white">{document.emitente.cep}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Destinatário Information (if exists) */}
          {document.destinatario && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dados do Destinatário</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Building className="text-blue-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Razão Social</p>
                      <p className="font-medium text-gray-900 dark:text-white">{document.destinatario.razaoSocial}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Hash className="text-green-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">CNPJ/CPF</p>
                      <p className="font-medium text-gray-900 dark:text-white">{document.destinatario.cnpjCpf}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="text-red-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Endereço</p>
                      <p className="font-medium text-gray-900 dark:text-white">{document.destinatario.endereco}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="text-orange-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Cidade/UF</p>
                      <p className="font-medium text-gray-900 dark:text-white">{document.destinatario.cidade} - {document.destinatario.uf}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Financial Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Financeiras</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(document.valorTotal)}</p>
                <p className="text-sm text-green-700">Valor Total</p>
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
                  <p className="text-sm text-purple-700">Frete</p>
                </div>
              )}
            </div>
          </div>

          {/* CTe Specific Information */}
          {document.tipo === 'CTe' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações de Transporte (CTe)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {document.pesoTotal && (
                  <div className="flex items-center space-x-3">
                    <Package className="text-orange-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Peso Total</p>
                      <p className="font-medium text-gray-900 dark:text-white">{document.pesoTotal} kg</p>
                    </div>
                  </div>
                )}
                
                {document.modalTransporte && (
                  <div className="flex items-center space-x-3">
                    <Truck className="text-blue-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Modal de Transporte</p>
                      <p className="font-medium text-gray-900 dark:text-white">{document.modalTransporte}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Controle de Datas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <Calendar className="text-green-500" size={20} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Data/Hora de Autorização SEFAZ</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(document.dataAutorizacao)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Data/Hora de Importação no Sistema</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(document.dataImportacao)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* XML Content */}
          {document.xmlContent && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Conteúdo XML</h3>
                <button
                  onClick={() => setShowXml(!showXml)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>{showXml ? 'Ocultar XML' : 'Mostrar XML'}</span>
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
                  <span>Clique em "Mostrar XML" para visualizar o conteúdo completo do XML</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DANFE/DACTE Preview Modal */}
      {showPreview && document.tipo === 'NFe' && (
        <DanfePreview 
          document={document} 
          onClose={() => setShowPreview(false)} 
        />
      )}

      {showPreview && document.tipo === 'CTe' && (
        <DactePreview 
          document={document} 
          onClose={() => setShowPreview(false)} 
        />
      )}
    </>
  );
};