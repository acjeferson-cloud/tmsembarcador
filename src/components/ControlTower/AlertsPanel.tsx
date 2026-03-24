import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Clock, Truck, X, Bell, CheckCircle } from 'lucide-react';

interface Alert {
  id: number;
  type: 'delay' | 'stopped' | 'route_deviation' | 'maintenance' | 'fuel';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  vehicleId?: string;
  isRead: boolean;
}

export const AlertsPanel: React.FC = () => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 1,
      type: 'stopped',
      title: 'Veículo Parado',
      description: 'Caminhão ABC-1234 parado há 2h30min em local não programado',
      severity: 'high',
      timestamp: '10:30',
      vehicleId: 'V002',
      isRead: false
    },
    {
      id: 2,
      type: 'delay',
      title: 'Atraso na Entrega',
      description: 'Rota SP-RJ com atraso de 3 horas devido ao trânsito',
      severity: 'medium',
      timestamp: '09:15',
      vehicleId: 'V003',
      isRead: false
    },
    {
      id: 3,
      type: 'route_deviation',
      title: 'Desvio de Rota',
      description: 'Van XYZ-5678 desviou da rota programada',
      severity: 'medium',
      timestamp: '08:45',
      vehicleId: 'V004',
      isRead: true
    },
    {
      id: 4,
      type: 'fuel',
      title: 'Combustível Baixo',
      description: 'Nível de combustível abaixo de 20% - Truck DEF-9012',
      severity: 'low',
      timestamp: '08:20',
      vehicleId: 'V001',
      isRead: true
    },
    {
      id: 5,
      type: 'maintenance',
      title: 'Manutenção Preventiva',
      description: 'Veículo GHI-3456 precisa de manutenção em 500km',
      severity: 'low',
      timestamp: '07:30',
      vehicleId: 'V005',
      isRead: true
    }
  ]);

  const dismissAlert = (alertId: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const markAsRead = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-red-600 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'stopped': return <Clock size={16} className="text-orange-600" />;
      case 'delay': return <AlertTriangle size={16} className="text-red-600" />;
      case 'route_deviation': return <Truck size={16} className="text-yellow-600" />;
      case 'maintenance': return <CheckCircle size={16} className="text-blue-600" />;
      case 'fuel': return <Bell size={16} className="text-purple-600" />;
      default: return <AlertTriangle size={16} className="text-gray-600 dark:text-gray-400" />;
    }
  };

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('controlTower.alerts.title')}</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
          {t('controlTower.alerts.viewAll')}
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`
              border-l-4 p-4 rounded-r-lg transition-all duration-200 hover:shadow-sm
              ${getSeverityColor(alert.severity)}
              ${!alert.isRead ? 'ring-1 ring-blue-200' : ''}
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getSeverityIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`text-sm font-medium ${!alert.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                      {alert.title}
                    </h4>
                    {!alert.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{alert.timestamp}</span>
                    {alert.vehicleId && (
                      <span className="text-xs bg-gray-200 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                        {alert.vehicleId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-2">
                {!alert.isRead && (
                  <button
                    onClick={() => markAsRead(alert.id)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-white dark:bg-gray-800 transition-colors"
                    title={t('controlTower.alerts.markAsRead')}
                  >
                    <CheckCircle size={14} />
                  </button>
                )}
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-white dark:bg-gray-800 transition-colors"
                  title={t('controlTower.alerts.dismiss')}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">{t('controlTower.alerts.noActiveAlerts')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('controlTower.alerts.allNormals')}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
            {t('controlTower.alerts.configureAlerts')}
          </button>
          <button className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:bg-gray-700 transition-colors">
            {t('controlTower.alerts.history')}
          </button>
        </div>
      </div>
    </div>
  );
};