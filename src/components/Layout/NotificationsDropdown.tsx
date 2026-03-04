import React, { useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, Truck, Package, FileText, Clock, X, Eye } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  type: 'success' | 'warning' | 'info' | 'error';
  link?: string;
}

interface NotificationsDropdownProps {
  onMarkAllAsRead: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ onMarkAllAsRead }) => {
  // Mock notifications data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'Entrega Concluída',
      description: 'A entrega TMS-2025-001 foi concluída com sucesso',
      time: '5 min atrás',
      isRead: false,
      type: 'success',
      link: '/shipments'
    },
    {
      id: 2,
      title: 'Ocorrência Registrada',
      description: 'Nova ocorrência na entrega TMS-2025-002: Destinatário ausente',
      time: '30 min atrás',
      isRead: false,
      type: 'warning',
      link: '/shipments'
    },
    {
      id: 3,
      title: 'CT-e Recebido',
      description: 'Novo CT-e recebido da Transportadora ABC',
      time: '1 hora atrás',
      isRead: false,
      type: 'info',
      link: '/ctes'
    },
    {
      id: 4,
      title: 'Fatura Reprovada',
      description: 'A fatura FAT-2025-123 foi reprovada por divergência de valor',
      time: '3 horas atrás',
      isRead: true,
      type: 'error',
      link: '/bills'
    },
    {
      id: 5,
      title: 'Novo Usuário',
      description: 'O usuário Carlos Silva foi cadastrado no sistema',
      time: '1 dia atrás',
      isRead: true,
      type: 'info',
      link: '/users'
    }
  ]);

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

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    onMarkAllAsRead();
  };

  const clearNotifications = () => {
    setNotifications([]);
    onMarkAllAsRead();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
                className={`p-4 transition-colors ${getNotificationBgColor(notification.type, notification.isRead)}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">{notification.time}</p>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.description}</p>
                    
                    <div className="mt-2 flex items-center justify-between">
                      {notification.link && (
                        <a href={notification.link} className="text-xs text-blue-600 hover:text-blue-800 flex items-center">
                          <Eye size={12} className="mr-1" />
                          Ver detalhes
                        </a>
                      )}
                      
                      {!notification.isRead && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
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
          onClick={clearNotifications}
          className="text-xs text-red-600 hover:text-red-800"
          disabled={notifications.length === 0}
        >
          Limpar notificações
        </button>
        <a href="#" className="text-xs text-blue-600 hover:text-blue-800 flex items-center">
          Ver todas
        </a>
      </div>
    </div>
  );
};