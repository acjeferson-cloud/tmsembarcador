import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, Truck, ShieldAlert } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { dashboardService, DashboardFilters, DashboardFunilStatus, DashboardMetricasOperacionais } from '../../services/dashboardService';
import { useTranslation } from 'react-i18next';

interface Props {
  filters: DashboardFilters;
}

export const DashboardOperational: React.FC<Props> = ({ filters }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [funil, setFunil] = useState<DashboardFunilStatus[]>([]);
  const [metricas, setMetricas] = useState<DashboardMetricasOperacionais | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [funilData, metricasData] = await Promise.all([
         dashboardService.getFunilOperacional(filters),
         dashboardService.getMetricasOperacionais(filters)
      ]);
      
      setFunil(funilData);
      setMetricas(metricasData);
    } catch (e: any) {
      setError(t('dashboard.operational.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const statusLabels: Record<string, string> = {
    'pendente': t('dashboard.operational.status.pending'),
    'processando': t('dashboard.operational.status.processing'),
    'aguardando_coleta': t('dashboard.operational.status.awaiting_collection'),
    'coletado': t('dashboard.operational.status.collected'),
    'em_transito': t('dashboard.operational.status.in_transit'),
    'saiu_entrega': t('dashboard.operational.status.out_for_delivery'),
    'entregue': t('dashboard.operational.status.delivered'),
    'cancelado': t('dashboard.operational.status.canceled')
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pendente': '#9CA3AF', // Gray
      'processando': '#60A5FA', // Blue
      'aguardando_coleta': '#FCD34D', // Yellow
      'coletado': '#8B5CF6', // Purple
      'em_transito': '#F59E0B', // Orange
      'saiu_entrega': '#6366F1', // Indigo
      'entregue': '#10B981', // Green
      'cancelado': '#EF4444' // Red
    };
    return colors[status.toLowerCase()] || '#D1D5DB';
  };

  const statusOrder = [
    'pendente',
    'processando',
    'aguardando_coleta',
    'coletado',
    'em_transito',
    'saiu_entrega',
    'entregue',
    'cancelado'
  ];
  
  const orderedFunil = [...funil].sort((a, b) => {
     return statusOrder.indexOf(a.status.toLowerCase()) - statusOrder.indexOf(b.status.toLowerCase());
  });

  const totalEmbarques = funil.reduce((acc, curr) => acc + curr.quantidade, 0);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm h-64 animate-pulse"></div>
    );
  }

  if (error) {
    return (
       <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
         <AlertCircle size={20} />
         <p>{error}</p>
       </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Top Operacional KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.operational.leadTime')}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{metricas ? metricas.leadTimeDias : '0'}</p>
          </div>
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
             <Clock size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.operational.collectionSla')}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{metricas ? metricas.slaColetaAtrasoHoras : '0'}h</p>
          </div>
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
             <Truck size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.operational.backlogVolume')}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{metricas ? metricas.backlogVolume : '0'}</p>
          </div>
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
             <ShieldAlert size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Funil Visual Direto */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('dashboard.operational.pipeline')}</h3>
          
          <div className="flex flex-col space-y-4">
            {orderedFunil.map((item) => {
               const percentage = totalEmbarques > 0 ? (item.quantidade / totalEmbarques) * 100 : 0;
               return (
                 <div key={item.status} className="flex items-center">
                   <div className="w-48 text-sm font-medium text-gray-600 dark:text-gray-400">
                     {statusLabels[item.status.toLowerCase()] || item.status.toUpperCase()}
                   </div>
                   <div className="flex-1 ml-4 relative h-8 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                     <div 
                       className="absolute h-full rounded-full transition-all duration-500 ease-out"
                       style={{ 
                         width: `${percentage}%`,
                         backgroundColor: getStatusColor(item.status)
                       }}
                     />
                     <div className="absolute inset-y-0 left-4 flex items-center text-xs font-bold text-white drop-shadow-md">
                       {item.quantidade} ({percentage.toFixed(1)}%)
                     </div>
                   </div>
                 </div>
               );
            })}
            
            {orderedFunil.length === 0 && (
               <div className="text-center text-gray-400 py-8">{t('dashboard.operational.noOrders')}</div>
            )}
          </div>
        </div>

        {/* Distribuição (Gráfico de Pizza) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('dashboard.operational.statusComposition')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderedFunil}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="quantidade"
                nameKey="status"
              >
                {orderedFunil.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                ))}
              </Pie>
              <Tooltip 
                 formatter={(value, name: string) => [value, statusLabels[name.toLowerCase()] || name.toUpperCase()]}
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Legend formatter={(value) => <span className="text-gray-600 dark:text-gray-300 capitalize">{statusLabels[value.toLowerCase()] || value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Top Ocorrências / Falhas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.operational.topOccurrences')}</h3>
          {metricas && metricas.topOcorrencias.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metricas.topOcorrencias} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="descricao" stroke="#6B7280" axisLine={false} tickLine={false} width={150} />
                <Tooltip 
                  formatter={(value: any) => [value, t('dashboard.operational.events')]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="quantidade" name={t('dashboard.operational.occurrences')} fill="#EF4444" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400">{t('dashboard.operational.noOccurrences')}</div>
          )}
        </div>

      </div>
    </div>
  );
};
