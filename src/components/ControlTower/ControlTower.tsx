import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Truck,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  PieChart,
  Percent,
  BarChart3,
  DollarSign,
  Info
} from 'lucide-react';
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime';
import { RealTimeMap } from './RealTimeMap';
import { AnomalyRadar } from './AnomalyRadar';
import { DeliveryFunnel } from './DeliveryFunnel';
import { NewsCarousel } from './NewsCarousel';
import { ControlTowerCalcModal } from './ControlTowerCalcModal';
import { controlTowerService, KPIData } from '../../services/controlTowerService';
import { useActivityLogger } from '../../hooks/useActivityLogger';

export const ControlTower: React.FC = () => {
  const { t } = useTranslation();
  
  useActivityLogger('Torre de controle', 'Acesso', 'Acessou o dashboard da Torre de Controle');

  const breadcrumbItems = [
    { label: t('controlTower.pageTitle'), current: true }
  ];

  const [kpiData, setKpiData] = useState<KPIData>({
    totalDeliveries: 0,
    inTransit: 0,
    delivered: 0,
    waitingCollection: 0,
    cfv: 0,
    custoPorKg: 0,
    shareContrato: 0,
    shareSpot: 0,
    freteTotal: 0,
    faturamentoTotal: 0,
    onTimeRate: 0
  });

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);

  const fetchKPIs = async () => {
    try {
      setIsRefreshing(true);
      const data = await controlTowerService.getKpiData();
      setKpiData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Falha ao buscar KPIs', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  // Escuta atualizações da tabela invoices_nfe para re-fazer o fetch dos KPIs reais e re-pintar o Dash
  useSupabaseRealtime('invoices_nfe', fetchKPIs);

  const refreshData = async () => {
    await fetchKPIs();
  };

  const kpiCards = [
    {
      title: 'Custo de Frete sobre Vendas (CFV)',
      value: `${kpiData.cfv}%`,
      change: `Frete: ${kpiData.freteTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}`,
      changeType: kpiData.cfv > 15 ? 'negative' : 'positive' as const,
      icon: Percent,
      color: 'blue'
    },
    {
      title: 'Share de Frete (Contrato vs Spot)',
      value: `${kpiData.shareContrato}% / ${kpiData.shareSpot}%`,
      change: 'Contrato frente à mercado livre',
      changeType: kpiData.shareContrato >= kpiData.shareSpot ? 'positive' : 'negative' as const,
      icon: PieChart,
      color: 'orange'
    },
    {
      title: 'Custo Médio por KG',
      value: kpiData.custoPorKg.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      change: 'Baseado no faturado diário',
      changeType: 'neutral' as const,
      icon: BarChart3,
      color: 'indigo'
    },
    {
      title: 'Entregas no Prazo (OTIF Diário)',
      value: `${kpiData.onTimeRate}%`,
      change: 'Hoje (mantido p/ tracking operacional)',
      changeType: kpiData.onTimeRate >= 95 ? 'positive' : (kpiData.onTimeRate >= 80 ? 'neutral' : 'negative') as const,
      icon: CheckCircle,
      color: 'emerald'
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Breadcrumbs items={breadcrumbItems} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('controlTower.pageTitle')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('controlTower.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('controlTower.lastUpdate')} {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={() => setShowCalcModal(true)}
            className="p-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors shadow-sm items-center gap-2 hidden sm:flex"
            title="Como é calculado?"
          >
            <Info size={16} />
            <span className="text-sm font-medium">Como é calculado?</span>
          </button>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{isRefreshing ? t('controlTower.refreshing') : t('common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                </div>
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center
                  ${kpi.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                  ${kpi.color === 'orange' ? 'bg-orange-100 text-orange-600' : ''}
                  ${kpi.color === 'green' ? 'bg-green-100 text-green-600' : ''}
                  ${kpi.color === 'red' ? 'bg-red-100 text-red-600' : ''}
                  ${kpi.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' : ''}
                  ${kpi.color === 'purple' ? 'bg-purple-100 text-purple-600' : ''}
                  ${kpi.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' : ''}
                  ${kpi.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : ''}
                `}>
                  <Icon size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`
                  text-sm font-medium flex items-center space-x-1
                  ${kpi.changeType === 'positive' ? 'text-green-600' : ''}
                  ${kpi.changeType === 'negative' ? 'text-red-600' : ''}
                  ${kpi.changeType === 'neutral' ? 'text-gray-600' : ''}
                `}>
                  {kpi.changeType === 'positive' && <TrendingUp size={14} />}
                  {kpi.changeType === 'negative' && <TrendingDown size={14} />}
                  <span>{kpi.change}</span>
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{t('controlTower.last24h')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Map takes 2/3 (Left/Center) */}
        <div className="lg:col-span-2 flex flex-col h-full min-h-[500px]">
          <RealTimeMap />
        </div>

        {/* Right Sidebar takes 1/3 */}
        <div className="flex flex-col gap-6">
          <AnomalyRadar />
          <DeliveryFunnel />
        </div>
      </div>
      
      {/* Footer Banner */}
      <div className="w-full">
         <NewsCarousel />
      </div>
      
      <ControlTowerCalcModal
        isOpen={showCalcModal}
        onClose={() => setShowCalcModal(false)}
      />
    </div>
  );
};
