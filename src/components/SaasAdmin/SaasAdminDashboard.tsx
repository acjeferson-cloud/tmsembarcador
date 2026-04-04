import React, { useState, useEffect } from 'react';
import {
  Users,
  Database,
  Activity,
  AlertTriangle,
  TrendingUp,
  Server,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { saasTenantsService } from '../../services/saasTenantsService';
import { saasMetricsService } from '../../services/saasMetricsService';

export function SaasAdminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [tenantsData, alertsData, healthData] = await Promise.all([
        saasTenantsService.getTenants(),
        saasMetricsService.getAlerts(),
        saasMetricsService.getHealthStatus()
      ]);

      setTenants(tenantsData);
      setAlerts(alertsData.filter(a => a.status === 'new'));
      setHealthStatus(healthData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    {
      label: 'Total de Clientes',
      value: tenants.length,
      icon: Users,
      color: 'blue',
      trend: '+5 este mês'
    },
    {
      label: 'Clientes Ativos',
      value: tenants.filter(t => t.status === 'active').length,
      icon: CheckCircle,
      color: 'green',
      trend: '95% de ativação'
    },
    {
      label: 'Bases de Dados',
      value: tenants.length,
      icon: Database,
      color: 'purple',
      trend: 'Todas online'
    },
    {
      label: 'Alertas Ativos',
      value: alerts.length,
      icon: AlertTriangle,
      color: alerts.length > 0 ? 'red' : 'gray',
      trend: alerts.length > 0 ? 'Requer atenção' : 'Tudo OK'
    }
  ];

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    trial: 'bg-blue-100 text-blue-800',
    suspended: 'bg-orange-100 text-orange-800',
    blocked: 'bg-red-100 text-red-800'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            red: 'bg-red-100 text-red-600',
            gray: 'bg-gray-100 text-gray-600'
          };

          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{stat.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.trend}</p>
            </div>
          );
        })}
      </div>

      {/* Health Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Status de Saúde do Sistema</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            healthStatus?.status === 'healthy'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {healthStatus?.status === 'healthy' ? 'Saudável' : 'Atenção'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Serviços Online</p>
              <p className="text-sm text-green-700">100% de disponibilidade</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
            <Server className="w-8 h-8 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Performance</p>
              <p className="text-sm text-blue-700">Tempo de resposta: 120ms</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
            <Database className="w-8 h-8 text-purple-600" />
            <div>
              <p className="font-medium text-purple-900">Armazenamento</p>
              <p className="text-sm text-purple-700">45% utilizado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tenants */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Clientes Recentes</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Criado em
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
              {tenants.slice(0, 5).map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50 dark:bg-gray-900">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {tenant.tenant_code}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{tenant.company_name}</div>
                      {tenant.trade_name && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{tenant.trade_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {tenant.plan?.display_name || 'Sem plano'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      statusColors[tenant.status as keyof typeof statusColors] || statusColors.inactive
                    }`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tenants.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Nenhum cliente cadastrado ainda
          </div>
        )}
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            Alertas Ativos
          </h2>

          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-900">{alert.title}</h3>
                  <p className="text-sm text-red-700 mt-1">{alert.message}</p>
                  <p className="text-xs text-red-600 mt-2">
                    {new Date(alert.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
