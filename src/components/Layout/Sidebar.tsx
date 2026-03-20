import React, { useState, useEffect, useMemo } from 'react';
import { menuConfig } from '../../data/menuConfig';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Sparkles
} from 'lucide-react';
import { useInnovations } from '../../contexts/InnovationsContext';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const MASTER_ADMIN_EMAIL = 'admin@logaxis.com.br';

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  isOpen,
  onToggle
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isMasterAdmin = user?.email === MASTER_ADMIN_EMAIL;
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isInnovationActive } = useInnovations();

  // Filter menu items based on user permissions
  const menuItems = useMemo(() => {
    return menuConfig.filter(item => {
      if (item.id === 'saas-admin' && !isMasterAdmin) {
        return false;
      }
      return true;
    });
  }, [isMasterAdmin]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isSubmenuExpanded = (menuId: string) => expandedMenus.includes(menuId);

  const handlePageChange = (pageId: string) => {
    // If clicking on Fiori menu, collapse sidebar
    if (pageId === 'fiori') {
      onPageChange(pageId);
      if (isOpen) {
        onToggle(); // Close the sidebar
      }
      return;
    }

    // Normal page change
    onPageChange(pageId);
    if (window.innerWidth < 1024) onToggle();
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setExpandedMenus([]); // Collapse all submenus when collapsing sidebar
    }
  };

  const filteredMenuItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return menuItems;
    }

    const searchLower = debouncedSearchTerm.toLowerCase();

    return menuItems.map(item => {
      const matchesItem = t(item.labelKey).toLowerCase().includes(searchLower);

      if (item.hasSubmenu && item.submenu) {
        const filteredSubmenu = item.submenu.filter(subItem =>
          t(subItem.labelKey).toLowerCase().includes(searchLower)
        );

        if (filteredSubmenu.length > 0) {
          return {
            ...item,
            submenu: filteredSubmenu
          };
        }

        if (matchesItem) {
          return item;
        }

        return null;
      }

      return matchesItem ? item : null;
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [debouncedSearchTerm, menuItems]);

  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      const menusToExpand = filteredMenuItems
        .filter(item => item.hasSubmenu)
        .map(item => item.id);
      setExpandedMenus(menusToExpand);
    }
  }, [debouncedSearchTerm, filteredMenuItems]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar - Full height blue background that extends to viewport bottom */}
      <div className={`
        fixed left-0 top-0 bottom-0 bg-slate-900 text-white z-50 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        ${isCollapsed ? 'w-20' : 'w-80'} flex flex-col min-h-screen
      `}>
        <div className="flex flex-col items-center justify-center p-6 border-b border-slate-700 flex-shrink-0 relative">
          {/* Título e Subtítulo */}
          {!isCollapsed ? (
            <div className="text-center w-full pr-12">
              <h1 className="text-base font-bold text-white">TMS Embarcador Log Axis</h1>
              <p className="text-xs text-slate-400 mt-1">Um único sistema. Todos os seus embarques!</p>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-lg font-bold text-white">TMS</h1>
            </div>
          )}

          {/* Botão de fechar (mobile) */}
          <button
            onClick={onToggle}
            className="lg:hidden absolute top-4 right-4 p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Botão de colapsar (desktop only) */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:block absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title={isCollapsed ? t('menu.expandMenu') : t('menu.collapseMenu')}
          >
            {isCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        </div>

        {/* Campo de pesquisa */}
        {!isCollapsed && (
          <div className="px-4 py-3 border-b border-slate-700 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder={t('menu.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto bg-slate-900 pb-4 scrollbar-thin">
          {filteredMenuItems.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <p className="text-sm">{t('menu.noMenusFound')}</p>
              <p className="text-xs mt-1">{t('menu.tryAnotherSearch')}</p>
            </div>
          ) : (
            <ul className="p-2 space-y-1">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const hasSubmenu = item.hasSubmenu;
                const isExpanded = hasSubmenu && isSubmenuExpanded(item.id);
                const isParentDisabled = item.innovationKey ? !isInnovationActive(item.innovationKey) : false;

                return (
                  <li key={item.id}>
                  {hasSubmenu ? (
                    <>
                      <button
                        onClick={() => {
                          if (isParentDisabled) return;
                          !isCollapsed && toggleSubmenu(item.id);
                        }}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg text-left transition-all duration-200 text-slate-300 hover:bg-slate-800 hover:text-white ${isParentDisabled ? 'opacity-50 cursor-not-allowed group relative' : ''}`}
                        title={isCollapsed ? t(item.labelKey) : ''}
                      >
                        <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'} min-w-0 flex-1`}>
                          <Icon size={20} className="flex-shrink-0" />
                          {!isCollapsed && <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">{t(item.labelKey)}</span>}
                          {isParentDisabled && (
                            <Sparkles size={14} className="text-yellow-400 ml-1 flex-shrink-0" />
                          )}
                        </div>
                        {!isCollapsed && (
                          <div className="flex-shrink-0 ml-2">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </div>
                        )}
                        {isParentDisabled && (
                          <div className="hidden group-hover:block absolute left-full ml-2 w-max max-w-xs p-2 bg-gray-800 text-xs text-white rounded shadow-lg z-50 pointer-events-none">
                            Ative esta inovação lá em Painel de Administrador &gt; Inovações
                          </div>
                        )}
                      </button>
                      
                      {!isCollapsed && isExpanded && item.submenu && (
                        <ul className="ml-6 mt-1 space-y-1">
                          {item.submenu.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubItemDisabled = subItem.innovationKey ? !isInnovationActive(subItem.innovationKey) : false;
                            
                            return (
                              <li key={subItem.id}>
                                <button
                                  onClick={() => {
                                    if (isSubItemDisabled) return;
                                    handlePageChange(subItem.id);
                                  }}
                                  className={`
                                    group relative w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200
                                    ${currentPage === subItem.id && !isSubItemDisabled
                                      ? 'bg-blue-600 text-white shadow-lg'
                                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }
                                    ${isSubItemDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                                  `}
                                >
                                  <SubIcon size={16} className="flex-shrink-0" />
                                  <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">{t(subItem.labelKey)}</span>
                                  {isSubItemDisabled && (
                                    <Sparkles size={14} className="text-yellow-400 ml-1 flex-shrink-0" />
                                  )}
                                  {isSubItemDisabled && (
                                    <div className="hidden group-hover:block absolute left-full ml-2 w-max max-w-xs p-2 bg-gray-800 text-xs text-white rounded shadow-lg z-50 pointer-events-none">
                                      Ative esta inovação lá em Painel de Administrador &gt; Inovações
                                    </div>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        if (isParentDisabled) return;
                        handlePageChange(item.id);
                      }}
                      className={`
                        group relative w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg text-left transition-all duration-200
                        ${currentPage === item.id && !isParentDisabled
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }
                        ${isParentDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      title={isCollapsed && !isParentDisabled ? t(item.labelKey) : ''}
                    >
                      <Icon size={20} className="flex-shrink-0" />
                      {!isCollapsed && <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">{t(item.labelKey)}</span>}
                      {isParentDisabled && !isCollapsed && (
                        <Sparkles size={14} className="text-yellow-400 ml-1 flex-shrink-0" />
                      )}
                      {isParentDisabled && (
                        <div className="hidden group-hover:block absolute left-full ml-2 w-max max-w-xs p-2 bg-gray-800 text-xs text-white rounded shadow-lg z-50 pointer-events-none">
                          Ative esta inovação lá em Painel de Administrador &gt; Inovações
                        </div>
                      )}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          )}
        </nav>
      </div>
    </>
  );
};