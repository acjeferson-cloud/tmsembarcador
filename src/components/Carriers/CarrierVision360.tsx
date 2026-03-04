import React, { useState, useEffect } from 'react';
import {
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Calendar,
  TruckIcon,
  BarChart3,
  Info
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useInnovation, INNOVATION_IDS } from '../../hooks/useInnovation';
import { Toast } from '../common/Toast';

interface CarrierVision360Props {
  carrierId: string;
  carrierName: string;
}

interface KPIData {
  totalDeliveries: number;
  inTransit: number;
  deliveredToday: number;
  delayed: number;
  awaitingPickup: number;
  punctualityRate: number;
}

interface AIInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  carrierName: string;
  kpiData: KPIData;
  isLoading: boolean;
  insight: string;
}

const AIInsightModal: React.FC<AIInsightModalProps> = ({
  isOpen,
  onClose,
  carrierName,
  kpiData,
  isLoading,
  insight
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Insight IA
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Análise inteligente para {carrierName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Gerando análise inteligente...</p>
            </div>
          ) : insight ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Análise Gerada por IA
                    </h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {insight}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Esta análise foi gerada por inteligência artificial e deve ser usada como referência.
                    Sempre valide as informações com dados reais antes de tomar decisões.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Não foi possível gerar a análise. Tente novamente.
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export const CarrierVision360: React.FC<CarrierVision360Props> = ({ carrierId, carrierName }) => {
  const { isActive: openaiActive } = useInnovation(INNOVATION_IDS.OPENAI);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [kpiData, setKpiData] = useState<KPIData>({
    totalDeliveries: 1250,
    inTransit: 89,
    deliveredToday: 47,
    delayed: 12,
    awaitingPickup: 34,
    punctualityRate: 94.5
  });

  const deliveryStatusData = [
    { name: 'Entregue', value: 1050, color: '#10b981' },
    { name: 'Em Trânsito', value: 89, color: '#3b82f6' },
    { name: 'Atrasado', value: 12, color: '#ef4444' },
    { name: 'Aguardando', value: 34, color: '#f59e0b' },
  ];

  const weeklyPerformanceData = [
    { day: 'Seg', entregas: 45, pontualidade: 95 },
    { day: 'Ter', entregas: 52, pontualidade: 93 },
    { day: 'Qua', entregas: 48, pontualidade: 96 },
    { day: 'Qui', entregas: 58, pontualidade: 92 },
    { day: 'Sex', entregas: 61, pontualidade: 94 },
    { day: 'Sáb', entregas: 38, pontualidade: 97 },
    { day: 'Dom', entregas: 25, pontualidade: 98 },
  ];

  const monthlyTrendData = [
    { month: 'Jan', entregas: 890 },
    { month: 'Fev', entregas: 950 },
    { month: 'Mar', entregas: 1120 },
    { month: 'Abr', entregas: 1050 },
    { month: 'Mai', entregas: 1180 },
    { month: 'Jun', entregas: 1250 },
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const generateAIInsight = async () => {
    if (!openaiActive) {
      setToast({ message: 'Recurso não contratado. Ative em Inovações & Sugestões.', type: 'error' });
      return;
    }

    setIsGeneratingInsight(true);
    setShowAIModal(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const insight = `📊 ANÁLISE DE DESEMPENHO - ${carrierName}

🎯 Resumo Executivo:
O transportador ${carrierName} apresenta um desempenho sólido no período analisado, com uma taxa de pontualidade de ${kpiData.punctualityRate}% e ${kpiData.totalDeliveries} entregas realizadas.

✅ Pontos Fortes:
• Taxa de pontualidade acima de 90%, indicando consistência operacional
• ${kpiData.deliveredToday} entregas realizadas hoje, demonstrando alta produtividade
• Apenas ${kpiData.delayed} entregas atrasadas (${((kpiData.delayed / kpiData.totalDeliveries) * 100).toFixed(1)}% do total)

⚠️ Pontos de Atenção:
• ${kpiData.awaitingPickup} entregas aguardando coleta - considerar otimização da logística de coleta
• ${kpiData.inTransit} entregas em trânsito - monitorar para garantir cumprimento de prazos

📈 Recomendações:
1. Implementar alertas proativos para coletas pendentes
2. Analisar rotas das entregas atrasadas para identificar gargalos
3. Manter o padrão de qualidade atual com processos bem definidos
4. Considerar expansão da capacidade dado o volume crescente

💡 Tendência:
Com base nos dados, o transportador demonstra capacidade de crescimento sustentável. A manutenção da taxa de pontualidade acima de 90% é um diferencial competitivo importante.`;

      setAiInsight(insight);
    } catch (error) {
      console.error('Erro ao gerar insight:', error);
      setAiInsight('');
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Innovation Notice */}
      {!openaiActive && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              <strong>Integração com OpenAI/ChatGPT não contratada:</strong> Para utilizar o botão de inteligência artificial "Insight IA", é necessário ativar o serviço em <strong>Inovações & Sugestões</strong>. Sem a ativação, o botão não terão efeito.
            </p>
          </div>
        </div>
      )}

      {/* Filtros e Ações */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Período:</span>
            </div>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
            <span className="text-gray-500 dark:text-gray-400">até</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={generateAIInsight}
              disabled={!openaiActive}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                openaiActive
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!openaiActive ? 'Recurso não contratado. Ative em Inovações & Sugestões.' : ''}
            >
              <Sparkles className="w-4 h-4" />
              <span>Insight IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total de Entregas</span>
            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.totalDeliveries}</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">+12% vs mês anterior</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Em Trânsito</span>
            <TruckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.inTransit}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{((kpiData.inTransit / kpiData.totalDeliveries) * 100).toFixed(1)}% do total</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Entregue Hoje</span>
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.deliveredToday}</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">Meta: 45/dia</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Atrasadas</span>
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.delayed}</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{((kpiData.delayed / kpiData.totalDeliveries) * 100).toFixed(1)}% do total</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Aguardando Coleta</span>
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.awaitingPickup}</p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Priorizar coletas</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Pontualidade</span>
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.punctualityRate}%</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">Acima da meta (90%)</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status de Entregas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Status das Entregas</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deliveryStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {deliveryStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Desempenho Semanal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Desempenho Semanal</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="entregas" fill="#3b82f6" name="Entregas" />
              <Bar yAxisId="right" dataKey="pontualidade" fill="#10b981" name="Pontualidade %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tendência Mensal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Tendência de Entregas (Últimos 6 Meses)</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="entregas"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Total de Entregas"
                dot={{ fill: '#3b82f6', r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insight Modal */}
      <AIInsightModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        carrierName={carrierName}
        kpiData={kpiData}
        isLoading={isGeneratingInsight}
        insight={aiInsight}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
