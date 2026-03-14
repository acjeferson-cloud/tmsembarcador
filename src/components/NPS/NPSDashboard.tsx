import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Users, Star, Award, Calendar, Filter, Eye, MessageSquare, X, Info, ThumbsUp, ThumbsDown } from 'lucide-react';
import { npsService } from '../../services/npsService';
import { InlineMessage } from '../common/InlineMessage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useInnovation, INNOVATION_IDS } from '../../hooks/useInnovation';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { TenantContextHelper } from '../../utils/tenantContext';
const getDefaultDates = () => {
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);
  const quarentaCincoDiasAtras = new Date(hoje);
  quarentaCincoDiasAtras.setDate(hoje.getDate() - 45);
  quarentaCincoDiasAtras.setHours(0, 0, 0, 0);
  return {
    inicio: quarentaCincoDiasAtras.toISOString(),
    fim: hoje.toISOString(),
  };
};

export const NPSDashboard: React.FC = () => {
  const { t } = useTranslation();
  const defaultDates = getDefaultDates();
  const { user, currentEstablishment } = useAuth();
  const { isActive: npsActive, isLoading: npsLoading } = useInnovation(
    INNOVATION_IDS.NPS,
    user?.id
  );
  const [estabelecimentoId, setEstabelecimentoId] = useState<string>('');
  const [tipoNPS, setTipoNPS] = useState<'cliente' | 'interno'>('cliente');
  const [periodoInicio, setPeriodoInicio] = useState<string>(defaultDates.inicio);
  const [periodoFim, setPeriodoFim] = useState<string>(defaultDates.fim);
  const [ranking, setRanking] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showAvaliacoesModal, setShowAvaliacoesModal] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [loadingAvaliacoes, setLoadingAvaliacoes] = useState(false);
  const [showCalculoModal, setShowCalculoModal] = useState(false);

  const loadRanking = useCallback(async () => {
    if (!estabelecimentoId || !periodoInicio || !periodoFim) return;

    try {
      setIsLoading(true);
      setError('');

      const data = await npsService.getRankingTransportadoras(
        estabelecimentoId,
        periodoInicio,
        periodoFim,
        tipoNPS
      );
      setRanking(data);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
      setError('Erro ao carregar dados. Tente novamente');
    } finally {
      setIsLoading(false);
    }
  }, [estabelecimentoId, periodoInicio, periodoFim, tipoNPS]);

  useEffect(() => {
    const fetchEstabelecimento = async () => {
      if (!user) return; 

      let finalId = '';
      
      try {
        const context = await TenantContextHelper.getCurrentContext();
        if (context?.environmentId) {
          finalId = context.environmentId;
        }
      } catch (e) {
        console.error('Erro ao recuperar TenantContext:', e);
      }

      // 1. Fallback: Tentar buscar a UUID real do estabelecimento baseada no Código presente na Sessão Ativa do React
      if (!finalId && currentEstablishment?.codigo && supabase) {
        try {
          const { data } = await supabase
            .from('establishments')
            .select('id')
            .eq('codigo', currentEstablishment.codigo)
            .maybeSingle();

          if ((data as any)?.id) {
            finalId = (data as any).id;
          }
        } catch (e) {
          console.error('Erro ao ler estabelecimento Auth Context:', e);
        }
      }

      // 2. Fallback Seguro Secundário: Obter diretamente do usuário logado se a aba de estabelecimento cair
      if (!finalId && user?.environment_id) {
         finalId = user.environment_id;
      }

      if (finalId) {
        setEstabelecimentoId(finalId);
      }
    };

    fetchEstabelecimento();
  }, [user, currentEstablishment]);

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);

  const getNPSColor = (nps: number) => {
    if (nps >= 75) return 'text-green-600';
    if (nps >= 50) return 'text-yellow-600';
    if (nps >= 0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getNPSLabel = (nps: number) => {
    if (nps >= 75) return t('nps.dashboard.classifications.excellent');
    if (nps >= 50) return t('nps.dashboard.classifications.good');
    if (nps >= 0) return t('nps.dashboard.classifications.regular');
    return t('nps.dashboard.classifications.bad');
  };

  const loadAvaliacoes = async () => {
    if (!estabelecimentoId) return;

    try {
      setLoadingAvaliacoes(true);
      let data;

      if (tipoNPS === 'cliente') {
        data = await npsService.getAvaliacoesCliente(
          estabelecimentoId,
          periodoInicio,
          periodoFim
        );
      } else {
        data = await npsService.getAvaliacoesInterno(
          estabelecimentoId,
          periodoInicio,
          periodoFim
        );
      }

      setAvaliacoes(data);
      setShowAvaliacoesModal(true);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      setError('Erro ao carregar avaliações. Tente novamente');
    } finally {
      setLoadingAvaliacoes(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotaColor = (nota: number) => {
    if (nota >= 9) return 'bg-green-100 text-green-800 border-green-300';
    if (nota >= 7) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getCategoriaCliente = (nota: number) => {
    if (nota >= 9) return t('nps.dashboard.categories.promoter');
    if (nota >= 7) return t('nps.dashboard.categories.neutral');
    return t('nps.dashboard.categories.detractor');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-blue-600" />
            {t('nps.dashboard.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('nps.dashboard.subtitle')}
          </p>
        </div>
      </div>

      {/* Innovation Notice */}
      {!npsActive && !npsLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              <strong>{t('nps.dashboard.notActiveWarningTitle')}</strong> {t('nps.dashboard.notActiveWarningDesc')}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTipoNPS('cliente')}
                className={`px-4 py-2 rounded-l-lg font-medium transition-colors ${
                  tipoNPS === 'cliente'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                {t('nps.dashboard.npsClientTitle')}
              </button>
              <button
                onClick={loadAvaliacoes}
                disabled={loadingAvaliacoes || !estabelecimentoId}
                className={`px-3 py-2 rounded-r-lg font-medium transition-colors border-l ${
                  tipoNPS === 'cliente'
                    ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={t('nps.dashboard.viewReceivedReviews')}
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTipoNPS('interno')}
                className={`px-4 py-2 rounded-l-lg font-medium transition-colors ${
                  tipoNPS === 'interno'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Award className="w-4 h-4 inline mr-2" />
                {t('nps.dashboard.npsInternalTitle')}
              </button>
              <button
                onClick={loadAvaliacoes}
                disabled={loadingAvaliacoes || !estabelecimentoId}
                className={`px-3 py-2 rounded-r-lg font-medium transition-colors border-l ${
                  tipoNPS === 'interno'
                    ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={t('nps.dashboard.viewInternalReviews')}
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowCalculoModal(true)}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            title={t('nps.dashboard.howCalculatedTooltip')}
          >
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">{t('nps.dashboard.howCalculated')}</span>
          </button>

          <div className="flex gap-2 ml-auto">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <input
                type="date"
                value={periodoInicio ? periodoInicio.split('T')[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const date = new Date(e.target.value + 'T00:00:00');
                    setPeriodoInicio(date.toISOString());
                  }
                }}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-600 dark:text-gray-400">{t('nps.dashboard.until')}</span>
              <input
                type="date"
                value={periodoFim ? periodoFim.split('T')[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const date = new Date(e.target.value + 'T23:59:59');
                    setPeriodoFim(date.toISOString());
                  }
                }}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <InlineMessage type="error" message={error} />
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">{t('nps.dashboard.loading')}</p>
          </div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {t('nps.dashboard.noReviews')}
            </p>
            <InlineMessage type="info" message={t('nps.dashboard.adjustFilters')} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('nps.dashboard.rankingTitle')}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ranking.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="razao_social" angle={-45} textAnchor="end" height={100} fontSize={12} />
                    <YAxis domain={[-100, 100]} />
                    <Tooltip />
                    <Bar dataKey="nps" fill="#3B82F6" name="NPS" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('nps.dashboard.top5Title')}
                </h3>
                <div className="space-y-3">
                  {ranking.slice(0, 5).map((item, index) => (
                    <div
                      key={item.transportador_id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.razao_social}
                          </p>
                          {item.total_respostas && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.total_respostas} {tipoNPS === 'cliente' ? t('nps.dashboard.answersWord') : t('nps.dashboard.deliveriesWord')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getNPSColor(item.nps)}`}>
                          {item.nps.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {getNPSLabel(item.nps)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('nps.dashboard.allCarriersTitle')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {t('nps.dashboard.tableHeaders.position')}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {t('nps.dashboard.tableHeaders.carrier')}
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {t('nps.dashboard.tableHeaders.nps')}
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {t('nps.dashboard.tableHeaders.classification')}
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {tipoNPS === 'cliente' ? t('nps.dashboard.tableHeaders.answers') : t('nps.dashboard.tableHeaders.deliveries')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {ranking.map((item, index) => (
                      <tr key={item.transportador_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {index + 1}º
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                          {item.razao_social}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-lg font-bold ${getNPSColor(item.nps)}`}>
                            {item.nps.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.nps >= 75
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : item.nps >= 50
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : item.nps >= 0
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {getNPSLabel(item.nps)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                          {item.total_respostas || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Avaliações Recebidas */}
      {showAvaliacoesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                {tipoNPS === 'cliente' ? t('nps.dashboard.modalReviews.clientTitle') : t('nps.dashboard.modalReviews.internalTitle')}
              </h3>
              <button
                onClick={() => setShowAvaliacoesModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingAvaliacoes ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">{t('nps.dashboard.modalReviews.loading')}</p>
                </div>
              ) : avaliacoes.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('nps.dashboard.modalReviews.empty')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {avaliacoes.map((avaliacao) => (
                    <div
                      key={avaliacao.id}
                      className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 border border-gray-200 dark:border-gray-700"
                    >
                      {tipoNPS === 'cliente' ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nps.dashboard.modalReviews.client')}</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {avaliacao.cliente_nome}
                              </p>
                              {avaliacao.cliente_email && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {avaliacao.cliente_email}
                                </p>
                              )}
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nps.dashboard.modalReviews.carrier')}</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {avaliacao.transportador?.razao_social || '-'}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nps.dashboard.modalReviews.note')}</p>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center justify-center w-12 h-12 rounded-lg font-bold text-xl border-2 ${getNotaColor(
                                    avaliacao.nota
                                  )}`}
                                >
                                  {avaliacao.nota}
                                </span>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {getCategoriaCliente(avaliacao.nota)}
                                  </p>
                                  <div className="flex gap-1">
                                    {[...Array(10)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < avaliacao.nota
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nps.dashboard.modalReviews.sendDate')}</p>
                              <p className="text-gray-900 dark:text-white">
                                {formatDate(avaliacao.data_envio)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nps.dashboard.modalReviews.replyDate')}</p>
                              <p className="text-gray-900 dark:text-white">
                                {formatDate(avaliacao.data_resposta)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nps.dashboard.modalReviews.status')}</p>
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  avaliacao.status === 'respondida'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : avaliacao.status === 'pendente'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                }`}
                              >
                                {avaliacao.status === 'respondida' ? t('nps.dashboard.modalReviews.statusReplied') : avaliacao.status === 'pendente' ? t('nps.dashboard.modalReviews.statusPending') : t('nps.dashboard.modalReviews.statusExpired')}
                              </span>
                            </div>
                          </div>

                          {avaliacao.opinioes && Object.keys(avaliacao.opinioes).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-semibold">{t('nps.dashboard.modalReviews.opinionsByCriteria')}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {avaliacao.opinioes.velocidade_processamento && (
                                  <div className="flex items-center gap-2">
                                    {avaliacao.opinioes.velocidade_processamento === 'positivo' ? (
                                      <ThumbsUp className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <ThumbsDown className="w-5 h-5 text-red-600" />
                                    )}
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {t('nps.dashboard.criterias.processingSpeed')}
                                    </span>
                                  </div>
                                )}
                                {avaliacao.opinioes.clareza_informacoes && (
                                  <div className="flex items-center gap-2">
                                    {avaliacao.opinioes.clareza_informacoes === 'positivo' ? (
                                      <ThumbsUp className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <ThumbsDown className="w-5 h-5 text-red-600" />
                                    )}
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {t('nps.dashboard.criterias.infoClarity')}
                                    </span>
                                  </div>
                                )}
                                {avaliacao.opinioes.pontualidade_entrega && (
                                  <div className="flex items-center gap-2">
                                    {avaliacao.opinioes.pontualidade_entrega === 'positivo' ? (
                                      <ThumbsUp className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <ThumbsDown className="w-5 h-5 text-red-600" />
                                    )}
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {t('nps.dashboard.criterias.deliveryPunctuality')}
                                    </span>
                                  </div>
                                )}
                                {avaliacao.opinioes.condicoes_mercadoria && (
                                  <div className="flex items-center gap-2">
                                    {avaliacao.opinioes.condicoes_mercadoria === 'positivo' ? (
                                      <ThumbsUp className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <ThumbsDown className="w-5 h-5 text-red-600" />
                                    )}
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {t('nps.dashboard.criterias.merchandiseConditions')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {avaliacao.comentario && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('nps.dashboard.modalReviews.clientComment')}</p>
                              <p className="text-gray-700 dark:text-gray-300 italic">"{avaliacao.comentario}"</p>
                            </div>
                          )}

                          {avaliacao.pedido_id && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('nps.dashboard.modalReviews.order')}: <span className="font-mono">{avaliacao.pedido_id}</span>
                                {avaliacao.avaliar_anonimo && (
                                  <span className="ml-3 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                    {t('nps.dashboard.modalReviews.anonymous')}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nps.dashboard.modalReviews.carrier')}</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {avaliacao.transportador?.razao_social || '-'}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nps.dashboard.modalReviews.evaluatedPeriod')}</p>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {new Date(avaliacao.periodo_inicio).toLocaleDateString(t('nps.dashboard.locale'))} {t('nps.dashboard.until')} {' '}
                                {new Date(avaliacao.periodo_fim).toLocaleDateString(t('nps.dashboard.locale'))}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nps.dashboard.modalReviews.finalNote')}</p>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center justify-center w-12 h-12 rounded-lg font-bold text-xl border-2 ${getNotaColor(
                                    Math.round(avaliacao.nota_final)
                                  )}`}
                                >
                                  {Number(avaliacao.nota_final).toFixed(1)}
                                </span>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nps.dashboard.modalReviews.totalDeliveries')}</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {avaliacao.total_entregas || 0}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nps.dashboard.modalReviews.onTimeDeliveries')}</p>
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {avaliacao.entregas_no_prazo || 0}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {avaliacao.total_entregas > 0
                                  ? `${((avaliacao.entregas_no_prazo / avaliacao.total_entregas) * 100).toFixed(1)}%`
                                  : '0%'}
                              </p>
                            </div>

                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nps.dashboard.modalReviews.withOccurrences')}</p>
                              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                {avaliacao.entregas_com_ocorrencia || 0}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {avaliacao.total_entregas > 0
                                  ? `${((avaliacao.entregas_com_ocorrencia / avaliacao.total_entregas) * 100).toFixed(1)}%`
                                  : '0%'}
                              </p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nps.dashboard.modalReviews.avgUpdate')}</p>
                              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {avaliacao.tempo_medio_atualizacao ? `${Number(avaliacao.tempo_medio_atualizacao).toFixed(1)}h` : '-'}
                              </p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nps.dashboard.modalReviews.avgPod')}</p>
                              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {avaliacao.tempo_medio_pod ? `${Number(avaliacao.tempo_medio_pod).toFixed(1)}h` : '-'}
                              </p>
                            </div>
                          </div>

                          {avaliacao.metricas && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('nps.dashboard.modalReviews.detailedMetrics')}</p>
                              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                                {JSON.stringify(avaliacao.metricas, null, 2)}
                              </pre>
                            </div>
                          )}

                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                            {t('nps.dashboard.modalReviews.createdAt')}: {formatDate(avaliacao.created_at)}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('nps.dashboard.modalReviews.totalReviews', { count: avaliacoes.length })}
                </p>
                <button
                  onClick={() => setShowAvaliacoesModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('nps.dashboard.modalHowCalc.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Explicação do Cálculo NPS */}
      {showCalculoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-600" />
                {t('nps.dashboard.modalHowCalc.title')}
              </h3>
              <button
                onClick={() => setShowCalculoModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* NPS Cliente Final */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                      {t('nps.dashboard.modalHowCalc.clientTitle')}
                    </h4>
                  </div>

                  <div className="space-y-4 text-gray-700 dark:text-gray-300">
                    <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{__html: t('nps.dashboard.modalHowCalc.clientDesc')}}>
                    </p>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                      <h5 className="font-semibold text-gray-900 dark:text-white">{t('nps.dashboard.modalHowCalc.clientCategory')}:</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <div className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded font-semibold min-w-[80px] text-center">
                            9-10
                          </div>
                          <div>
                            <span dangerouslySetInnerHTML={{__html: t('nps.dashboard.modalHowCalc.clientPromoters')}}></span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded font-semibold min-w-[80px] text-center">
                            7-8
                          </div>
                          <div>
                            <span dangerouslySetInnerHTML={{__html: t('nps.dashboard.modalHowCalc.clientNeutrals')}}></span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded font-semibold min-w-[80px] text-center">
                            0-6
                          </div>
                          <div>
                            <span dangerouslySetInnerHTML={{__html: t('nps.dashboard.modalHowCalc.clientDetractors')}}></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">{t('nps.dashboard.modalHowCalc.formula')}:</h5>
                      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded font-mono text-sm text-center">
                        NPS = % Promotores - % Detratores
                      </div>
                      <p className="text-sm mt-3 text-gray-600 dark:text-gray-400">
                        {t('nps.dashboard.modalHowCalc.formulaDesc')}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">{t('nps.dashboard.modalHowCalc.practicalEx')}:</h5>
                      <p className="text-sm">
                        {t('nps.dashboard.modalHowCalc.practicalExSub')}
                      </p>
                      <ul className="text-sm space-y-1 ml-4 mt-2">
                        <li>• {t('nps.dashboard.modalHowCalc.ex1')}</li>
                        <li>• {t('nps.dashboard.modalHowCalc.ex2')}</li>
                        <li>• {t('nps.dashboard.modalHowCalc.ex3')}</li>
                      </ul>
                      <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded mt-3 font-mono text-sm">
                        NPS = 60% - 20% = <strong className="text-green-600">+40</strong>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">{t('nps.dashboard.modalHowCalc.interpretation')}:</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded"></div>
                          <span dangerouslySetInnerHTML={{__html: t('nps.dashboard.modalHowCalc.inter1')}}></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded"></div>
                          <span dangerouslySetInnerHTML={{__html: t('nps.dashboard.modalHowCalc.inter2')}}></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gradient-to-r from-yellow-500 to-green-500 rounded"></div>
                          <span dangerouslySetInnerHTML={{__html: t('nps.dashboard.modalHowCalc.inter3')}}></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded"></div>
                          <span dangerouslySetInnerHTML={{__html: t('nps.dashboard.modalHowCalc.inter4')}}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NPS Interno */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-5 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                      {t('nps.dashboard.modalHowCalc.internalTitle')}
                    </h4>
                  </div>

                  <div className="space-y-4 text-gray-700 dark:text-gray-300">
                    <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{__html: t('nps.dashboard.modalHowCalc.internalDesc')}}></p>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-3">{t('nps.dashboard.modalHowCalc.metricsConsidered')}:</h5>
                      <div className="space-y-3 text-sm">
                        <div className="border-l-4 border-green-500 pl-3">
                          <strong>{t('nps.dashboard.modalHowCalc.mat1_title')}</strong>
                          <p className="text-gray-600 dark:text-gray-400">
                            {t('nps.dashboard.modalHowCalc.mat1_desc')}
                          </p>
                        </div>
                        <div className="border-l-4 border-red-500 pl-3">
                          <strong>{t('nps.dashboard.modalHowCalc.mat2_title')}</strong>
                          <p className="text-gray-600 dark:text-gray-400">
                            {t('nps.dashboard.modalHowCalc.mat2_desc')}
                          </p>
                        </div>
                        <div className="border-l-4 border-blue-500 pl-3">
                          <strong>{t('nps.dashboard.modalHowCalc.mat3_title')}</strong>
                          <p className="text-gray-600 dark:text-gray-400">
                            {t('nps.dashboard.modalHowCalc.mat3_desc')}
                          </p>
                        </div>
                        <div className="border-l-4 border-blue-500 pl-3">
                          <strong>{t('nps.dashboard.modalHowCalc.mat4_title')}</strong>
                          <p className="text-gray-600 dark:text-gray-400">
                            {t('nps.dashboard.modalHowCalc.mat4_desc')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">{t('nps.dashboard.modalHowCalc.formula')}:</h5>
                      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm space-y-2">
                        <div className="font-mono">
                          <span dangerouslySetInnerHTML={{__html: t('nps.dashboard.modalHowCalc.intFormTitle1')}}></span>
                        </div>
                        <div className="font-mono">
                          <span dangerouslySetInnerHTML={{__html: t('nps.dashboard.modalHowCalc.intFormTitle2')}}></span>
                          <ul className="ml-4 mt-2 space-y-1">
                            <li>- {t('nps.dashboard.modalHowCalc.intForm1')}</li>
                            <li>- {t('nps.dashboard.modalHowCalc.intForm2')}</li>
                            <li>- {t('nps.dashboard.modalHowCalc.intForm3')}</li>
                          </ul>
                        </div>
                      </div>
                      <p className="text-sm mt-3 text-gray-600 dark:text-gray-400">
                        {t('nps.dashboard.modalHowCalc.intFormDesc')}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">{t('nps.dashboard.modalHowCalc.practicalEx')}:</h5>
                      <div className="text-sm space-y-2">
                        <p className="font-semibold">{t('nps.dashboard.modalHowCalc.intEx1')}</p>
                        <ul className="ml-4 space-y-1">
                          <li>• {t('nps.dashboard.modalHowCalc.intEx2')}</li>
                          <li>• {t('nps.dashboard.modalHowCalc.intEx3')}</li>
                          <li>• {t('nps.dashboard.modalHowCalc.intEx4')}</li>
                          <li>• {t('nps.dashboard.modalHowCalc.intEx5')}</li>
                        </ul>
                        <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded mt-2 font-mono text-xs">
                          {t('nps.dashboard.modalHowCalc.intCalc1')}<br/>
                          {t('nps.dashboard.modalHowCalc.intCalc2')}<br/>
                          {t('nps.dashboard.modalHowCalc.intCalc3')}<br/>
                          {t('nps.dashboard.modalHowCalc.intCalc4')}<br/>
                          <strong className="text-green-600">{t('nps.dashboard.modalHowCalc.intCalcFinal')}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <strong className="text-gray-900 dark:text-white" dangerouslySetInnerHTML={{__html: t('nps.dashboard.modalHowCalc.intAutoRating')}}></strong>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {t('nps.dashboard.modalHowCalc.intAutoRatingDesc')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCalculoModal(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {t('nps.dashboard.modalHowCalc.understood')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
