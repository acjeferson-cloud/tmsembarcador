import React, { useState, useEffect } from 'react';
import {
  Package,
  FileText,
  TruckIcon,
  Receipt,
  DollarSign,
  CheckCircle,
  Clock,
  RefreshCw,
  Sparkles,
  Calendar,
  TrendingUp,
  AlertTriangle,
  XCircle,
  BarChart3,
  ShoppingCart,
  Info
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useInnovation, INNOVATION_IDS } from '../../hooks/useInnovation';
import { Toast } from '../common/Toast';
import { useTranslation } from 'react-i18next';

interface BusinessPartnerVision360Props {
  partnerId: string;
  partnerName: string;
  partnerType: 'customer' | 'supplier' | 'both';
}

interface KPIData {
  totalOrders: number;
  totalInvoices: number;
  totalPickups: number;
  totalCtes: number;
  totalBills: number;
  deliveriesCompleted: number;
  deliveriesPending: number;
}

interface AIInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  partnerType: string;
  kpiData: KPIData;
  isLoading: boolean;
  insight: string;
}

const AIInsightModal: React.FC<AIInsightModalProps> = ({
  isOpen,
  onClose,
  partnerName,
  partnerType,
  kpiData,
  isLoading,
  insight
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'customer': return t('businessPartners.typeCustomer', 'Cliente');
      case 'supplier': return t('businessPartners.typeSupplier', 'Fornecedor');
      case 'both': return t('businessPartners.typeBoth', 'Cliente/Fornecedor');
      default: return t('businessPartners.view.typeLabel.default', 'Desconhecido');
    }
  };

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
                  {t('businessPartners.vision360.aiInsight.title', 'Insight IA')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('businessPartners.vision360.aiInsight.subtitle', 'Análise inteligente para {{name}} ({{type}})', { name: partnerName, type: getTypeLabel(partnerType) })}
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
              <p className="text-gray-600 dark:text-gray-400">{t('businessPartners.vision360.aiInsight.generating', 'Gerando análise inteligente...')}</p>
            </div>
          ) : insight ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {t('businessPartners.vision360.aiInsight.aiAnalysisGenerated', 'Análise Gerada por IA')}
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
                    {t('businessPartners.vision360.aiInsight.warning', 'Esta análise foi gerada por inteligência artificial e deve ser usada como referência. Sempre valide as informações com dados reais antes de tomar decisões.')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {t('businessPartners.vision360.aiInsight.error', 'Não foi possível gerar a análise. Tente novamente.')}
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {t('businessPartners.vision360.aiInsight.close', 'Fechar')}
          </button>
        </div>
      </div>
    </div>
  );
};

import { aiInsightService } from '../../services/aiInsightService';

