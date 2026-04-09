import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  Truck,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  DollarSign
} from 'lucide-react';
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime';
import { RealTimeMap } from './RealTimeMap';
import { AlertsPanel } from './AlertsPanel';
import { NewsCarousel } from './NewsCarousel';
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
    delayed: 0,
    waitingCollection: 0,
    activeCarriers: 0,
    volumeReais: 0,
    volumeKg: 0,
    onTimeRate: 0,
    freightEstimated: 0,
    freightSpot: 0
  });

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      title: 'Auditoria Spot vs Standard',
      value: kpiData.freightSpot.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      change: `Est: ${kpiData.freightEstimated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      changeType: kpiData.freightSpot > kpiData.freightEstimated && kpiData.freightEstimated > 0 ? 'negative' : 'positive' as const,
      icon: DollarSign,
      color: 'blue'
    },
    {
      title: 'Entregas no Prazo (OTIF Diário)',
      value: `${kpiData.onTimeRate}%`,
      change: 'Hoje',
      changeType: kpiData.onTimeRate >= 95 ? 'positive' : (kpiData.onTimeRate >= 80 ? 'neutral' : 'negative') as const,
      icon: CheckCircle,
      color: 'emerald'
    },
    {
      title: 'Volume Faturado Diário',
      value: kpiData.volumeReais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      change: `${kpiData.volumeKg} kg trafegados`,
      changeType: 'neutral' as const,
      icon: TrendingUp,
      color: 'indigo'
    },
    {
      title: 'Transportadores em Operação',
      value: kpiData.activeCarriers.toString(),
      change: kpiData.activeCarriers > 0 ? 'Rotas Ativas' : '-',
      changeType: 'positive' as const,
      icon: Truck,
      color: 'orange'
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
            onClick={refreshData}
            disabled={isRefreshing}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? t('controlTower.refreshing') : t('common.refresh')}</span>
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
        <div className="lg:col-span-2 flex flex-col h-full">
          <div className="flex-grow">
            <RealTimeMap />
          </div>
        </div>

        {/* Right Sidebar takes 1/3 */}
        <div className="flex flex-col gap-6">
          <AlertsPanel />
          <NewsCarousel />
        </div>
      </div>
    </div>
  );
};
