import React, { useState, useEffect } from 'react';
import { Package, Search, MapPin, Calendar, Truck, DollarSign, CheckCircle, Clock, XCircle, AlertCircle, ChevronDown, ChevronUp, ShoppingCart, X, Shield, FileText, Box } from 'lucide-react';
import { publicTrackingService, PublicTrackingInfo } from '../../services/publicTrackingService';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { UnifiedTrackingTimeline } from '../Shared/UnifiedTrackingTimeline';
import { ViewOccurrencesModal } from '../Invoices/ViewOccurrencesModal';

const PublicTracking: React.FC = () => {
  const [trackingCode, setTrackingCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('codigo') || '';
  });
  const [trackingInfo, setTrackingInfo] = useState<PublicTrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showOccurrencesModal, setShowOccurrencesModal] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const turnstileRef = React.useRef<TurnstileInstance>(null);
  
  const turnstileSiteKey = '0x4AAAAAACwBQZiSuRibNl-J';

  const [honeypot, setHoneypot] = useState('');
  const [autoSearchPending, setAutoSearchPending] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!(params.get('codigo') || params.get('q'));
  });

  useEffect(() => {
    if (turnstileToken && autoSearchPending && trackingCode) {
      setAutoSearchPending(false);
      handleSearch();
    }
  }, [turnstileToken, autoSearchPending, trackingCode]);

  const handleSearch = async () => {
    if (!trackingCode.trim()) {
      setError('Por favor, informe o código de rastreamento');
      return;
    }

    if (honeypot) {
      setError('Erro ao processar solicitação. Tente novamente mais tarde.');
      return;
    }

    if (!turnstileToken) {
      setError('Por favor, aguarde a verificação de segurança (Cloudflare).');
      return;
    }

    setLoading(true);
    setError(null);
    setTrackingInfo(null);

    try {
      const result = await publicTrackingService.getByTrackingCodeSecure(
        trackingCode,
        turnstileToken
      );

      if (result.success && result.data) {
        setTrackingInfo(result.data);
      } else if (result.blocked) {
        setError(result.message || 'Validação falhou. Tente atualizar a página.');
        turnstileRef.current?.reset();
      } else {
        setError(result.message || 'Código de rastreamento não encontrado');
        turnstileRef.current?.reset();
      }
    } catch (err: any) {
      if (err.message?.includes('bloqueado') || err.message?.includes('limite')) {
        setError('Limite de consultas excedido. Por favor, aguarde alguns minutos.');
      } else {
        setError('Erro ao consultar pedido. Tente novamente.');
      }
      turnstileRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusInfo = (rawStatus: string) => {
    const status = (rawStatus || '').toLowerCase();
    
    // Padrão de cores baseado na tela de PEDIDOS
    const result = {
      label: rawStatus || 'Pendente',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: <Clock className="w-4 h-4" />
    };

    if (status.includes('emitid')) {
      result.label = 'Emitido';
      result.color = 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      result.icon = <FileText className="w-4 h-4" />;
    } else if (status.includes('coletad') || status.includes('coleta_realizada')) {
      result.label = 'Coletado';
      result.color = 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800';
      result.icon = <Box className="w-4 h-4" />;
    } else if (status.includes('trânsito') || status.includes('transito') || status.includes('em viagem')) {
      result.label = 'Em Trânsito';
      result.color = 'bg-blue-600 text-white border-blue-700 dark:bg-blue-700 dark:border-blue-600';
      result.icon = <Truck className="w-4 h-4" />;
    } else if (status.includes('saiu') || status.includes('rota')) {
      result.label = 'Saiu para Entrega';
      result.color = 'bg-orange-500 text-white border-orange-600 dark:bg-orange-600 dark:border-orange-500';
      result.icon = <Truck className="w-4 h-4" />;
    } else if (status.includes('entregue') || status.includes('finalizad')) {
      result.label = 'Entregue';
      result.color = 'bg-green-600 text-white border-green-700 dark:bg-green-700 dark:border-green-600';
      result.icon = <CheckCircle className="w-4 h-4" />;
    } else if (status.includes('cancelad')) {
      result.label = 'Cancelado';
      result.color = 'bg-red-600 text-white border-red-700 dark:bg-red-700 dark:border-red-600';
      result.icon = <XCircle className="w-4 h-4" />;
    } else if (status === 'pendente') {
      result.label = 'Pendente';
      result.color = 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
    }

    return result;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/veio-de-drone-camiao-no-porto-de-embarque-para-transporte-de-carga-e-logistica-empresarial.jpg')`
          }}
        ></div>
        <div className="absolute inset-0 bg-white dark:bg-gray-800/85 backdrop-blur-sm"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Rastreamento de Pedido
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe seu pedido em tempo real
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Código de Rastreamento
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="Ex: 0000-0-00-0000-0"
              className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-lg font-mono uppercase placeholder:text-sm placeholder:font-sans placeholder:normal-case"
              autoComplete="off"
            />
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !turnstileToken}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Buscando...' : 'Rastrear'}
            </button>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex justify-start">
              <Turnstile 
                ref={turnstileRef}
                siteKey={turnstileSiteKey} 
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setError('A validação anti-bot falhou. Tente atualizar a página.')}
                options={{
                  theme: 'light',
                  size: 'normal',
                }}
              />
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Shield className="w-3 h-3" />
              <span>Protegido por Cloudflare Turnstile</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Tracking Info */}
        {trackingInfo && (
          <div className="space-y-6 animate-fadeIn">
            {/* Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Status Atual</h2>
                <div className="flex items-center gap-3">
                  {/* Comprovante Button */}
                  {(trackingInfo.status?.toLowerCase().includes('entregue') || trackingInfo.status?.toLowerCase().includes('finalizad')) && trackingInfo.raw_tracking_data && (
                    <button
                      onClick={() => setShowOccurrencesModal(true)}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all font-semibold shadow-md active:scale-95 text-sm"
                      title="Clique para ver quem assinou a entrega e as comprovações"
                    >
                      <FileText className="w-4 h-4" />
                      Ver Comprovante
                    </button>
                  )}
                  
                  <div className={`px-4 py-2 rounded-xl border-2 flex items-center gap-2 font-semibold shadow-sm ${getStatusInfo(trackingInfo.status).color}`}>
                    {getStatusInfo(trackingInfo.status).icon}
                    {getStatusInfo(trackingInfo.status).label}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Número do Pedido</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{trackingInfo.order_number}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Transportadora</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{trackingInfo.carrier_name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Destino</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">
                        {trackingInfo.destination_city} - {trackingInfo.destination_state}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Data de Emissão</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{formatDate(trackingInfo.issue_date)}</p>
                    </div>
                  </div>

                  {trackingInfo.expected_delivery && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Previsão de Entrega</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white">{formatDate(trackingInfo.expected_delivery)}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Valor do Pedido</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(trackingInfo.order_value)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão "Clique aqui para mais informações" */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-base underline transition-colors"
                >
                  Clique aqui para mais informações
                  {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Seção Expansível - Itens do Pedido */}
            {showDetails && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden animate-fadeIn">
                {/* Header com Botão Fechar */}
                <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Itens do Pedido</h2>
                    </div>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      aria-label="Fechar"
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo - Itens do Pedido */}
                <div className="p-6">
                  <div>
                      {trackingInfo.order_items && trackingInfo.order_items.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">CÓDIGO</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">DESCRIÇÃO</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">QUANTIDADE</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">VALOR UNITÁRIO</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">VALOR TOTAL</th>
                              </tr>
                            </thead>
                            <tbody>
                              {trackingInfo.order_items.map((item, index) => (
                                <tr key={item.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">{item.product_code}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.product_description}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-center font-semibold">{item.quantity}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">{formatCurrency(item.unit_price)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right font-bold">{formatCurrency(item.total_price)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Totais */}
                          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                              <p className="text-sm text-blue-700 font-medium mb-1">Total de Itens</p>
                              <p className="text-2xl font-bold text-blue-900">
                                {trackingInfo.order_items.reduce((sum, item) => sum + item.quantity, 0)}
                              </p>
                            </div>

                            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                              <p className="text-sm text-green-700 font-medium mb-1">Valor dos Produtos</p>
                              <p className="text-2xl font-bold text-green-900">
                                {formatCurrency(trackingInfo.order_items.reduce((sum, item) => sum + item.total_price, 0))}
                              </p>
                            </div>

                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                              <p className="text-sm text-purple-700 font-medium mb-1">Valor Total do Pedido</p>
                              <p className="text-2xl font-bold text-purple-900">{formatCurrency(trackingInfo.order_value)}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400">Nenhum item encontrado neste pedido</p>
                        </div>
                      )}
                    </div>
                </div>
              </div>
            )}

            {/* Timeline Integrada Padrão */}
            {trackingInfo.raw_tracking_data && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-700 overflow-hidden animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Histórico de Rastreamento</h2>
                <div className="pl-2">
                  <UnifiedTrackingTimeline 
                    trackingData={trackingInfo.raw_tracking_data} 
                  />
                </div>
              </div>
            )}
            {/* Modals Extras */}
            {showOccurrencesModal && trackingInfo.raw_tracking_data && (
              <ViewOccurrencesModal
                isOpen={showOccurrencesModal}
                onClose={() => setShowOccurrencesModal(false)}
                invoice={trackingInfo.raw_tracking_data.invoice || trackingInfo.raw_tracking_data.order || trackingInfo.raw_tracking_data.cte}
                trackingData={trackingInfo.raw_tracking_data}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicTracking;
