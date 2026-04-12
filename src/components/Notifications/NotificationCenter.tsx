import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle, AlertTriangle, Info, X, Eye, 
  Trash2, Mail, MailOpen, Filter, Search, MoreVertical, CheckSquare, Square
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppNotification, notificationService } from '../../services/notificationService';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [unreadOnly, setUnreadOnly] = useState(false);
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // UI State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, ids: string[]}>({ isOpen: false, ids: [] });
  
  // Drawer state
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const { data, count } = await notificationService.getPaginatedNotifications(page, limit, unreadOnly);
      setNotifications(data);
      setTotalCount(count);
      
      // We also update the unread count globally if possible, but let's just fetch it for this view.
      if (unreadOnly) {
        setUnreadCount(count);
      } else {
        const unreadData = await notificationService.getPaginatedNotifications(1, 1, true);
        setUnreadCount(unreadData.count);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setToast({ message: 'Erro ao carregar notificações', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [page, unreadOnly]);

  const getNotificationIcon = (type: string, size = 20) => {
    switch (type) {
      case 'success': return <CheckCircle size={size} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={size} className="text-yellow-500" />;
      case 'error': return <X size={size} className="text-red-500" />;
      case 'info':
      default: return <Info size={size} className="text-blue-500" />;
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const handleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleMarkAsRead = async (ids: string[], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markMultipleAsRead(ids);
      setToast({ message: 'Notificações marcadas como lidas.', type: 'success' });
      setSelectedIds([]);
      loadNotifications();
      // Emite evento para o Header atualizar o sininho
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (error) {
      setToast({ message: 'Erro ao marcar como lida', type: 'error' });
    }
  };

  const executeDelete = async () => {
    try {
      await notificationService.deleteMultiple(confirmDelete.ids);
      setToast({ message: 'Notificações removidas com sucesso.', type: 'success' });
      setSelectedIds([]);
      setConfirmDelete({ isOpen: false, ids: [] });
      loadNotifications();
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (error) {
      setToast({ message: 'Erro ao remover notificações', type: 'error' });
    }
  };

  const openDrawer = async (notification: AppNotification) => {
    setSelectedNotification(notification);
    if (!notification.is_read) {
      await notificationService.markAsRead(notification.id);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      window.dispatchEvent(new Event('notifications-updated'));
    }
  };

  const closeDrawer = () => {
    setSelectedNotification(null);
  };

  const handleNavigateAction = (link: string) => {
    closeDrawer();
    const route = link.replace(/^\//, '');
    window.dispatchEvent(new CustomEvent('app-navigate', { detail: route }));
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            <Bell className="text-blue-600" />
            Central de Notificações
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie os avisos, alertas operacionais e atualizações do sistema.</p>
        </div>

        <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-2 border-r border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
          </div>
          <div className="px-4 py-2 text-center bg-blue-50 dark:bg-blue-900/20">
            <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-semibold">Não Lidas</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{unreadCount}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-t-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="text-gray-500 hover:text-blue-600 flex items-center gap-2"
          >
            {selectedIds.length === notifications.length && notifications.length > 0 ? (
              <CheckSquare size={20} className="text-blue-600" />
            ) : (
              <Square size={20} />
            )}
            <span className="text-sm font-medium">Selecionar Todos</span>
          </button>
          
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 ml-4 animate-fadeIn border-l border-gray-200 dark:border-gray-700 pl-4">
              <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                {selectedIds.length} selecionados
              </span>
              <button
                onClick={() => handleMarkAsRead(selectedIds)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                title="Marcar como lidas"
              >
                <MailOpen size={18} />
              </button>
              <button
                onClick={() => setConfirmDelete({ isOpen: true, ids: selectedIds })}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                title="Excluir selecionadas"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer relative">
            <input 
              type="checkbox" 
              checked={unreadOnly} 
              onChange={(e) => {
                setUnreadOnly(e.target.checked);
                setPage(1);
                setSelectedIds([]);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Somente não lidas</span>
          </label>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-xl overflow-y-auto flex flex-col relative">
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-500">
            <Bell size={48} className="text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">Nenhuma notificação encontrada.</p>
            <p className="text-sm">Você está com tudo em dia por aqui!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {notifications.map(notification => (
              <div 
                key={notification.id}
                onClick={() => openDrawer(notification)}
                className={`flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  !notification.is_read ? 'bg-blue-50/30' : ''
                }`}
              >
                <div className="pt-1" onClick={(e) => handleSelect(notification.id, e)}>
                  {selectedIds.includes(notification.id) ? (
                    <CheckSquare size={20} className="text-blue-600" />
                  ) : (
                    <Square size={20} className="text-gray-400" />
                  )}
                </div>
                
                <div className="pt-1 shrink-0">
                  {getNotificationIcon(notification.type, 24)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-base truncate ${notification.is_read ? 'font-medium text-gray-800' : 'font-bold text-gray-900'}`}>{notification.title}</h3>
                    <div className="flex items-center gap-3 shrink-0 text-xs text-gray-500">
                      {notification.priority === 'critical' && <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold uppercase">Crítica</span>}
                      <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}</span>
                    </div>
                  </div>
                  <p className={`mt-1 text-sm text-gray-600 line-clamp-1 ${!notification.is_read ? 'font-medium' : ''}`}>
                    {notification.message}
                  </p>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100">
                   {!notification.is_read && (
                     <button onClick={(e) => handleMarkAsRead([notification.id], e)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Marcar como lida">
                       <MailOpen size={16} />
                     </button>
                   )}
                   <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ isOpen: true, ids: [notification.id] }); }} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir">
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination control */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando <span className="font-medium">{(page - 1) * limit + 1}</span> a <span className="font-medium">{Math.min(page * limit, totalCount)}</span> de <span className="font-medium">{totalCount}</span> resultados
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Slide-over Drawer for Details */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closeDrawer} />
          
          <div className="fixed inset-y-0 right-0 max-w-md w-full flex">
            <div className="w-full h-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col animate-slideLeft">
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  Detalhes do Aviso
                </h2>
                <button onClick={closeDrawer} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 p-3 bg-gray-50 dark:bg-gray-700 rounded-full">
                    {getNotificationIcon(selectedNotification.type, 32)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedNotification.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{format(new Date(selectedNotification.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                    {selectedNotification.priority === 'critical' && (
                      <span className="inline-block mt-2 bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Prioridade Crítica</span>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                  <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
                    {selectedNotification.message}
                  </p>
                </div>
                
                {selectedNotification.link && (
                   <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-300 uppercase tracking-wider mb-4">Ação Exigida</h4>
                      <button 
                        onClick={() => handleNavigateAction(selectedNotification.link!)}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <Eye size={18} />
                        Resolver Pendência Agora
                      </button>
                   </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                 <button 
                   onClick={() => { setConfirmDelete({ isOpen: true, ids: [selectedNotification.id] }); closeDrawer(); }} 
                   className="flex items-center gap-2 px-4 py-2 border border-red-200 bg-white text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                 >
                   <Trash2 size={16} /> Excluir Aviso
                 </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Global Alerts */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Excluir Notificações"
        message={
          confirmDelete.ids.length === 1 
            ? "Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita."
            : `Tem certeza que deseja excluir as ${confirmDelete.ids.length} notificações selecionadas? Esta ação não pode ser desfeita.`
        }
        confirmText="Excluir"
        type="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, ids: [] })}
      />
    </div>
  );
};
