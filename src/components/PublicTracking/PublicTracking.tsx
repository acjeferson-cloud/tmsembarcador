import React, { useState, useEffect } from 'react';
import { Package, Search, MapPin, Calendar, Truck, DollarSign, CheckCircle, Clock, XCircle, AlertCircle, ChevronDown, ChevronUp, ShoppingCart, X, Shield } from 'lucide-react';
import { publicTrackingService, PublicTrackingInfo } from '../../services/publicTrackingService';
import { loadRecaptcha, executeRecaptcha } from '../../utils/recaptchaLoader';

const PublicTracking: React.FC = () => {
  const [trackingCode, setTrackingCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('codigo') || '';
  });
  const [trackingInfo, setTrackingInfo] = useState<PublicTrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [autoSearchPending, setAutoSearchPending] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!(params.get('codigo') || params.get('q'));
  });

  useEffect(() => {
    loadRecaptcha().then(() => {
      setRecaptchaReady(true);
    }).catch((err) => {
      console.error('Erro ao carregar reCAPTCHA:', err);
    });
  }, []);

  useEffect(() => {
    if (recaptchaReady && autoSearchPending && trackingCode) {
      setAutoSearchPending(false);
      handleSearch();
    }
  }, [recaptchaReady, autoSearchPending, trackingCode]);

  const handleSearch = async () => {
    if (!trackingCode.trim()) {
      setError('Por favor, informe o código de rastreamento');
      return;
    }

    if (honeypot) {
      console.warn('Honeypot triggered - bot detected');
      setError('Erro ao processar solicitação. Tente novamente mais tarde.');
      return;
    }

    setLoading(true);
    setError(null);
    setTrackingInfo(null);

    try {
      let recaptchaToken = '';
      if (recaptchaReady) {
        try {
          recaptchaToken = await executeRecaptcha('tracking_search');
        } catch (err) {
          console.error('Erro ao executar reCAPTCHA:', err);
        }
      }

      const result = await publicTrackingService.getByTrackingCodeSecure(
        trackingCode,
        recaptchaToken,
        sessionId
      );

      if (result.success && result.data) {
        setTrackingInfo(result.data);
      } else if (result.blocked) {
        setError(result.message || 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
      } else {
        setError(result.message || 'Código de rastreamento não encontrado');
      }
    } catch (err: any) {
      if (err.message?.includes('bloqueado') || err.message?.includes('limite')) {
        setError('Limite de consultas excedido. Por favor, aguarde alguns minutos.');
      } else {
        setError('Erro ao consultar pedido. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      pending: {
        label: 'Pendente',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="w-4 h-4" />
      },
      confirmed: {
        label: 'Confirmado',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <CheckCircle className="w-4 h-4" />
      },
      in_transit: {
        label: 'Em Trânsito',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: <Truck className="w-4 h-4" />
      },
      delivered: {
        label: 'Entregue',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="w-4 h-4" />
      },
      cancelled: {
        label: 'Cancelado',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="w-4 h-4" />
      }
    };

    return statusMap[status] || {
      label: status,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: <AlertCircle className="w-4 h-4" />
    };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Buscando...' : 'Rastrear'}
            </button>
          </div>

          {recaptchaReady && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Shield className="w-3 h-3" />
              <span>Protegido por reCAPTCHA v3</span>
            </div>
          )}

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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Status Atual</h2>
                <div className={`px-4 py-2 rounded-xl border-2 flex items-center gap-2 font-semibold ${getStatusInfo(trackingInfo.status).color}`}>
                  {getStatusInfo(trackingInfo.status).icon}
                  {getStatusInfo(trackingInfo.status).label}
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

            {/* Timeline */}
            {trackingInfo.delivery_status && trackingInfo.delivery_status.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Histórico de Rastreamento</h2>

                <div className="space-y-4">
                  {trackingInfo.delivery_status
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((status, index) => (
                      <div key={status.id || index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                          {index < trackingInfo.delivery_status.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 my-1" />
                          )}
                        </div>

                        <div className="flex-1 pb-6">
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-bold text-gray-900 dark:text-white">{status.status}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{formatDateTime(status.date)}</p>
                            </div>

                            {status.location && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                {status.location}
                              </p>
                            )}

                            {status.observation && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{status.observation}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicTracking;
