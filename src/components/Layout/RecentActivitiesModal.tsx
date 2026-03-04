import React from 'react';
import { X, Clock, Activity, Calendar, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Activity {
  label: string;
  time: string;
  icon?: React.ReactNode;
  details?: string;
}

interface RecentActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
}

export const RecentActivitiesModal: React.FC<RecentActivitiesModalProps> = ({
  isOpen,
  onClose,
  activities
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  // Expanded activities with more details
  const expandedActivities: Activity[] = [
    {
      label: t('recentActivities.activities.dashboard'),
      time: t('recentActivities.timeAgo.minutes', { count: 2 }),
      icon: <Activity size={16} className="text-blue-500" />,
      details: t('recentActivities.details.dashboard')
    },
    {
      label: t('recentActivities.activities.controlTower'),
      time: t('recentActivities.timeAgo.minutes', { count: 15 }),
      icon: <Activity size={16} className="text-indigo-500" />,
      details: t('recentActivities.details.controlTower')
    },
    {
      label: t('recentActivities.activities.freightQuote'),
      time: t('recentActivities.timeAgo.hour', { count: 1 }),
      icon: <Activity size={16} className="text-green-500" />,
      details: t('recentActivities.details.freightQuote')
    },
    {
      label: t('recentActivities.activities.tracking'),
      time: t('recentActivities.timeAgo.hours', { count: 2 }),
      icon: <Activity size={16} className="text-orange-500" />,
      details: t('recentActivities.details.tracking')
    },
    {
      label: t('recentActivities.activities.carriers'),
      time: t('recentActivities.timeAgo.day', { count: 1 }),
      icon: <Activity size={16} className="text-purple-500" />,
      details: t('recentActivities.details.carriers')
    },
    {
      label: t('recentActivities.activities.invoices'),
      time: t('recentActivities.timeAgo.day', { count: 1 }),
      icon: <Activity size={16} className="text-red-500" />,
      details: t('recentActivities.details.invoices')
    },
    {
      label: t('recentActivities.activities.ctes'),
      time: t('recentActivities.timeAgo.days', { count: 2 }),
      icon: <Activity size={16} className="text-teal-500" />,
      details: t('recentActivities.details.ctes')
    },
    {
      label: t('recentActivities.activities.users'),
      time: t('recentActivities.timeAgo.days', { count: 3 }),
      icon: <Activity size={16} className="text-gray-500 dark:text-gray-400" />,
      details: t('recentActivities.details.users')
    },
    {
      label: t('recentActivities.activities.reports'),
      time: t('recentActivities.timeAgo.days', { count: 4 }),
      icon: <Activity size={16} className="text-yellow-500" />,
      details: t('recentActivities.details.reports')
    },
    {
      label: t('recentActivities.activities.settings'),
      time: t('recentActivities.timeAgo.week', { count: 1 }),
      icon: <Activity size={16} className="text-blue-500" />,
      details: t('recentActivities.details.settings')
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Clock size={20} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('recentActivities.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Jeferson Carthen</p>
              <p className="text-sm text-blue-700">{t('recentActivities.userRole')}</p>
            </div>
          </div>

          {/* Today's Activities */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center">
              <Calendar size={14} className="mr-1" />
              {t('recentActivities.today')}
            </h3>
            <div className="space-y-4">
              {expandedActivities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start p-3 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                  <div className="flex-shrink-0 mr-3">
                    {activity.icon || <Clock size={16} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                    </div>
                    {activity.details && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activity.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Earlier Activities */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center">
              <Calendar size={14} className="mr-1" />
              {t('recentActivities.earlier')}
            </h3>
            <div className="space-y-4">
              {expandedActivities.slice(5).map((activity, index) => (
                <div key={index} className="flex items-start p-3 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                  <div className="flex-shrink-0 mr-3">
                    {activity.icon || <Clock size={16} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                    </div>
                    {activity.details && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activity.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center rounded-b-xl">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('recentActivities.showingDays')}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('recentActivities.close')}
          </button>
        </div>
      </div>
    </div>
  );
};