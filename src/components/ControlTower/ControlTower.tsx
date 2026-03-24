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
  Zap
} from 'lucide-react';
import { DeliveryStatusChart } from './DeliveryStatusChart';
import { RealTimeMap } from './RealTimeMap';
import { AlertsPanel } from './AlertsPanel';
import { PerformanceMetrics } from './PerformanceMetrics';
import { NewsCarousel } from './NewsCarousel';
import { useActivityLogger } from '../../hooks/useActivityLogger';

interface KPIData {
  totalDeliveries: number;
  inTransit: number;
  delivered: number;
  delayed: number;
  waitingCollection: number;
  activeVehicles: number;
  avgDeliveryTime: number;
  onTimeRate: number;
}

export const ControlTower: React.FC = () => {
  const { t } = useTranslation();
  
  useActivityLogger('Torre de controle', 'Acesso', 'Acessou o dashboard da Torre de Controle');

  const breadcrumbItems = [
    { label: t('controlTower.pageTitle'), current: true }
  ];

  const [kpiData, setKpiData] = useState<KPIData>({
    totalDeliveries: 1247,
    inTransit: 89,
    delivered: 1098,
    delayed: 23,
    waitingCollection: 37,
    activeVehicles: 45,
    avgDeliveryTime: 2.4,
    onTimeRate: 94.2
  });

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setKpiData(prev => ({
        ...prev,
        inTransit: prev.inTransit + Math.floor(Math.random() * 3) - 1,
        delivered: prev.delivered + Math.floor(Math.random() * 2),
        delayed: Math.max(0, prev.delayed + Math.floor(Math.random() * 2) - 1),
        waitingCollection: Math.max(0, prev.waitingCollection + Math.floor(Math.random() * 2) - 1),
      }));
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdate(new Date());
    setIsRefreshing(false);
  };

  const kpiCards = [
    {
      title: t('controlTower.kpis.totalDeliveries'),
      value: kpiData.totalDeliveries.toLocaleString(),
      change: '+12',
      changeType: 'positive' as const,
      icon: Package,
      color: 'blue'
    },
    {
      title: t('controlTower.kpis.inTransit'),
      value: kpiData.inTransit.toString(),
      change: '+3',
      changeType: 'positive' as const,
      icon: Truck,
      color: 'orange'
    },
    {
      title: t('controlTower.kpis.delivered'),
      value: kpiData.delivered.toString(),
      change: '+45',
      changeType: 'positive' as const,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: t('controlTower.kpis.delayed'),
      value: kpiData.delayed.toString(),
      change: '-2',
      changeType: 'negative' as const,
      icon: AlertTriangle,
      color: 'red'
    },
    {
      title: t('controlTower.kpis.waitingCollection'),
      value: kpiData.waitingCollection.toString(),
      change: '+5',
      changeType: 'neutral' as const,
      icon: Clock,
      color: 'yellow'
    },
    {
      title: t('controlTower.kpis.activeVehicles'),
      value: kpiData.activeVehicles.toString(),
      change: '0',
      changeType: 'neutral' as const,
      icon: Activity,
      color: 'purple'
    },
    {
      title: t('controlTower.kpis.avgDeliveryTime'),
      value: `${kpiData.avgDeliveryTime}h`,
      change: '-0.2h',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'indigo'
    },
    {
      title: t('controlTower.kpis.onTimeRate'),
      value: `${kpiData.onTimeRate}%`,
      change: '+1.2%',
      changeType: 'positive' as const,
      icon: Zap,
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
        {/* Delivery Status Chart */}
        <div className="lg:col-span-2">
          <DeliveryStatusChart />
        </div>

        {/* Alerts Panel */}
        <div>
          <AlertsPanel />
        </div>
      </div>

      {/* Real-time Map and Performance Metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RealTimeMap />
        <PerformanceMetrics />
      </div>

      {/* News Section */}
      <div className="mt-6">
        <NewsCarousel />
      </div>
    </div>
  );
};