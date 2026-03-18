import React, { useState } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { DashboardFilter } from './DashboardFilter';
import { DashboardExecutive } from './DashboardExecutive';
import { DashboardOperational } from './DashboardOperational';
import { DashboardMap } from './DashboardMap';
import { DashboardCalcModal } from './DashboardCalcModal';
import { DashboardFilters } from '../../services/dashboardService';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'EXECUTIVA' | 'OPERACIONAL' | 'MAPA'>('EXECUTIVA');
  const [showCalculoModal, setShowCalculoModal] = useState(false);

  // Filtros Globais 
  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30); // 30 dias de período padrão
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const [filters, setFilters] = useState<DashboardFilters>(() => {
    const cached = sessionStorage.getItem('dashboard_filters');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.dateRange?.start && parsed?.dateRange?.end) {
          return parsed;
        }
      } catch (e) {
        // Fallback para default
      }
    }
    return { dateRange: getDefaultDates() };
  });

  const handleFilterChange = (newFilters: DashboardFilters) => {
    setFilters(newFilters);
    sessionStorage.setItem('dashboard_filters', JSON.stringify(newFilters));
  };

  const breadcrumbItems = [
    { label: t('dashboard.pageTitle'), current: true }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header com Saudação e Filtros Inline */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.welcome', { name: user?.name || 'Usuário' })}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Métricas consolidadas de desempenho, operação e faturamento logístico.
          </p>
        </div>

        {/* Filtros Container */}
        <DashboardFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          onShowCalc={() => setShowCalculoModal(true)}
        />
      </div>

      {/* Navegação de Abas (Tabs) */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex bg-gray-50 dark:bg-gray-800/50 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('EXECUTIVA')}
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'EXECUTIVA'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
          >
            Visão Executiva
          </button>
          <button
            onClick={() => setActiveTab('OPERACIONAL')}
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'OPERACIONAL'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
          >
            Nível de Serviço
          </button>
          <button
            onClick={() => setActiveTab('MAPA')}
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'MAPA'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
          >
            Mapa de Custos
          </button>
        </div>
      </div>

      {/* Renderização Condicional da Aba Ativa */}
      <div className="mt-6">
        {activeTab === 'EXECUTIVA' && <DashboardExecutive filters={filters} />}
        {activeTab === 'OPERACIONAL' && <DashboardOperational filters={filters} />}
        {activeTab === 'MAPA' && <DashboardMap filters={filters} />}
      </div>

      <DashboardCalcModal 
        isOpen={showCalculoModal} 
        onClose={() => setShowCalculoModal(false)} 
      />
    </div>
  );
};
