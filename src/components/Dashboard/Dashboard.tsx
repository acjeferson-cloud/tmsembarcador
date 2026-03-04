import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Package, Truck, DollarSign, TrendingUp, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalDeliveries: number;
  activeCarriers: number;
  monthlyExpense: number;
  deliveryRate: number;
}

interface MonthlyPerformance {
  name: string;
  entregas: number;
}

interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Date Range Picker - Padrão: últimos 7 dias
  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6); // 7 dias incluindo hoje
    return { start, end };
  };

  const [dateRange, setDateRange] = useState(getDefaultDates());
  const [startDate, setStartDate] = useState(dateRange.start.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(dateRange.end.toISOString().split('T')[0]);
  const [dateError, setDateError] = useState('');

  const [stats, setStats] = useState<DashboardStats>({
    totalDeliveries: 0,
    activeCarriers: 0,
    monthlyExpense: 0,
    deliveryRate: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyPerformance[]>([]);
  const [statusData, setStatusData] = useState<StatusDistribution[]>([]);

  // Dados fictícios para demonstração (organização 00000001)
  const getDemoData = () => {
    console.log('📊 Carregando dados de demonstração...');

    // KPIs principais com dados realistas
    const demoStats: DashboardStats = {
      totalDeliveries: 2847,        // Total de entregas no período
      activeCarriers: 24,            // Transportadoras ativas
      monthlyExpense: 184750.89,    // Despesa mensal em frete
      deliveryRate: 96.3            // Taxa de entrega bem-sucedida
    };

    // Performance mensal - Últimos 6 meses com tendência de crescimento
    const demoMonthlyData: MonthlyPerformance[] = [
      { name: 'Jan', entregas: 1850 },
      { name: 'Fev', entregas: 2120 },
      { name: 'Mar', entregas: 2450 },
      { name: 'Abr', entregas: 2680 },
      { name: 'Mai', entregas: 2750 },
      { name: 'Jun', entregas: 2847 }
    ];

    // Distribuição de status - Percentuais realistas de operação
    const demoStatusData: StatusDistribution[] = [
      { name: 'Entregue', value: 68, color: '#10B981' },        // 68% entregas concluídas
      { name: 'Em Trânsito', value: 22, color: '#3B82F6' },     // 22% em transporte
      { name: 'Aguardando Coleta', value: 7, color: '#F59E0B' }, // 7% aguardando coleta
      { name: 'Cancelada', value: 3, color: '#EF4444' }         // 3% canceladas
    ];

    setStats(demoStats);
    setMonthlyData(demoMonthlyData);
    setStatusData(demoStatusData);

    console.log('✅ Dados de demonstração carregados:', {
      entregas: demoStats.totalDeliveries,
      transportadoras: demoStats.activeCarriers,
      despesa: `R$ ${demoStats.monthlyExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      taxaEntrega: `${demoStats.deliveryRate}%`
    });
  };

  const validateDateRange = (start: string, end: string): boolean => {
    const startD = new Date(start);
    const endD = new Date(end);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Não permitir datas futuras
    if (endD > today) {
      setDateError('Não é permitido selecionar datas futuras.');
      return false;
    }

    // Não permitir mais de 90 dias
    const diffTime = Math.abs(endD.getTime() - startD.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 90) {
      setDateError('O período máximo permitido é de 90 dias.');
      return false;
    }

    // Data inicial deve ser menor ou igual à final
    if (startD > endD) {
      setDateError('A data inicial deve ser anterior ou igual à data final.');
      return false;
    }

    setDateError('');
    return true;
  };

  const handleDateChange = () => {
    if (validateDateRange(startDate, endDate)) {
      setDateRange({
        start: new Date(startDate),
        end: new Date(endDate)
      });
      loadDashboardData(new Date(startDate), new Date(endDate));
    }
  };

  const loadDashboardData = async (start?: Date, end?: Date) => {
    try {
      setLoading(true);
      console.log('📊 Carregando dados do Dashboard...');

      const startD = start || dateRange.start;
      const endD = end || dateRange.end;

      // Verificar se é organização de demonstração usando o localStorage
      const selectedOrgId = localStorage.getItem('tms-selected-organization');

      if (selectedOrgId) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('slug')
          .eq('id', selectedOrgId)
          .maybeSingle();

        // Se for organização 00000001 (demonstração), usar dados fictícios
        if (orgData?.slug === '00000001') {
          console.log('✅ Organização 00000001 detectada - carregando dados de demonstração');
          getDemoData();
          setLastUpdate(new Date());
          setLoading(false);
          return;
        }
      }

      // Caso contrário, buscar dados reais
      const firstDay = new Date(startD);
      firstDay.setHours(0, 0, 0, 0);

      const lastDay = new Date(endD);
      lastDay.setHours(23, 59, 59, 999);

      console.log('📅 Período selecionado:', {
        firstDay: firstDay.toISOString(),
        lastDay: lastDay.toISOString()
      });

      // 1. TOTAL DE ENTREGAS
      const { count: deliveredInvoicesCount } = await supabase
        .from('invoices_nfe')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Validada')
        .gte('issue_date', firstDay.toISOString())
        .lte('issue_date', lastDay.toISOString());

      const totalDeliveries = deliveredInvoicesCount || 0;

      // 2. TRANSPORTADORES ATIVOS
      const { count: activeCarriersCount } = await supabase
        .from('carriers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo');

      const activeCarriers = activeCarriersCount || 0;

      // 3. DESPESA NO PERÍODO
      const { data: ctes } = await supabase
        .from('ctes_complete')
        .select('freight_value_value, total_value')
        .gte('issue_date', firstDay.toISOString())
        .lte('issue_date', lastDay.toISOString());

      const monthlyExpense = ctes?.reduce((sum, cte) => {
        const value = parseFloat(cte.total_value || cte.freight_value_value || '0');
        return sum + value;
      }, 0) || 0;

      // 4. TAXA DE ENTREGA
      const { count: totalInvoicesCount } = await supabase
        .from('invoices_nfe')
        .select('*', { count: 'exact', head: true })
        .gte('issue_date', firstDay.toISOString())
        .lte('issue_date', lastDay.toISOString());

      const totalInvoices = totalInvoicesCount || 0;
      const deliveryRate = totalInvoices > 0 ? (totalDeliveries / totalInvoices) * 100 : 0;

      setStats({
        totalDeliveries,
        activeCarriers,
        monthlyExpense,
        deliveryRate
      });

      // 5. PERFORMANCE MENSAL (últimos 6 meses)
      const performanceData: MonthlyPerformance[] = [];
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

        const { count: monthDeliveries } = await supabase
          .from('invoices_nfe')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Validada')
          .gte('issue_date', monthStart.toISOString())
          .lte('issue_date', monthEnd.toISOString());

        performanceData.push({
          name: monthNames[monthDate.getMonth()],
          entregas: monthDeliveries || 0
        });
      }

      setMonthlyData(performanceData);

      // 6. STATUS DAS ENTREGAS
      const { data: invoicesByStatus } = await supabase
        .from('invoices_nfe')
        .select('status')
        .gte('issue_date', firstDay.toISOString())
        .lte('issue_date', lastDay.toISOString());

      const statusCounts: { [key: string]: number } = {};
      invoicesByStatus?.forEach(invoice => {
        const status = invoice.status || 'Pendente';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const totalStatusInvoices = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

      const statusColors: { [key: string]: string } = {
        'Validada': '#10B981',
        'Emitida': '#3B82F6',
        'Pendente': '#F59E0B',
        'Cancelada': '#EF4444'
      };

      const statusDistribution: StatusDistribution[] = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: totalStatusInvoices > 0 ? Math.round((count / totalStatusInvoices) * 100) : 0,
        color: statusColors[status] || '#6B7280'
      }));

      setStatusData(statusDistribution);
      setLastUpdate(new Date());

    } catch (error) {
      console.error('❌ Erro ao carregar dados do Dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('pt-BR');
  };

  const breadcrumbItems = [
    { label: t('dashboard.pageTitle'), current: true }
  ];

  const kpiCardsData = [
    {
      title: t('dashboard.totalDeliveries'),
      value: stats.totalDeliveries.toLocaleString('pt-BR'),
      icon: Package,
      color: 'blue'
    },
    {
      title: t('dashboard.activeCarriers'),
      value: stats.activeCarriers.toString(),
      icon: Truck,
      color: 'green'
    },
    {
      title: t('dashboard.monthlyRevenue'),
      value: `R$ ${stats.monthlyExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'purple'
    },
    {
      title: t('dashboard.deliveryRate'),
      value: `${stats.deliveryRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'orange'
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header com Título, Date Range Picker e Última Atualização */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.welcome', { name: user?.name || 'Usuário' })}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2">
            <Calendar size={20} className="text-gray-500 dark:text-gray-400" />
            <input
              type="date"
              value={startDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
            />
            <span className="text-gray-500 dark:text-gray-400">até</span>
            <input
              type="date"
              value={endDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
            />
            <button
              onClick={handleDateChange}
              className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Aplicar
            </button>
          </div>

          {/* Última Atualização e Botão Atualizar */}
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Última atualização: <span className="font-mono">{formatLastUpdate(lastUpdate)}</span>
            </div>
            <button
              onClick={() => loadDashboardData()}
              disabled={loading}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Atualizar dados"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {dateError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{dateError}</p>
        </div>
      )}

      {/* Stats Cards */}
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
                `}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.monthlyPerformance')}</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  formatter={(value) => [`${value} ${t('dashboard.deliveries')}`, t('dashboard.totalDeliveries')]}
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="entregas" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              Nenhum dado disponível
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.deliveryStatus')}</h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Percentual']}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}: {item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              Nenhum dado disponível
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