export const BusinessPartnerVision360: React.FC<BusinessPartnerVision360Props> = ({
  partnerId,
  partnerName,
  partnerType
}) => {
  const { t } = useTranslation();
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
    totalOrders: 342,
    totalInvoices: 289,
    totalPickups: 312,
    totalCtes: 276,
    totalBills: 145,
    deliveriesCompleted: 265,
    deliveriesPending: 24
  });

  const documentTypeData = [
    { name: t('businessPartners.vision360.chartData.orders', 'Pedidos'), value: 342, color: '#3b82f6' },
    { name: t('businessPartners.vision360.chartData.invoices', 'Notas Fiscais'), value: 289, color: '#10b981' },
    { name: t('businessPartners.vision360.chartData.ctes', 'CT-e'), value: 276, color: '#8b5cf6' },
    { name: t('businessPartners.vision360.chartData.bills', 'Faturas'), value: 145, color: '#f59e0b' },
  ];

  const deliveryStatusData = [
    { name: t('businessPartners.vision360.chartData.completed', 'Concluídas'), value: 265, color: '#10b981' },
    { name: t('businessPartners.vision360.chartData.pending', 'Pendentes'), value: 24, color: '#f59e0b' },
  ];

  const weeklyActivityData = [
    { day: t('businessPartners.vision360.weekDays.mon', 'Seg'), pedidos: 15, nfes: 12, entregas: 10 },
    { day: t('businessPartners.vision360.weekDays.tue', 'Ter'), pedidos: 18, nfes: 16, entregas: 14 },
    { day: t('businessPartners.vision360.weekDays.wed', 'Qua'), pedidos: 22, nfes: 19, entregas: 17 },
    { day: t('businessPartners.vision360.weekDays.thu', 'Qui'), pedidos: 25, nfes: 21, entregas: 19 },
    { day: t('businessPartners.vision360.weekDays.fri', 'Sex'), pedidos: 28, nfes: 24, entregas: 22 },
    { day: t('businessPartners.vision360.weekDays.sat', 'Sáb'), pedidos: 12, nfes: 10, entregas: 8 },
    { day: t('businessPartners.vision360.weekDays.sun', 'Dom'), pedidos: 8, nfes: 6, entregas: 5 },
  ];

  const monthlyTrendData = [
    { month: t('businessPartners.vision360.months.jan', 'Jan'), volume: 1200, valor: 450000 },
    { month: t('businessPartners.vision360.months.feb', 'Fev'), volume: 1350, valor: 520000 },
    { month: t('businessPartners.vision360.months.mar', 'Mar'), volume: 1580, valor: 610000 },
    { month: t('businessPartners.vision360.months.apr', 'Abr'), volume: 1420, valor: 580000 },
    { month: t('businessPartners.vision360.months.may', 'Mai'), volume: 1680, valor: 680000 },
    { month: t('businessPartners.vision360.months.jun', 'Jun'), volume: 1850, valor: 750000 },
  ];

  const pickupTrendData = [
    { month: t('businessPartners.vision360.months.jan', 'Jan'), coletas: 48 },
    { month: t('businessPartners.vision360.months.feb', 'Fev'), coletas: 52 },
    { month: t('businessPartners.vision360.months.mar', 'Mar'), coletas: 58 },
    { month: t('businessPartners.vision360.months.apr', 'Abr'), coletas: 54 },
    { month: t('businessPartners.vision360.months.may', 'Mai'), coletas: 61 },
    { month: t('businessPartners.vision360.months.jun', 'Jun'), coletas: 65 },
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'customer': return t('businessPartners.typeCustomer', 'Cliente');
      case 'supplier': return t('businessPartners.typeSupplier', 'Fornecedor');
      case 'both': return t('businessPartners.typeBoth', 'Cliente/Fornecedor');
      default: return t('businessPartners.view.typeLabel.default', 'Desconhecido');
    }
  };

  const generateAIInsight = async () => {
    if (!openaiActive) {
      setToast({ message: t('businessPartners.vision360.aiInsight.notHiredToast', 'Recurso não contratado. Ative em Inovações & Sugestões.'), type: 'error' });
      return;
    }

    setIsGeneratingInsight(true);
    setShowAIModal(true);
    setAiInsight('');

    try {
      const response = await aiInsightService.generateInsight({
        partnerId: partnerId,
        partnerName: partnerName,
        type: 'business_partner'
      });

      if (response.error) {
        setToast({ message: response.error, type: 'error' });
      } else {
        setAiInsight(response.insight);
        if (response.cached) {
        }
      }
    } catch (error: any) {
      setAiInsight('');
      setToast({ message: error.message || 'Erro ao gerar análise com IA', type: 'error' });
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Innovation Notice */}
      {!openaiActive && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start space-x-3">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
              💡 Insight por IA disponível para contratação
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              O recurso "Insight por IA" pode gerar análises inteligentes e apoiar suas decisões, mas ainda não está habilitado para seu ambiente.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-400 mt-2">
              Para ativar, solicite ao administrador:<br />
              <strong>Menu &gt; Inovações &amp; Sugestões &gt; Ativar recurso</strong>
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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('businessPartners.vision360.filters.period', 'Período:')}</span>
            </div>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
            <span className="text-gray-500 dark:text-gray-400">{t('businessPartners.vision360.filters.until', 'até')}</span>
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
              <span>{t('businessPartners.vision360.filters.refresh', 'Atualizar')}</span>
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
              <span>{t('businessPartners.vision360.filters.aiInsightBtn', 'Insight IA')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('businessPartners.vision360.kpis.orders', 'Pedidos')}</span>
            <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.totalOrders}</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">{t('businessPartners.vision360.kpis.ordersSub', '+8% vs mês anterior')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('businessPartners.vision360.kpis.invoices', 'Notas Fiscais')}</span>
            <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.totalInvoices}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('businessPartners.vision360.kpis.invoicesSub', '{{percent}}% dos pedidos', { percent: ((kpiData.totalInvoices / kpiData.totalOrders) * 100).toFixed(0) })}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('businessPartners.vision360.kpis.pickups', 'Coletas')}</span>
            <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.totalPickups}</p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{t('businessPartners.vision360.kpis.pickupsSub', 'Média: 52/mês')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('businessPartners.vision360.kpis.ctes', 'CT-e')}</span>
            <TruckIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.totalCtes}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('businessPartners.vision360.kpis.ctesSub', '{{percent}}% das NF-e', { percent: ((kpiData.totalCtes / kpiData.totalInvoices) * 100).toFixed(0) })}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('businessPartners.vision360.kpis.bills', 'Faturas')}</span>
            <Receipt className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.totalBills}</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{t('businessPartners.vision360.kpis.billsSub', 'Média: R$ 5.172,00')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('businessPartners.vision360.kpis.deliveriesCompleted', 'Entregas Realizadas')}</span>
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.deliveriesCompleted}</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">{t('businessPartners.vision360.kpis.deliveriesCompletedSub', '{{percent}}% do total', { percent: ((kpiData.deliveriesCompleted / (kpiData.deliveriesCompleted + kpiData.deliveriesPending)) * 100).toFixed(1) })}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('businessPartners.vision360.kpis.deliveriesPending', 'Entregas Pendentes')}</span>
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.deliveriesPending}</p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{t('businessPartners.vision360.kpis.deliveriesPendingSub', 'Monitorar prazos')}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Documentos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>{t('businessPartners.vision360.charts.documentDistribution', 'Distribuição de Documentos')}</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={documentTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {documentTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status de Entregas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <TruckIcon className="w-5 h-5" />
            <span>{t('businessPartners.vision360.charts.deliveryStatus', 'Status de Entregas')}</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deliveryStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
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

        {/* Atividade Semanal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>{t('businessPartners.vision360.charts.weeklyActivity', 'Atividade Semanal')}</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="pedidos" fill="#3b82f6" name={t('businessPartners.vision360.chartData.orders', 'Pedidos')} />
              <Bar dataKey="nfes" fill="#10b981" name={t('businessPartners.vision360.chartData.invoices', 'NF-e')} />
              <Bar dataKey="entregas" fill="#8b5cf6" name={t('businessPartners.vision360.chartData.deliveries', 'Entregas')} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tendência de Coletas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>{t('businessPartners.vision360.charts.pickupTrend', 'Tendência de Coletas')}</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={pickupTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="coletas"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.3}
                name={t('businessPartners.vision360.chartData.pickups', 'Coletas')}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Evolução Mensal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>{t('businessPartners.vision360.charts.monthlyEvolution', 'Evolução Mensal - Volume e Valor')}</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === t('businessPartners.vision360.chartData.value', 'Valor (R$)')) {
                    return [`R$ ${value.toLocaleString('pt-BR')}`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="volume"
                stroke="#3b82f6"
                strokeWidth={3}
                name={t('businessPartners.vision360.chartData.volume', 'Volume de Operações')}
                dot={{ fill: '#3b82f6', r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="valor"
                stroke="#10b981"
                strokeWidth={3}
                name={t('businessPartners.vision360.chartData.value', 'Valor (R$)')}
                dot={{ fill: '#10b981', r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insight Modal */}
      <AIInsightModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        partnerName={partnerName}
        partnerType={getTypeLabel(partnerType)}
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
