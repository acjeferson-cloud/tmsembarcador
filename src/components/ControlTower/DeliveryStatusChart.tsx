import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const hourlyData = [
  { hour: '00:00', entregas: 12, coletadas: 8 },
  { hour: '02:00', entregas: 8, coletadas: 5 },
  { hour: '04:00', entregas: 15, coletadas: 12 },
  { hour: '06:00', entregas: 25, coletadas: 20 },
  { hour: '08:00', entregas: 45, coletadas: 38 },
  { hour: '10:00', entregas: 52, coletadas: 48 },
  { hour: '12:00', entregas: 38, coletadas: 35 },
  { hour: '14:00', entregas: 42, coletadas: 40 },
  { hour: '16:00', entregas: 35, coletadas: 32 },
  { hour: '18:00', entregas: 28, coletadas: 25 },
  { hour: '20:00', entregas: 18, coletadas: 15 },
  { hour: '22:00', entregas: 12, coletadas: 10 },
];

export const DeliveryStatusChart: React.FC = () => {
  const { t } = useTranslation();

  const statusData = [
    { name: t('controlTower.kpis.inTransit'), value: 35, color: '#3B82F6' },
    { name: t('controlTower.kpis.delivered'), value: 45, color: '#10B981' },
    { name: t('controlTower.kpis.delayed'), value: 12, color: '#EF4444' },
    { name: t('controlTower.kpis.waitingCollection'), value: 8, color: '#F59E0B' },
  ];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('controlTower.deliveryStatus.title')}</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('controlTower.deliveryStatus.deliveries')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('controlTower.deliveryStatus.collected')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Chart */}
        <div className="lg:col-span-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">{t('controlTower.deliveryStatus.hourlyChartTitle')}</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="entregas" fill="#3B82F6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="coletadas" fill="#10B981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">{t('controlTower.deliveryStatus.statusDistribution')}</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, t('controlTower.deliveryStatus.percent')]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};