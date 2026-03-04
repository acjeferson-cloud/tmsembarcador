import React, { useState, useEffect, useRef } from 'react';
import { getMenuItemsByCategory } from '../../data/menuConfig';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

interface FioriMenuProps {
  onPageChange: (page: string) => void;
}

const MASTER_ADMIN_EMAIL = 'admin@logaxis.com.br';

export const FioriMenu: React.FC<FioriMenuProps> = ({ onPageChange }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isMasterAdmin = user?.email === MASTER_ADMIN_EMAIL;
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const menuByCategory = getMenuItemsByCategory();

  // Flatten all menu items into a single array
  const allMenuItems = Object.entries(menuByCategory).flatMap(([category, items]) =>
    items.filter(item => {
      if (item.id === 'saas-admin' && !isMasterAdmin) {
        return false;
      }
      return true;
    })
  );

  // Filter menu items based on search term
  const filteredMenuItems = allMenuItems.filter(item => {
    if (!searchTerm) return true;
    const translatedLabel = t(item.labelKey).toLowerCase();
    return translatedLabel.includes(searchTerm.toLowerCase());
  });

  // Auto-focus on search input
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen overflow-y-auto">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Log Axis - TMS Embarcador</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Um único sistema.<br />Todos os seus embarques!
        </p>
      </div>

      <div className="mb-6 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('common.searchMenus')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {filteredMenuItems.map(tile => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.id}
              onClick={() => onPageChange(tile.id)}
              className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-center"
            >
              <div className={`w-12 h-12 ${tile.color} rounded-full flex items-center justify-center mb-2 text-white`}>
                <Icon size={24} />
              </div>
              <span className="text-xs font-medium text-gray-900 dark:text-white">{t(tile.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {filteredMenuItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Nenhum menu encontrado</p>
        </div>
      )}
    </div>
  );
};