import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Users, Star, Award, Calendar, Filter, Eye, MessageSquare, X, Info, ThumbsUp, ThumbsDown } from 'lucide-react';
import { npsService } from '../../services/npsService';
import { InlineMessage } from '../common/InlineMessage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useInnovation, INNOVATION_IDS } from '../../hooks/useInnovation';
import { useAuth } from '../../hooks/useAuth';

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
    if (currentEstablishment?.id) {
       setEstabelecimentoId(String(currentEstablishment.id));
    }
  }, [currentEstablishment]);

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
    if (nps >= 75) return 'Excelente';
    if (nps >= 50) return 'Bom';
    if (nps >= 0) return 'Regular';
    return 'Ruim';
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
    if (nota >= 9) return 'Promotor';
    if (nota >= 7) return 'Neutro';
    return 'Detrator';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-blue-600" />
            Dashboard NPS
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Avaliação de performance das transportadoras
          </p>
        </div>
      </div>

      {/* Innovation Notice */}
      {!npsActive && !npsLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              <strong>Integração de Serviço de NPS não contratada:</strong> Para visualizar e gerenciar dados do NPS,
              é necessário ativar o serviço em <strong>Inovações & Sugestões</strong>. Sem a ativação, não há dados para exibir.
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
                NPS Cliente Final
              </button>
              <button
                onClick={loadAvaliacoes}
                disabled={loadingAvaliacoes || !estabelecimentoId}
                className={`px-3 py-2 rounded-r-lg font-medium transition-colors border-l ${
                  tipoNPS === 'cliente'
                    ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Ver avaliações recebidas"
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
                NPS Interno
              </button>
              <button
                onClick={loadAvaliacoes}
                disabled={loadingAvaliacoes || !estabelecimentoId}
                className={`px-3 py-2 rounded-r-lg font-medium transition-colors border-l ${
                  tipoNPS === 'interno'
                    ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Ver avaliações internas"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowCalculoModal(true)}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            title="Como é calculado o NPS?"
          >
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">Como é calculado?</span>
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
              <span className="text-gray-600 dark:text-gray-400">até</span>
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
            <p className="text-gray-600 dark:text-gray-400 mt-4">Carregando dados...</p>
          </div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Nenhuma avaliação encontrada para o período selecionado
            </p>
            <InlineMessage type="info" message="Ajuste os filtros de data ou tipo de NPS para visualizar os dados" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Ranking de Transportadoras
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
                  Top 5 Transportadoras
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
                              {item.total_respostas} {tipoNPS === 'cliente' ? 'respostas' : 'entregas'}
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
                Todas as Transportadoras
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Posição
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Transportadora
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        NPS
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Classificação
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {tipoNPS === 'cliente' ? 'Respostas' : 'Entregas'}
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
                {tipoNPS === 'cliente' ? 'Avaliações Recebidas dos Clientes' : 'Avaliações Internas'}
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
                  <p className="text-gray-600 dark:text-gray-400 mt-4">Carregando avaliações...</p>
                </div>
              ) : avaliacoes.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhuma avaliação encontrada para o período selecionado
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
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cliente</p>
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
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transportador</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {avaliacao.transportador?.razao_social || '-'}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nota</p>
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
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Data de Envio</p>
                              <p className="text-gray-900 dark:text-white">
                                {formatDate(avaliacao.data_envio)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Data de Resposta</p>
                              <p className="text-gray-900 dark:text-white">
                                {formatDate(avaliacao.data_resposta)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  avaliacao.status === 'respondida'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : avaliacao.status === 'pendente'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                }`}
                              >
                                {avaliacao.status === 'respondida' ? 'Respondida' : avaliacao.status === 'pendente' ? 'Pendente' : 'Expirada'}
                              </span>
                            </div>
                          </div>

                          {avaliacao.opinioes && Object.keys(avaliacao.opinioes).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-semibold">Opiniões por Critério</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {avaliacao.opinioes.velocidade_processamento && (
                                  <div className="flex items-center gap-2">
                                    {avaliacao.opinioes.velocidade_processamento === 'positivo' ? (
                                      <ThumbsUp className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <ThumbsDown className="w-5 h-5 text-red-600" />
                                    )}
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      Velocidade no processamento
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
                                      Clareza nas informações
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
                                      Pontualidade na entrega
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
                                      Condições da mercadoria
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {avaliacao.comentario && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Comentário do Cliente</p>
                              <p className="text-gray-700 dark:text-gray-300 italic">"{avaliacao.comentario}"</p>
                            </div>
                          )}

                          {avaliacao.pedido_id && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Pedido: <span className="font-mono">{avaliacao.pedido_id}</span>
                                {avaliacao.avaliar_anonimo && (
                                  <span className="ml-3 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                    Anônimo
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
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transportador</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {avaliacao.transportador?.razao_social || '-'}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Período Avaliado</p>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {new Date(avaliacao.periodo_inicio).toLocaleDateString('pt-BR')} até{' '}
                                {new Date(avaliacao.periodo_fim).toLocaleDateString('pt-BR')}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nota Final</p>
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
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total de Entregas</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {avaliacao.total_entregas || 0}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Entregas no Prazo</p>
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
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Com Ocorrência</p>
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
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tempo Médio Atualização</p>
                              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {avaliacao.tempo_medio_atualizacao ? `${Number(avaliacao.tempo_medio_atualizacao).toFixed(1)}h` : '-'}
                              </p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tempo Médio POD</p>
                              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {avaliacao.tempo_medio_pod ? `${Number(avaliacao.tempo_medio_pod).toFixed(1)}h` : '-'}
                              </p>
                            </div>
                          </div>

                          {avaliacao.metricas && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Métricas Detalhadas</p>
                              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                                {JSON.stringify(avaliacao.metricas, null, 2)}
                              </pre>
                            </div>
                          )}

                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                            Avaliação criada em: {formatDate(avaliacao.created_at)}
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
                  Total de {avaliacoes.length} avaliação(ões) encontrada(s)
                </p>
                <button
                  onClick={() => setShowAvaliacoesModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fechar
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
                Como é Calculado o NPS?
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
                      NPS Cliente Final
                    </h4>
                  </div>

                  <div className="space-y-4 text-gray-700 dark:text-gray-300">
                    <p className="text-sm leading-relaxed">
                      O <strong>NPS Cliente Final</strong> mede a satisfação dos clientes finais com o serviço de entrega
                      prestado pelas transportadoras. O cliente avalia numa escala de 0 a 10.
                    </p>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                      <h5 className="font-semibold text-gray-900 dark:text-white">Categorização dos Clientes:</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <div className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded font-semibold min-w-[80px] text-center">
                            9-10
                          </div>
                          <div>
                            <strong>Promotores:</strong> Clientes extremamente satisfeitos que recomendam ativamente o serviço.
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded font-semibold min-w-[80px] text-center">
                            7-8
                          </div>
                          <div>
                            <strong>Neutros:</strong> Clientes satisfeitos mas não entusiasmados, podem mudar para concorrentes.
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded font-semibold min-w-[80px] text-center">
                            0-6
                          </div>
                          <div>
                            <strong>Detratores:</strong> Clientes insatisfeitos que podem prejudicar a reputação do serviço.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Fórmula de Cálculo:</h5>
                      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded font-mono text-sm text-center">
                        NPS = % Promotores - % Detratores
                      </div>
                      <p className="text-sm mt-3 text-gray-600 dark:text-gray-400">
                        O resultado varia de -100 (todos são detratores) até +100 (todos são promotores).
                        Os clientes neutros não entram no cálculo direto.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Exemplo Prático:</h5>
                      <p className="text-sm">
                        De 100 avaliações recebidas:
                      </p>
                      <ul className="text-sm space-y-1 ml-4 mt-2">
                        <li>• 60 clientes deram nota 9-10 (Promotores) = 60%</li>
                        <li>• 20 clientes deram nota 7-8 (Neutros) = 20%</li>
                        <li>• 20 clientes deram nota 0-6 (Detratores) = 20%</li>
                      </ul>
                      <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded mt-3 font-mono text-sm">
                        NPS = 60% - 20% = <strong className="text-green-600">+40</strong>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Interpretação:</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded"></div>
                          <span><strong>-100 a 0:</strong> Zona Crítica</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded"></div>
                          <span><strong>0 a 50:</strong> Zona de Aperfeiçoamento</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gradient-to-r from-yellow-500 to-green-500 rounded"></div>
                          <span><strong>50 a 75:</strong> Zona de Qualidade</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded"></div>
                          <span><strong>75 a 100:</strong> Zona de Excelência</span>
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
                      NPS Interno
                    </h4>
                  </div>

                  <div className="space-y-4 text-gray-700 dark:text-gray-300">
                    <p className="text-sm leading-relaxed">
                      O <strong>NPS Interno</strong> é calculado automaticamente pelo sistema com base em métricas
                      objetivas de performance das transportadoras durante um período específico.
                    </p>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Métricas Consideradas:</h5>
                      <div className="space-y-3 text-sm">
                        <div className="border-l-4 border-green-500 pl-3">
                          <strong>Taxa de Entregas no Prazo</strong>
                          <p className="text-gray-600 dark:text-gray-400">
                            Percentual de entregas realizadas dentro do prazo estabelecido.
                            Maior peso no cálculo final.
                          </p>
                        </div>
                        <div className="border-l-4 border-red-500 pl-3">
                          <strong>Taxa de Ocorrências</strong>
                          <p className="text-gray-600 dark:text-gray-400">
                            Percentual de entregas com problemas, avarias, extravios ou outras ocorrências negativas.
                            Impacta negativamente a nota.
                          </p>
                        </div>
                        <div className="border-l-4 border-blue-500 pl-3">
                          <strong>Tempo de Atualização de Status</strong>
                          <p className="text-gray-600 dark:text-gray-400">
                            Tempo médio para atualização do rastreamento. Quanto menor, melhor a nota.
                          </p>
                        </div>
                        <div className="border-l-4 border-blue-500 pl-3">
                          <strong>Tempo de Envio do POD</strong>
                          <p className="text-gray-600 dark:text-gray-400">
                            Tempo médio para envio do comprovante de entrega (Proof of Delivery).
                            Agilidade é valorizada.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Fórmula de Cálculo:</h5>
                      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm space-y-2">
                        <div className="font-mono">
                          <strong>Nota Base:</strong> (% Entregas no Prazo) × 10
                        </div>
                        <div className="font-mono">
                          <strong>Penalizações:</strong>
                          <ul className="ml-4 mt-2 space-y-1">
                            <li>- (% Ocorrências) × 5</li>
                            <li>- (Atraso Atualização / 24h) × 0.5</li>
                            <li>- (Atraso POD / 48h) × 0.3</li>
                          </ul>
                        </div>
                      </div>
                      <p className="text-sm mt-3 text-gray-600 dark:text-gray-400">
                        A nota final é normalizada para ficar entre 0 e 10, depois convertida para escala NPS (-100 a +100).
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Exemplo Prático:</h5>
                      <div className="text-sm space-y-2">
                        <p className="font-semibold">Transportadora com:</p>
                        <ul className="ml-4 space-y-1">
                          <li>• 85% de entregas no prazo</li>
                          <li>• 5% de ocorrências</li>
                          <li>• Tempo médio de atualização: 12 horas</li>
                          <li>• Tempo médio de POD: 36 horas</li>
                        </ul>
                        <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded mt-2 font-mono text-xs">
                          Nota Base: 0.85 × 10 = 8.5<br/>
                          - Ocorrências: 0.05 × 5 = -0.25<br/>
                          - Atraso Atualização: (12/24) × 0.5 = -0.25<br/>
                          - Atraso POD: (36/48) × 0.3 = -0.23<br/>
                          <strong className="text-green-600">= Nota Final: 7.77 → NPS: +55</strong>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <strong className="text-gray-900 dark:text-white">Avaliação Automática:</strong>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            O NPS Interno é calculado automaticamente pelo sistema ao final de cada período
                            de avaliação, garantindo objetividade e consistência na análise de performance.
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
                  Entendi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
