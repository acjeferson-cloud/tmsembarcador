import React, { useState, useEffect } from 'react';
import { Package, Truck, DollarSign, TrendingUp, AlertCircle, Percent, Scale, AlertTriangle, FileWarning } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { dashboardService, DashboardFilters, DashboardExecutiveKPIs, DashboardEvolucaoCusto, DashboardTopTransportadora } from '../../services/dashboardService';

interface Props {
  filters: DashboardFilters;
}

export const DashboardExecutive: React.FC<Props> = ({ filters }) => {
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState<DashboardExecutiveKPIs | null>(null);
  const [evolucao, setEvolucao] = useState<DashboardEvolucaoCusto[]>([]);
  const [topCarriers, setTopCarriers] = useState<DashboardTopTransportadora[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [kpiData, evolucaoData, topCarriersData] = await Promise.all([
        dashboardService.getExecutiveKPIs(filters),
        dashboardService.getEvolucaoCustos(filters),
        dashboardService.getTopTransportadoras(filters)
      ]);

      setKpis(kpiData);
      setEvolucao(evolucaoData);
      setTopCarriers(topCarriersData);

    } catch (e: any) {
      setError('Falha ao carregar visão executiva. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  const kpiCardsData = [
    {
      title: 'Despesa de Frete (R$)',
      value: kpis ? `R$ ${kpis.custoTotalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ 0,00',
      icon: DollarSign,
      color: 'blue'
    },
    {
      title: 'Embarques (Pedido)',
      value: kpis ? kpis.totalEmbarques.toLocaleString('pt-BR') : '0',
      icon: Package,
      color: 'purple'
    },
    {
      title: 'Ticket Médio (R$/Pedido)',
      value: kpis ? `R$ ${kpis.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
      icon: TrendingUp,
      color: 'orange'
    },
    {
      title: 'SLA (On-Time in Full)',
      value: kpis ? `${kpis.slaOtif.toFixed(1)}%` : '0%',
      icon: Truck,
      color: (kpis && kpis.slaOtif >= 95) ? 'green' : (kpis && kpis.slaOtif >= 90 ? 'orange' : 'red')
    },
    {
      title: 'Representatividade (Frete/Mercadoria)',
      value: kpis ? `${kpis.representatividade.toFixed(2)}%` : '0%',
      icon: Percent,
      color: 'blue'
    },
    {
      title: 'Custo Operacional (R$/Kg)',
      value: kpis ? `R$ ${kpis.custoKg.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ 0,00',
      icon: Scale,
      color: 'orange'
    },
    {
      title: 'Custo em Divergências',
      value: kpis ? `R$ ${kpis.custoDivergencia.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ 0,00',
      icon: AlertTriangle,
      color: (kpis && kpis.custoDivergencia > 0) ? 'red' : 'green'
    },
    {
      title: 'Taxas Extras / Acessórias (%)',
      value: kpis ? `${kpis.taxasExtrasPercent.toFixed(2)}%` : '0%',
      icon: FileWarning,
      color: 'red'
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        ))}
      </div>
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
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCardsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center
                  ${stat.color === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                  ${stat.color === 'green' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : ''}
                  ${stat.color === 'purple' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : ''}
                  ${stat.color === 'orange' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                  ${stat.color === 'red' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : ''}
                `}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolução de Custos (Composed Chart) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Evolução de Custos Operacionais</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={evolucao}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="data" stroke="#6B7280" axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" stroke="#6B7280" axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
              <YAxis yAxisId="right" orientation="right" stroke="#6B7280" axisLine={false} tickLine={false} />
              <Tooltip 
                 formatter={(value: any, name: string) => {
                   if (name === "Custo Faturado") return [`R$ ${Number(value).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, name];
                   return [value, name];
                 }}
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Bar yAxisId="left" dataKey="custo" name="Custo Faturado" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="entregas" name="Vol. CT-es" stroke="#10B981" strokeWidth={3} dot={{r: 4}} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Top Transportadoras */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Share de Transportadoras</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCarriers} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
              <XAxis type="number" stroke="#6B7280" axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
              <YAxis type="category" dataKey="nome" stroke="#6B7280" axisLine={false} tickLine={false} width={100} />
              <Tooltip 
                 formatter={(value: any, name: string) => [`R$ ${Number(value).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 'Faturamento']}
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="valor" name="Custo" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
