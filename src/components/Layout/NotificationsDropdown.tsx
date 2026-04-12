import React from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, X, Eye } from 'lucide-react';
import { AppNotification, notificationService } from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationsDropdownProps {
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ 
  notifications, 
  onMarkAllAsRead, 
  onMarkAsRead,
  onClear,
  onClose
}) => {

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'error':
        return <X size={16} className="text-red-500" />;
      case 'info':
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    if (isRead) return 'hover:bg-gray-50';
    
    switch (type) {
      case 'success':
        return 'bg-green-50 hover:bg-green-100';
      case 'warning':
        return 'bg-yellow-50 hover:bg-yellow-100';
      case 'error':
        return 'bg-red-50 hover:bg-red-100';
      case 'info':
      default:
        return 'bg-blue-50 hover:bg-blue-100';
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    onMarkAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    onMarkAllAsRead();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell size={16} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notificações</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800"
            disabled={unreadCount === 0}
          >
            Marcar todas como lidas
          </button>
        </div>
      </div>
      
      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {notifications.map(notification => (
              <div 
                key={notification.id}
                className={`p-4 transition-colors ${getNotificationBgColor(notification.type, notification.is_read)}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className={`text-sm font-medium ${notification.is_read ? 'text-gray-900' : 'text-gray-900 font-semibold'}`}>
                        {notification.title} {notification.priority === 'critical' && <span className="ml-2 text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Crítica</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                    
                    <div className="mt-2 flex items-center justify-between">
                      {notification.link ? (
                        <button 
                          onClick={() => {
                            onClose();
                            if (notification.link) {
                               const route = notification.link.replace(/^\//, ''); // remove leading slash se houver
                               window.dispatchEvent(new CustomEvent('app-navigate', { detail: route }));
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center font-medium"
                        >
                          Ação Necessária <Eye size={12} className="ml-1" />
                        </button>
                      ) : (
                        <span />
                      )}
                      
                      {!notification.is_read && (
                        <button 
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
                        >
                          Marcar como lida
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Bell size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Não há notificações</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
        <button 
          onClick={onClear}
          className="text-xs text-gray-600 hover:text-gray-800"
          disabled={notifications.length === 0}
        >
          Limpar lista
        </button>
        <button 
          onClick={() => {
            onClose();
            window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'notifications' }));
          }}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Ver todas as notificações
        </button>
      </div>
    </div>
  );
};
