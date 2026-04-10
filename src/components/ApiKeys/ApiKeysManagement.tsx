import React, { useEffect, useState } from 'react';
import { Key, Plus, RefreshCw, Search, TrendingUp, AlertTriangle } from 'lucide-react';
import { ApiKeyConfig, apiKeysService, ApiKeyUsageStats } from '../../services/apiKeysService';
import { ApiKeyCard } from './ApiKeyCard';
import { ApiKeyRotationModal } from './ApiKeyRotationModal';
import { ApiKeyHistoryModal } from './ApiKeyHistoryModal';
import { ApiKeyFormModal } from './ApiKeyFormModal';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Toast, ToastType } from '../common/Toast';

export const ApiKeysManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const breadcrumbItems = [
    { label: t('common.settings', { defaultValue: 'Configurações' }) },
    { label: t('apiKeys.title'), current: true }
  ];
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>([]);
  const [filteredKeys, setFilteredKeys] = useState<ApiKeyConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState<ApiKeyUsageStats | null>(null);
  const [selectedKey, setSelectedKey] = useState<ApiKeyConfig | null>(null);
  const [showRotationModal, setShowRotationModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<ApiKeyConfig | null>(null);
  const [alerts, setAlerts] = useState<Array<any>>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    loadApiKeys();
    loadStats();
    loadAlerts();
  }, []);

  useEffect(() => {
    filterApiKeys();
  }, [apiKeys, searchTerm, filterType, filterStatus]);

  const loadApiKeys = async () => {
    setIsLoading(true);
    try {
      const data = await apiKeysService.getAllKeys(user?.establishment_id ? String(user.establishment_id) : '');
      setApiKeys(data);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await apiKeysService.getUsageStats(user?.establishment_id ? String(user.establishment_id) : '');
      setStats(statsData);
    } catch (error) {
    }
  };

  const loadAlerts = async () => {
    try {
      const alertsData = await apiKeysService.checkAlerts(user?.establishment_id ? String(user.establishment_id) : '');
      setAlerts(alertsData);
    } catch (error) {
    }
  };

  const filterApiKeys = () => {
    let filtered = [...apiKeys];

    if (searchTerm) {
      filtered = filtered.filter(key =>
        key.key_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        key.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        key.key_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(key => key.key_type === filterType);
    }

    if (filterStatus === 'active') {
      filtered = filtered.filter(key => key.is_active);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(key => !key.is_active);
    }

    setFilteredKeys(filtered);
  };

  const handleRotate = (key: ApiKeyConfig) => {
    setSelectedKey(key);
    setShowRotationModal(true);
  };

  const handleViewHistory = (key: ApiKeyConfig) => {
    setSelectedKey(key);
    setShowHistoryModal(true);
  };

  const confirmDelete = (key: ApiKeyConfig) => {
    setKeyToDelete(key);
  };

  const executeDelete = async () => {
    if (!keyToDelete) return;

    try {
      await apiKeysService.deleteKey(keyToDelete.id);
      await loadApiKeys();
      await loadStats();
      setToast({
        message: t('apiKeys.messages.deleteSuccess'),
        type: 'success'
      });
    } catch (error) {
      setToast({
        message: t('apiKeys.messages.deleteError'),
        type: 'error'
      });
    } finally {
      setKeyToDelete(null);
    }
  };

  const handleRefresh = async () => {
    await loadApiKeys();
    await loadStats();
    await loadAlerts();
  };

  const uniqueKeyTypes = Array.from(new Set(apiKeys.map(key => key.key_type)));

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('apiKeys.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('apiKeys.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RefreshCw size={20} />
            <span>{t('apiKeys.actions.refresh')}</span>
          </button>
          <button
            onClick={() => setShowFormModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>{t('apiKeys.actions.newKey')}</span>
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('apiKeys.stats.total')}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.total_keys}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Key size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('apiKeys.stats.active')}</p>
                <p className="text-2xl font-semibold text-green-600 mt-1">{stats.active_keys}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('apiKeys.stats.inactive')}</p>
                <p className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mt-1">{stats.inactive_keys}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Key size={24} className="text-gray-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('apiKeys.stats.expiring')}</p>
                <p className="text-2xl font-semibold text-yellow-600 mt-1">{stats.expiring_soon}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('apiKeys.stats.overLimit')}</p>
                <p className="text-2xl font-semibold text-red-600 mt-1">{stats.over_usage_limit}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                {t('apiKeys.alerts.activeAlerts', { count: alerts.length })}
              </h3>
              <ul className="space-y-1">
                {alerts.slice(0, 3).map((alert, index) => (
                  <li key={index} className="text-sm text-yellow-700">
                    {alert.message}
                  </li>
                ))}
                {alerts.length > 3 && (
                  <li className="text-sm text-yellow-600 font-medium">
                    {t('apiKeys.alerts.moreAlerts', { count: alerts.length - 3 })}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('apiKeys.filters.search')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t('apiKeys.filters.allTypes')}</option>
              {uniqueKeyTypes.map(type => (
                <option key={type} value={type}>
                  {apiKeysService.getKeyTypeLabel(type)}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t('apiKeys.filters.allStatus')}</option>
              <option value="active">{t('apiKeys.filters.statusActive')}</option>
              <option value="inactive">{t('apiKeys.filters.statusInactive')}</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredKeys.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? t('apiKeys.empty.filtered')
              : t('apiKeys.empty.noKeys')
            }
          </p>
          {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
            <button
              onClick={() => setShowFormModal(true)}
              className="mt-4 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('apiKeys.actions.firstKey')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredKeys.map(key => (
            <ApiKeyCard
              key={key.id}
              apiKey={key}
              onRotate={handleRotate}
              onDelete={confirmDelete}
              onViewHistory={handleViewHistory}
            />
          ))}
        </div>
      )}

      {showRotationModal && selectedKey && (
        <ApiKeyRotationModal
          apiKey={selectedKey}
          currentUserId={user?.id ? String(user.id) : null}
          onClose={() => {
            setShowRotationModal(false);
            setSelectedKey(null);
          }}
          onSuccess={() => {
            handleRefresh();
          }}
        />
      )}

      {showHistoryModal && selectedKey && (
        <ApiKeyHistoryModal
          apiKey={selectedKey}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedKey(null);
          }}
        />
      )}

      {showFormModal && (
        <ApiKeyFormModal
          estabelecimentoId={user?.establishment_id ? String(user.establishment_id) : null}
          currentUserId={user?.id ? String(user.id) : null}
          onClose={() => setShowFormModal(false)}
          onSuccess={() => {
            handleRefresh();
            setShowFormModal(false);
          }}
        />
      )}

      {keyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center space-x-3 mb-4 text-red-600">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-semibold">Excluir Chave</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              {t('apiKeys.messages.deleteConfirm', { name: keyToDelete.key_name })}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setKeyToDelete(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                {t('common.cancel', 'Cancelar')}
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                {t('common.delete', 'Excluir')}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
