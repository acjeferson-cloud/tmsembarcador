import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, User, LogOut, Clock, Info, ChevronDown, Building, Sun, Moon, HelpCircle, Sparkles } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { useAuth } from '../../hooks/useAuth';
import { RecentActivitiesModal } from './RecentActivitiesModal';
import { NotificationsDropdown } from './NotificationsDropdown';
import { EstablishmentSelectionModal } from '../Auth/EstablishmentSelectionModal';
import { AppearanceModal } from './AppearanceModal';
import HelpModal from './HelpModal';
import { InnovationsModal } from './InnovationsModal';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { AppNotification, notificationService } from '../../services/notificationService';
import { supabase } from '../../lib/supabase';

interface HeaderProps {
  onMenuToggle: () => void;
  menuType: 'sidebar' | 'fiori';
  onToggleMenuType: () => void;
  onNavigate: (section: string, id?: string) => void;
}

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const currentDate = new Date();
  const releaseDate = new Date('2025-01-15T10:30:00');
  const updateDate = new Date('2025-01-15T14:45:00');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('header.aboutSystem')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">TMS Embarcador Log Axis</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Um único sistema.<br />Todos os seus embarques!
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">{t('header.currentVersion')}</span>
              <span className="font-semibold text-gray-900 dark:text-white">V1.03</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">{t('header.releaseDate')}</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {releaseDate.toLocaleDateString('pt-BR')} às {releaseDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">{t('header.lastUpdate')}</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {updateDate.toLocaleDateString('pt-BR')} às {updateDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>{t('header.versionHighlights')}</strong><br />
              • Torre de Controle aprimorada<br />
              • Novo sistema de cotação de fretes<br />
              • Interface redesenhada<br />
              • Melhorias de performance
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {t('header.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, menuType, onToggleMenuType, onNavigate }) => {
  const { t } = useTranslation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isEstablishmentModalOpen, setIsEstablishmentModalOpen] = useState(false);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showInnovationsModal, setShowInnovationsModal] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { user, logout, availableEstablishments, currentEstablishment } = useAuth();
  const { theme } = useTheme();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Recent activities - simulated based on common menu access
  const recentActivities = [
    { label: 'Página Inicial', time: '2 min atrás' },
    { label: 'Torre de Controle', time: '15 min atrás' },
    { label: 'Cotação de Fretes', time: '1 hora atrás' },
    { label: 'Rastreamento de Entregas', time: '2 horas atrás' },
    { label: 'Transportadores', time: '1 dia atrás' }
  ];

  // Fetch real notifications
  useEffect(() => {
    if (user && currentEstablishment) {
      notificationService.getNotifications().then(data => {
        setNotifications(data);
      });

      if (!supabase) return;

      // Se inscrever para realtime futuramente
      const channel = supabase
        .channel('public:notifications')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications' 
        }, payload => {
          setNotifications(prev => [payload.new as AppNotification, ...prev]);
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, currentEstablishment]);

  const unreadNotificationCount = notifications.filter(n => !n.is_read).length;

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  const handleAbout = () => {
    setIsAboutModalOpen(true);
    setIsUserMenuOpen(false);
  };

  const handleActivities = () => {
    setIsActivitiesModalOpen(true);
    setIsUserMenuOpen(false);
  };

  const handleChangeEstablishment = () => {
    setIsEstablishmentModalOpen(true);
    setIsUserMenuOpen(false);
  };

  const handleAppearance = () => {
    setIsAppearanceModalOpen(true);
    setIsUserMenuOpen(false);
  };

  const handleHelp = () => {
    setIsUserMenuOpen(false);
    setShowHelpModal(true);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const handleSearchNavigate = (type: string, id: string) => {
    // Mapear tipos de busca para seções do app
    const sectionMap = {
      order: 'orders',
      invoice: 'invoices', 
      cte: 'ctes',
      bill: 'bills',
      pickup: 'pickups'
    };
    
    const section = sectionMap[type as keyof typeof sectionMap] || type;
    onNavigate(section, id);
  };

  // Check if user has multiple establishments
  const hasMultipleEstablishments = availableEstablishments.length > 1;

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {menuType === 'sidebar' && (
              <button
                onClick={onMenuToggle}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Menu size={20} className="text-gray-700 dark:text-gray-300" />
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-6">
            <GlobalSearch onNavigate={handleSearchNavigate} />
            
            {/* Notifications Button */}
            <div className="relative" ref={notificationsRef}>
              <button 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                onClick={toggleNotifications}
              >
                <Bell size={20} className="text-gray-700 dark:text-gray-300" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <NotificationsDropdown 
                  notifications={notifications}
                  onMarkAllAsRead={() => {
                    setNotifications(prev => prev.map(n => ({...n, is_read: true})));
                  }}
                  onMarkAsRead={(id) => {
                    setNotifications(prev => prev.map(n => n.id === id ? {...n, is_read: true} : n));
                  }}
                  onClear={() => setNotifications([])}
                />
              )}
            </div>
            
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {user?.foto_perfil_url ? (
                  <img
                    src={user.foto_perfil_url}
                    alt={user.name || 'Usuário'}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'JC'}
                    </span>
                  </div>
                )}
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name || 'Jeferson Carthen'}</span>
                  {currentEstablishment && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {currentEstablishment.codigo} - {currentEstablishment.fantasia || currentEstablishment.razaoSocial}
                    </span>
                  )}
                </div>
                <ChevronDown size={16} className={`transition-transform text-gray-700 dark:text-gray-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  {/* User Info */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      {user?.foto_perfil_url ? (
                        <img
                          src={user.foto_perfil_url}
                          alt={user.name || 'Usuário'}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-lg font-semibold text-white">
                            {user?.name?.split(' ').map(n => n[0]).join('') || 'JC'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{user?.name || 'Usuário'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email || ''}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 dark:text-gray-400">{t('header.administrator')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Current Establishment */}
                  {currentEstablishment && (
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/30">
                      <div className="flex items-center space-x-2">
                        <Building size={16} className="text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">{t('header.currentEstablishment')}</p>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                            {currentEstablishment.codigo} - {currentEstablishment.fantasia || currentEstablishment.razaoSocial}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Activities Link */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <button
                      onClick={handleActivities}
                      className="w-full flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Clock size={16} />
                        <span>{t('header.recentActivities')}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-500 dark:text-gray-400">{t('header.viewAll')}</span>
                    </button>
                  </div>

                  {/* Menu Actions */}
                  <div className="p-2">
                    {/* Change Establishment - Only show if user has multiple establishments */}
                    {hasMultipleEstablishments && (
                      <button
                        onClick={handleChangeEstablishment}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Building size={16} />
                        <span>{t('header.changeEstablishment')}</span>
                      </button>
                    )}

                    {/* Appearance */}
                    <button
                      onClick={handleAppearance}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
                      <span>{t('header.appearance')}</span>
                    </button>

                    <button
                      onClick={handleHelp}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <HelpCircle size={16} />
                      <span>{t('header.help')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowInnovationsModal(true);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Sparkles size={16} />
                      <span>{t('header.innovationsSuggestions')}</span>
                    </button>

                    <button
                      onClick={handleAbout}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Info size={16} />
                      <span>{t('header.about')}</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <LogOut size={16} />
                      <span>{t('header.logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* About Modal */}
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />

      {/* Recent Activities Modal */}
      <RecentActivitiesModal 
        isOpen={isActivitiesModalOpen} 
        onClose={() => setIsActivitiesModalOpen(false)} 
      />

      {/* Establishment Selection Modal */}
      <EstablishmentSelectionModal
        isOpen={isEstablishmentModalOpen}
        onClose={() => setIsEstablishmentModalOpen(false)}
        establishments={availableEstablishments.filter(e => !currentEstablishment || e.id !== currentEstablishment.id)}
        onSelect={(establishmentId) => {
          setIsEstablishmentModalOpen(false);
          // The actual establishment change is handled in the useAuth hook
        }}
        isChangingEstablishment={true}
      />

      {/* Appearance Modal */}
      <AppearanceModal
        isOpen={isAppearanceModalOpen}
        onClose={() => setIsAppearanceModalOpen(false)}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* Innovations Modal */}
      <InnovationsModal
        isOpen={showInnovationsModal}
        onClose={() => setShowInnovationsModal(false)}
      />
    </>
  );
};