import React, { useState, useEffect } from 'react';
import { X, Clock, Activity, Calendar, User, Upload, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { userActivitiesService, UserActivity } from '../../services/userActivitiesService';
import { formatDistanceToNow, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecentActivitiesModal: React.FC<RecentActivitiesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadActivities();
    }
  }, [isOpen]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await userActivitiesService.getRecentActivities(20);
      setActivities(data);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: ptBR });
    } catch (e) {
      return '';
    }
  };

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'criacao':
      case 'importacao': return <Upload size={16} className="text-blue-500" />;
      case 'edicao': return <RefreshCw size={16} className="text-yellow-500" />;
      case 'aprovacao': return <CheckCircle size={16} className="text-green-500" />;
      case 'reprovacao':
      case 'cancelamento':
      case 'exclusao': return <XCircle size={16} className="text-red-500" />;
      case 'acesso':
      default: return <Activity size={16} className="text-indigo-500" />;
    }
  };

  const todayActivities = activities.filter(a => isToday(parseISO(a.created_at)));
  const earlierActivities = activities.filter(a => !isToday(parseISO(a.created_at)));

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
            {user?.foto_perfil_url ? (
               <img src={user.foto_perfil_url} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
               <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold uppercase">
                 {user?.name ? user.name.charAt(0) : <User size={20} />}
               </div>
            )}
            <div>
              <p className="font-medium text-blue-900">{user?.name || 'Usuário'}</p>
              <p className="text-sm text-blue-700 capitalize">{user?.perfil || t('recentActivities.userRole')}</p>
            </div>
          </div>

          {loading ? (
             <div className="flex justify-center p-4">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
             </div>
          ) : activities.length === 0 ? (
             <div className="text-center p-4 text-gray-500 text-sm">Nenhuma atividade recente registrada.</div>
          ) : (
            <>
              {/* Today's Activities */}
              {todayActivities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                    <Calendar size={14} className="mr-1" />
                    HOJE
                  </h3>
                  <div className="space-y-4">
                    {todayActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start p-3 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                        <div className="flex-shrink-0 mr-3">
                          {getActivityIcon(activity.action_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.module_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(activity.created_at)}</p>
                          </div>
                          {activity.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Earlier Activities */}
              {earlierActivities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                    <Calendar size={14} className="mr-1" />
                    ANTERIOR
                  </h3>
                  <div className="space-y-4">
                    {earlierActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start p-3 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                        <div className="flex-shrink-0 mr-3">
                          {getActivityIcon(activity.action_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.module_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(activity.created_at)}</p>
                          </div>
                          {activity.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
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
