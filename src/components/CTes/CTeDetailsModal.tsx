import React, { useState } from 'react';
import { X, FileText, Download, Printer, Calendar, Truck, DollarSign, User, MapPin, Building, Package, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DactePreview } from '../ElectronicDocuments/DactePreview';
interface CTeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cte: any;
}

export const CTeDetailsModal: React.FC<CTeDetailsModalProps> = ({
  isOpen,
  onClose,
  cte
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'values' | 'parties' | 'invoices'>('basic');
  const [enrichedInvoices, setEnrichedInvoices] = useState<any[]>([]);
  const [enriching, setEnriching] = useState(false);
  const [showDacte, setShowDacte] = useState(false);

  React.useEffect(() => {
    const enrichInvoices = async () => {
      if (isOpen && cte?.invoices && cte.invoices.length > 0) {
        setEnriching(true);
        const enriched = [...cte.invoices];
        
        for (let i = 0; i < enriched.length; i++) {
          const inv = enriched[i];
          const matchKey = inv.observations?.match(/Chave:\s*([0-9]{44})/);
          let nfeData = null;
          
          if (matchKey && matchKey[1]) {
            inv.access_key = matchKey[1]; // fallback
            const { data } = await (supabase as any).from('invoices_nfe').select('numero, data_emissao, valor_total, chave_acesso').eq('chave_acesso', matchKey[1]).maybeSingle();
            if (data) nfeData = data;
          } else if (inv.number) {
            const { data } = await (supabase as any).from('invoices_nfe').select('numero, data_emissao, valor_total, chave_acesso').eq('numero', inv.number).maybeSingle();
            if (data) nfeData = data;
          }
          
          if (nfeData) {
            inv.issue_date = (nfeData as any).data_emissao;
            inv.value = Number((nfeData as any).valor_total || 0);
            inv.access_key = (nfeData as any).chave_acesso;
          } else {
            inv.value = Number(inv.cost_value || 0);
          }
        }
        
        setEnrichedInvoices(enriched);
        setEnriching(false);
      } else {
        setEnrichedInvoices([]);
      }
    };
    
    enrichInvoices();
  }, [cte, isOpen]);

  const handleDownloadXml = () => {
    const xmlContent = cte?.xml_data?.original || cte?.xml_data;
    if (!xmlContent || typeof xmlContent !== 'string') {
      alert('XML não disponível para este CT-e');
      return;
    }
    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CTE_${cte.access_key || cte.number || 'xml'}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  let remetenteInfo: any = {};
  let destinatarioInfo: any = {};
  
  if (cte?.xml_data && (cte.xml_data.original || typeof cte.xml_data === 'string')) {
    try {
      const xmlString = typeof cte.xml_data === 'string' ? cte.xml_data : cte.xml_data.original;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      
      const rem = xmlDoc.querySelector('rem');
      if (rem) {
        const ender = rem.querySelector('enderReme');
        remetenteInfo = {
          nome: rem.querySelector('xNome')?.textContent,
          cnpj: rem.querySelector('CNPJ')?.textContent || rem.querySelector('CPF')?.textContent,
          ie: rem.querySelector('IE')?.textContent,
          endereco: ender ? `${ender.querySelector('xLgr')?.textContent || ''}, ${ender.querySelector('nro')?.textContent || 'S/N'} ${ender.querySelector('xBairro')?.textContent ? '- ' + ender.querySelector('xBairro')?.textContent : ''}` : '',
          cidade: ender?.querySelector('xMun')?.textContent,
          uf: ender?.querySelector('UF')?.textContent,
          cep: ender?.querySelector('CEP')?.textContent
        };
      }

      const dest = xmlDoc.querySelector('dest');
      if (dest) {
        const ender = dest.querySelector('enderDest');
        destinatarioInfo = {
          nome: dest.querySelector('xNome')?.textContent,
          cnpj: dest.querySelector('CNPJ')?.textContent || dest.querySelector('CPF')?.textContent,
          ie: dest.querySelector('IE')?.textContent,
          endereco: ender ? `${ender.querySelector('xLgr')?.textContent || ''}, ${ender.querySelector('nro')?.textContent || 'S/N'} ${ender.querySelector('xBairro')?.textContent ? '- ' + ender.querySelector('xBairro')?.textContent : ''}` : '',
          cidade: ender?.querySelector('xMun')?.textContent,
          uf: ender?.querySelector('UF')?.textContent,
          cep: ender?.querySelector('CEP')?.textContent
        };
      }
    } catch (e) {
// null
    }
  }

  const dacteDoc: any = {
    tipo: 'CTe',
    modelo: '57',
    numeroDocumento: cte?.number || '',
    serie: cte?.series || '',
    chaveAcesso: cte?.access_key || '',
    dataAutorizacao: cte?.issue_date || new Date().toISOString(),
    protocoloAutorizacao: cte?.observations?.match(/Protocolo:\s*([0-9]+)/)?.[1] || '',
    emitente: {
      razaoSocial: cte?.carrier?.razao_social || 'Emitente',
      cnpj: cte?.carrier?.cnpj || cte?.carrier_document || '',
      inscricaoEstadual: cte?.carrier?.metadata?.inscricao_estadual || cte?.carrier?.inscricao_estadual || '',
      endereco: cte?.carrier?.endereco || '',
      cidade: cte?.carrier?.cidade || '',
      uf: cte?.carrier?.uf || '',
      cep: cte?.carrier?.cep || ''
    },
    remetente: {
      razaoSocial: remetenteInfo.nome || cte?.sender_name || '',
      cnpj: remetenteInfo.cnpj || cte?.sender_document || '',
      inscricaoEstadual: remetenteInfo.ie || '',
      endereco: remetenteInfo.endereco || '',
      cidade: remetenteInfo.cidade || cte?.sender_city || '',
      uf: remetenteInfo.uf || cte?.sender_state || '',
      cep: remetenteInfo.cep || ''
    },
    destinatario: {
      razaoSocial: destinatarioInfo.nome || cte?.recipient_name || '',
      cnpjCpf: destinatarioInfo.cnpj || cte?.recipient_document || '',
      inscricaoEstadual: destinatarioInfo.ie || '',
      endereco: destinatarioInfo.endereco || cte?.recipient_address || '',
      cidade: destinatarioInfo.cidade || cte?.recipient_city || '',
      uf: destinatarioInfo.uf || cte?.recipient_state || '',
      cep: destinatarioInfo.cep || cte?.recipient_zip_code || ''
    },
    valorTotal: cte?.total_value || 0,
    valorFrete: cte?.freight_weight_value || cte?.total_value || 0,
    pesoTotal: cte?.cargo_weight || cte?.total_weight || 0,
    valorIcms: cte?.icms_value
  };
  if (!isOpen || !cte) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    if (!value) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Importado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100'; // Like Emitido
      case 'Auditado e aprovado':
        return 'bg-green-600 text-white dark:bg-green-700 dark:text-green-50';
      case 'Auditado e reprovado':
        return 'bg-orange-600 text-white dark:bg-orange-700 dark:text-orange-50';
      case 'Com NF-e Referenciada':
        return 'bg-indigo-600 text-white dark:bg-indigo-700 dark:text-indigo-50'; // Strong tonal
      case 'Cancelado':
        return 'bg-red-600 text-white dark:bg-red-700 dark:text-red-50'; // Like Cancelado
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    return status;
  };

  const formatChaveAcesso = (chave: string) => {
    if (!chave) return '-';
    return chave.match(/.{1,4}/g)?.join(' ') || chave;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <Truck size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalhes do CT-e</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowDacte(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            >
              <Printer size={16} />
              <span>Imprimir DACTE</span>
            </button>
            <button
              onClick={handleDownloadXml}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            >
              <Download size={16} />
              <span>Download XML</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText size={16} />
                <span>Dados Básicos</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('values')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'values'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <DollarSign size={16} />
                <span>Valores</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('parties')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'parties'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User size={16} />
                <span>Partes Envolvidas</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'invoices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Package size={16} />
                <span>Notas Fiscais</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">CT-e {cte.number}</h3>
                  <p className="text-gray-600 dark:text-gray-400">Série: {cte.series || '0'} | Emissão: {formatDate(cte.issue_date)}</p>
                </div>
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(cte.status)}`}>
                  {getStatusLabel(cte.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações do CT-e</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <FileText className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Número</p>
                          <p className="font-medium text-gray-900 dark:text-white">{cte.number}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <FileText className="text-purple-500 flex-shrink-0 mt-1" size={20} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Série</p>
                          <p className="font-medium text-gray-900 dark:text-white">{cte.series || '0'}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Truck className="text-green-500 flex-shrink-0 mt-1" size={20} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Tipo de Frete</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {cte.freight_type === 'CIF' ? 'CIF (Pago)' : 'FOB (A Pagar)'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Building className="text-orange-500 flex-shrink-0 mt-1" size={20} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Origem</p>
                          <p className="font-medium text-gray-900 dark:text-white">{cte.origin || 'XML'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Datas</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Calendar className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Data de Emissão</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(cte.issue_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Calendar className="text-green-500 flex-shrink-0 mt-1" size={20} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Data de Entrada</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(cte.entry_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Calendar className="text-purple-500 flex-shrink-0 mt-1" size={20} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Data de Integração</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(cte.integration_date)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transportador</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Truck className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Transportadora</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {cte.carrier?.razao_social || cte.carrier_id || '-'}
                          </p>
                        </div>
                      </div>
                      {cte.carrier?.codigo && (
                        <div className="flex items-start space-x-3">
                          <FileText className="text-purple-500 flex-shrink-0 mt-1" size={20} />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Código</p>
                            <p className="font-medium text-gray-900 dark:text-white">{cte.carrier.codigo}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Chave de Acesso</h4>
                    <div className="flex items-start space-x-3">
                      <FileText className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Chave</p>
                        <p className="font-medium text-gray-900 dark:text-white font-mono text-sm break-all bg-white dark:bg-gray-800 p-3 rounded border border-gray-300">
                          {formatChaveAcesso(cte.access_key)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {cte.observations && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Observações</h4>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{cte.observations}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'values' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="text-blue-600" size={24} />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Valor do Frete Peso</p>
                      <p className="text-2xl font-bold text-blue-900">{formatCurrency(cte.freight_weight_value)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="text-green-600" size={24} />
                    <div>
                      <p className="text-sm text-green-600 font-medium">Valor do Frete Valor</p>
                      <p className="text-2xl font-bold text-green-900">{formatCurrency(cte.freight_value_value)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="text-purple-600" size={24} />
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Valor Total</p>
                      <p className="text-2xl font-bold text-purple-900">{formatCurrency(cte.total_value)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Componentes do Frete</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">SEC/CAT</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cte.seccat_value)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Despacho</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cte.dispatch_value)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">ADEME/GRIS</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cte.ademe_gris_value)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">ITR</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cte.itr_value)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">TAS</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cte.tas_value)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Coleta/Entrega</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cte.collection_delivery_value)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Pedagio</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cte.toll_value)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 dark:text-gray-400">Outras Taxas</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cte.other_tax_value)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Impostos</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">ICMS - Alíquota</span>
                      <span className="font-medium text-gray-900 dark:text-white">{cte.icms_rate || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">ICMS - Base</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cte.icms_base)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">ICMS - Valor</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cte.icms_value)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">PIS</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cte.pis_value)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">COFINS</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cte.cofins_value)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 dark:text-gray-400">Outros</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cte.other_value)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'parties' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <User className="text-blue-600" size={20} />
                    <span>Remetente</span>
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Nome/Razão Social</p>
                      <p className="font-medium text-gray-900 dark:text-white">{cte.sender_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Documento</p>
                      <p className="font-medium text-gray-900 dark:text-white">{cte.sender_document || '-'}</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="text-blue-500 flex-shrink-0 mt-1" size={16} />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Localização</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {cte.sender_city && cte.sender_state
                            ? `${cte.sender_city} - ${cte.sender_state}`
                            : '-'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <User className="text-green-600" size={20} />
                    <span>Destinatário</span>
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Nome/Razão Social</p>
                      <p className="font-medium text-gray-900 dark:text-white">{cte.recipient_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Documento</p>
                      <p className="font-medium text-gray-900 dark:text-white">{cte.recipient_document || '-'}</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="text-green-500 flex-shrink-0 mt-1" size={16} />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Localização</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {cte.recipient_city && cte.recipient_state
                            ? `${cte.recipient_city} - ${cte.recipient_state}`
                            : '-'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <Building className="text-purple-600" size={20} />
                    <span>Expedidor</span>
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Nome/Razão Social</p>
                      <p className="font-medium text-gray-900 dark:text-white">{cte.shipper_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Documento</p>
                      <p className="font-medium text-gray-900 dark:text-white">{cte.shipper_document || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <Building className="text-orange-600" size={20} />
                    <span>Recebedor</span>
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Nome/Razão Social</p>
                      <p className="font-medium text-gray-900 dark:text-white">{cte.receiver_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Documento</p>
                      <p className="font-medium text-gray-900 dark:text-white">{cte.receiver_document || '-'}</p>
                    </div>
                  </div>
                </div>

                {(cte.payer_name || cte.payer_document) && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 md:col-span-2">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                      <DollarSign className="text-red-600" size={20} />
                      <span>Tomador do Serviço</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Nome/Razão Social</p>
                        <p className="font-medium text-gray-900 dark:text-white">{cte.payer_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Documento</p>
                        <p className="font-medium text-gray-900 dark:text-white">{cte.payer_document || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Notas Fiscais Vinculadas</h4>
                </div>

                {enriching ? (
                  <div className="p-8 flex flex-col items-center text-center text-gray-500 dark:text-gray-400">
                    <Loader2 size={48} className="mx-auto mb-4 text-blue-500 animate-spin" />
                    <p>Carregando informações das notas fiscais...</p>
                  </div>
                ) : enrichedInvoices.length > 0 ? (
                  <div className="overflow-x-auto">
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
                            Chave
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                        {enrichedInvoices.map((invoice: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50 dark:bg-gray-900">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {invoice.number || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {invoice.series || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(invoice.issue_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {formatCurrency(invoice.value)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono text-xs">
                              {invoice.access_key ? formatChaveAcesso(invoice.access_key).substring(0, 20) + '...' : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Package size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>Nenhuma nota fiscal vinculada a este CT-e</p>
                  </div>
                )}
              </div>

              {!enriching && enrichedInvoices.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total de NF-es</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{enrichedInvoices.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Valor Total</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(enrichedInvoices.reduce((sum: number, inv: any) => sum + (inv.value || 0), 0))}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Valor Médio</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(
                          enrichedInvoices.reduce((sum: number, inv: any) => sum + (inv.value || 0), 0) / enrichedInvoices.length
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {showDacte && (
        <DactePreview
          document={dacteDoc}
          onClose={() => setShowDacte(false)}
        />
      )}
    </div>
  );
};
