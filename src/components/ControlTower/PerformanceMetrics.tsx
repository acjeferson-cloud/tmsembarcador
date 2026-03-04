import React from 'react';
import { TrendingUp, TrendingDown, Target, Clock, Fuel, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const performanceData = [
  { time: '00:00', efficiency: 85, fuel: 92, onTime: 88 },
  { time: '04:00', efficiency: 78, fuel: 89, onTime: 85 },
  { time: '08:00', efficiency: 92, fuel: 85, onTime: 94 },
  { time: '12:00', efficiency: 88, fuel: 82, onTime: 91 },
  { time: '16:00', efficiency: 95, fuel: 88, onTime: 96 },
  { time: '20:00', efficiency: 89, fuel: 90, onTime: 89 },
];

const costData = [
  { time: '00:00', combustivel: 450, manutencao: 120, pedagio: 80 },
  { time: '04:00', combustivel: 520, manutencao: 150, pedagio: 95 },
  { time: '08:00', combustivel: 680, manutencao: 180, pedagio: 120 },
  { time: '12:00', combustivel: 750, manutencao: 200, pedagio: 140 },
  { time: '16:00', combustivel: 820, manutencao: 220, pedagio: 160 },
  { time: '20:00', combustivel: 890, manutencao: 240, pedagio: 180 },
];

export const PerformanceMetrics: React.FC = () => {
  const metrics = [
    {
      title: 'Eficiência Operacional',
      value: '94.2%',
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: Target,
      color: 'green'
    },
    {
      title: 'Consumo Médio',
      value: '3.2 km/L',
      change: '+0.3',
      changeType: 'positive' as const,
      icon: Fuel,
      color: 'blue'
    },
    {
      title: 'Tempo Médio Rota',
      value: '4.8h',
      change: '-0.5h',
      changeType: 'positive' as const,
      icon: Clock,
      color: 'purple'
    },
    {
      title: 'Custo por KM',
      value: 'R$ 2.45',
      change: '-R$ 0.15',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'orange'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Métricas de Performance</h3>
        <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>Últimas 24h</option>
          <option>Última semana</option>
          <option>Último mês</option>
        </select>
      </div>

      {/* Performance KPIs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Icon size={20} className={`
                  ${metric.color === 'green' ? 'text-green-600' : ''}
                  ${metric.color === 'blue' ? 'text-blue-600' : ''}
                  ${metric.color === 'purple' ? 'text-purple-600' : ''}
                  ${metric.color === 'orange' ? 'text-orange-600' : ''}
                `} />
                <span className={`
                  text-xs font-medium flex items-center space-x-1
                  ${metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}
                `}>
                  {metric.changeType === 'positive' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span>{metric.change}</span>
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{metric.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{metric.title}</p>
            </div>
          );
        })}
      </div>

      {/* Performance Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Tendência de Performance</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={2} name="Eficiência %" />
            <Line type="monotone" dataKey="onTime" stroke="#3B82F6" strokeWidth={2} name="Pontualidade %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cost Analysis */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Análise de Custos (R$)</h4>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={costData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="combustivel" stackId="1" stroke="#EF4444" fill="#FEE2E2" name="Combustível" />
            <Area type="monotone" dataKey="manutencao" stackId="1" stroke="#F59E0B" fill="#FEF3C7" name="Manutenção" />
            <Area type="monotone" dataKey="pedagio" stackId="1" stroke="#8B5CF6" fill="#EDE9FE" name="Pedágio" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">98.5%</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Disponibilidade</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">2.1h</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Tempo Parado</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">R$ 1.2M</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Economia Mensal</p>
          </div>
        </div>
      </div>
    </div>
  );
};