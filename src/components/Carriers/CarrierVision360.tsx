import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
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
  isLoading: boolean;
  insight: string;
}

const AIInsightModal: React.FC<AIInsightModalProps> = ({
  isOpen,
  onClose,
  carrierName,
  isLoading,
  insight
}) => {
  const { t } = useTranslation();

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
                  {t('carriers.vision360.aiInsight.title')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('carriers.vision360.aiInsight.subtitle', { carrierName })}
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
              <p className="text-gray-600 dark:text-gray-400">{t('carriers.vision360.aiInsight.generating')}</p>
            </div>
          ) : insight ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {t('carriers.vision360.aiInsight.generatedTitle')}
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
                    {t('carriers.vision360.aiInsight.warning')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {t('carriers.vision360.aiInsight.errorTitle')}
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {t('carriers.vision360.aiInsight.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

import { aiInsightService } from '../../services/aiInsightService';
import { useAuth } from '../../hooks/useAuth';

export const CarrierVision360: React.FC<CarrierVision360Props> = ({ carrierId, carrierName }) => {
  const { t } = useTranslation();
  const { user, currentEstablishment } = useAuth();
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
    totalDeliveries: 0,
    inTransit: 0,
    deliveredToday: 0,
    delayed: 0,
    awaitingPickup: 0,
    punctualityRate: 0
  });

  const [deliveryStatusData, setDeliveryStatusData] = useState<any[]>([]);
  const [weeklyPerformanceData, setWeeklyPerformanceData] = useState<any[]>([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState<any[]>([]);

  const fetchRealData = async () => {
    setIsLoading(true);
    try {
      const { data: dbOrders, error } = await supabase
        .from('orders')
        .select('id, status, data_pedido, data_prevista_entrega, updated_at')
        .eq('carrier_id', carrierId)
        .gte('data_pedido', dateRange.start)
        .lte('data_pedido', dateRange.end);

      if (error) throw error;
      const orders = dbOrders || [];

      // 1. KPIs
      const todayStr = new Date().toISOString().split('T')[0];
      const totalDeliveries = orders.length;
      const inTransit = orders.filter((o: any) => o.status === 'em_transito' || o.status === 'saiu_entrega').length;
      const deliveredToday = orders.filter((o: any) => o.status === 'entregue' && (o.updated_at || '').startsWith(todayStr)).length;
      const awaitingPickup = orders.filter((o: any) => o.status === 'processando' || o.status === 'pendente' || o.status === 'emitido').length;
      const delayed = orders.filter((o: any) => o.status !== 'entregue' && o.status !== 'cancelado' && o.data_prevista_entrega && o.data_prevista_entrega < todayStr).length;

      const deliveredOrders = orders.filter((o: any) => o.status === 'entregue');
      let onTime = 0;
      deliveredOrders.forEach((o: any) => {
        if (!o.data_prevista_entrega || o.data_prevista_entrega >= (o.updated_at || todayStr).split('T')[0]) {
          onTime++;
        }
      });
      const punctualityRate = deliveredOrders.length > 0 ? (onTime / deliveredOrders.length) * 100 : (totalDeliveries > 0 ? 100 : 0);

      setKpiData({
        totalDeliveries,
        inTransit,
        deliveredToday,
        delayed,
        awaitingPickup,
        punctualityRate: Number(punctualityRate.toFixed(1))
      });

      // 2. Status Data
      const deliveredCount = deliveredOrders.length;
      setDeliveryStatusData([
        { name: t('carriers.vision360.status.delivered'), value: deliveredCount, color: '#10b981' },
        { name: t('carriers.vision360.status.inTransit'), value: inTransit, color: '#3b82f6' },
        { name: t('carriers.vision360.status.delayed'), value: delayed, color: '#ef4444' },
        { name: t('carriers.vision360.status.awaiting'), value: awaitingPickup, color: '#f59e0b' },
      ]);

      // 3. Weekly Data (Last 7 Days back from end Date)
      const weekDays = [t('carriers.vision360.days.sun'), t('carriers.vision360.days.mon'), t('carriers.vision360.days.tue'), t('carriers.vision360.days.wed'), t('carriers.vision360.days.thu'), t('carriers.vision360.days.fri'), t('carriers.vision360.days.sat')];
      const weekMap = new Map();
      
      const endDate = new Date(dateRange.end);
      for(let i = 6; i >= 0; i--) {
        const d = new Date(endDate);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        weekMap.set(dateStr, { day: weekDays[d.getDay()], dateStr, entregas: 0, onTimeCount: 0, totalDelivered: 0 });
      }

      orders.forEach((o: any) => {
        const dStr = o.data_pedido;
        if (weekMap.has(dStr)) {
          const w = weekMap.get(dStr);
          w.entregas++;
          if (o.status === 'entregue') {
            w.totalDelivered++;
            if (!o.data_prevista_entrega || o.data_prevista_entrega >= (o.updated_at || todayStr).split('T')[0]) w.onTimeCount++;
          }
        }
      });

      const processedWeekly = Array.from(weekMap.values()).map(w => ({
        day: w.day,
        entregas: w.entregas,
        pontualidade: w.totalDelivered > 0 ? Math.round((w.onTimeCount / w.totalDelivered) * 100) : (w.entregas > 0 ? 100 : 0)
      }));
      setWeeklyPerformanceData(processedWeekly);

      // 4. Monthly Trend Data (Last 6 Months up to end Date)
      const monthNames = [t('carriers.vision360.months.jan'), t('carriers.vision360.months.feb'), t('carriers.vision360.months.mar'), t('carriers.vision360.months.apr'), t('carriers.vision360.months.may'), t('carriers.vision360.months.jun'), t('carriers.vision360.months.jul'), t('carriers.vision360.months.aug'), t('carriers.vision360.months.sep'), t('carriers.vision360.months.oct'), t('carriers.vision360.months.nov'), t('carriers.vision360.months.dec')];
      const monthMap = new Map();
      const endMonthDate = new Date(dateRange.end);
      endMonthDate.setDate(1); // Set to 1st to avoid overflow
      
      for(let i = 5; i >= 0; i--) {
        const d = new Date(endMonthDate);
        d.setMonth(d.getMonth() - i);
        const mKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
        monthMap.set(mKey, { month: monthNames[d.getMonth()], entregas: 0 });
      }

      orders.forEach((o: any) => {
        if (!o.data_pedido) return;
        const mKey = o.data_pedido.substring(0, 7); // YYYY-MM
        if (monthMap.has(mKey)) {
          monthMap.get(mKey).entregas++;
        }
      });

      setMonthlyTrendData(Array.from(monthMap.values()));

    } catch (err) {
      console.error('Error fetching carrier metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, [carrierId, dateRange, t]);

  const handleRefresh = () => {
    fetchRealData();
  };

  const generateAIInsight = async () => {
    if (!openaiActive) {
      setToast({ message: t('carriers.vision360.aiInsight.notContractedError'), type: 'error' });
      return;
    }

    setIsGeneratingInsight(true);
    setShowAIModal(true);
    setAiInsight('');

    try {
      const response = await aiInsightService.generateInsight({
        partnerId: carrierId,
        partnerName: carrierName,
        type: 'carrier'
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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('carriers.vision360.filters.period')}</span>
            </div>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
            <span className="text-gray-500 dark:text-gray-400">{t('carriers.vision360.filters.to')}</span>
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
              <span>{t('carriers.vision360.filters.refresh')}</span>
            </button>

            <button
              onClick={generateAIInsight}
              disabled={!openaiActive}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                openaiActive
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!openaiActive ? t('carriers.vision360.aiInsight.notContractedError') : ''}
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('carriers.vision360.filters.aiInsightBtn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.vision360.kpi.totalDeliveries')}</span>
            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.totalDeliveries}</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">{t('carriers.vision360.kpi.vsLastMonth')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.vision360.kpi.inTransit')}</span>
            <TruckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.inTransit}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('carriers.vision360.kpi.percentOfTotal', { percent: ((kpiData.inTransit / kpiData.totalDeliveries) * 100).toFixed(1) })}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.vision360.kpi.deliveredToday')}</span>
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.deliveredToday}</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">{t('carriers.vision360.kpi.goalPerDay')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.vision360.kpi.delayed')}</span>
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.delayed}</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{t('carriers.vision360.kpi.percentOfTotal', { percent: ((kpiData.delayed / kpiData.totalDeliveries) * 100).toFixed(1) })}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.vision360.kpi.awaitingPickup')}</span>
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.awaitingPickup}</p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{t('carriers.vision360.kpi.prioritizePickups')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.vision360.kpi.punctualityRate')}</span>
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.punctualityRate}%</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">{t('carriers.vision360.kpi.aboveGoal')}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status de Entregas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>{t('carriers.vision360.charts.deliveryStatus')}</span>
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
            <span>{t('carriers.vision360.charts.weeklyPerformance')}</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="entregas" fill="#3b82f6" name={t('carriers.vision360.charts.deliveries')} />
              <Bar yAxisId="right" dataKey="pontualidade" fill="#10b981" name={t('carriers.vision360.charts.punctualityPercent')} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tendência Mensal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>{t('carriers.vision360.charts.monthlyTrend')}</span>
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
                name={t('carriers.vision360.charts.totalDeliveries')}
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
