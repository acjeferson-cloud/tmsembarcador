import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Search, AlertCircle, CheckCircle, Edit2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { freightRateCitiesService, FreightRateCity, CityAvailability } from '../../services/freightRateCitiesService';
import { FreightRate } from '../../services/freightRatesService';

interface FreightRateCitiesModalProps {
  rate: FreightRate;
  tableId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const FreightRateCitiesModal: React.FC<FreightRateCitiesModalProps> = ({
  rate,
  tableId,
  onClose,
  onUpdate
}) => {
  const { t } = useTranslation();
  const [linkedCities, setLinkedCities] = useState<FreightRateCity[]>([]);
  const [availableCities, setAvailableCities] = useState<CityAvailability[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddMode, setShowAddMode] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingDeliveryDays, setEditingDeliveryDays] = useState<number | null>(null);
  const [bulkDeliveryDays, setBulkDeliveryDays] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [rate.id, tableId]);

  // Debounce para busca de cidades disponíveis
  useEffect(() => {
    if (showAddMode) {
      const timer = setTimeout(() => {
        loadAvailableCities(searchTerm);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, showAddMode]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const cities = await freightRateCitiesService.getCitiesByRate(rate.id);
      setLinkedCities(cities);
      if (showAddMode) {
        await loadAvailableCities(searchTerm);
      }
    } catch (_error) {
      showToast('error', t('carriers.freightRates.cities.errorLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableCities = async (search: string) => {
    try {
      setIsSearching(true);
      const available = await freightRateCitiesService.getAvailableCitiesForRate(
        tableId,
        rate.id,
        search
      );
      setAvailableCities(available);
    } catch (_error) {
      showToast('error', t('carriers.freightRates.cities.errorLoad'));
    } finally {
      setIsSearching(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const _handleAddCity = async (cityId: string) => {
    try {
      setIsSaving(true);
      await freightRateCitiesService.addCityToRate(rate.id, tableId, cityId);
      showToast('success', t('carriers.freightRates.cities.successLinkSingle'));
      await loadData();
      onUpdate();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : t('carriers.freightRates.cities.errorLink'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMultipleCities = async () => {
    if (selectedCities.size === 0) {
      showToast('error', t('carriers.freightRates.cities.selectAtLeastOne'));
      return;
    }

    try {
      setIsSaving(true);
      const cityIds = Array.from(selectedCities);
      const result = await freightRateCitiesService.addMultipleCitiesToRate(
        rate.id,
        tableId,
        cityIds,
        bulkDeliveryDays
      );

      if (result.success.length > 0) {
        showToast('success', t('carriers.freightRates.cities.successLinkMultiple', { count: result.success.length }));
      }

      if (result.errors.length > 0) {
        const firstError = result.errors[0];
        showToast('error', t('carriers.freightRates.cities.errorLinkMultiple', { count: result.errors.length, error: firstError.error }));
      }

      setSelectedCities(new Set());
      if (result.success.length > 0) {
        setShowAddMode(false);
        setBulkDeliveryDays(null);
      }

      try {
        await loadData();
        onUpdate();
      } catch (_loadError) {
        // ignore
      }
    } catch (_error) {
      showToast('error', t('carriers.freightRates.cities.errorLink'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveCity = async (id: string) => {
    if (!confirm(t('carriers.freightRates.cities.confirmUnlinkMessage'))) return;

    try {
      setIsSaving(true);
      await freightRateCitiesService.removeCityFromRate(id);
      showToast('success', t('carriers.freightRates.cities.successUnlink'));
      await loadData();
      onUpdate();
    } catch (_error) {
      showToast('error', t('carriers.freightRates.cities.errorUnlink'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditDeliveryDays = (city: FreightRateCity) => {
    setEditingCityId(city.id);
    setEditingDeliveryDays(city.delivery_days ?? null);
  };

  const handleSaveDeliveryDays = async (cityId: string) => {
    try {
      setIsSaving(true);
      await freightRateCitiesService.updateDeliveryDays(cityId, editingDeliveryDays);
      showToast('success', t('carriers.freightRates.cities.successUpdateDays'));
      await loadData();
      setEditingCityId(null);
      setEditingDeliveryDays(null);
      onUpdate();
    } catch (_error) {
      showToast('error', t('carriers.freightRates.cities.errorUpdateDays'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCityId(null);
    setEditingDeliveryDays(null);
  };

  const toggleCitySelection = (cityId: string) => {
    const newSelection = new Set(selectedCities);
    if (newSelection.has(cityId)) {
      newSelection.delete(cityId);
    } else {
      newSelection.add(cityId);
    }
    setSelectedCities(newSelection);
  };

  // Função para normalizar texto removendo acentos (usado apenas para cidades vinculadas)
  const normalizeText = (text: string): string => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  // Cidades disponíveis já vem filtradas do servidor
  const filteredAvailableCities = availableCities.filter(city => city.is_available);

  // Filtro local apenas para cidades vinculadas (menor volume)
  const filteredLinkedCities = linkedCities.filter(city => {
    if (!searchTerm.trim()) return true;
    const searchNormalized = normalizeText(searchTerm);
    return (
      (city.city_name && normalizeText(city.city_name).includes(searchNormalized)) ||
      (city.city_state && normalizeText(city.city_state).includes(searchNormalized)) ||
      (city.city_ibge_code && city.city_ibge_code.includes(searchTerm))
    );
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('carriers.freightRates.cities.title')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {rate.codigo} - {rate.descricao}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {toast && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center space-x-2 ${
            toast.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm">{toast.message}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : showAddMode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('carriers.freightRates.cities.uploadCities')} ({selectedCities.size})
                </h3>
                <button
                  onClick={() => {
                    setShowAddMode(false);
                    setSelectedCities(new Set());
                    setSearchTerm('');
                    setBulkDeliveryDays(null);
                  }}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white"
                >
                  {t('carriers.freightRates.cities.cancel')}
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('carriers.freightRates.cities.searchCity')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                      <tr>
                        <th className="w-12 px-4 py-3">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCities(new Set(filteredAvailableCities.map(c => c.city_id)));
                              } else {
                                setSelectedCities(new Set());
                              }
                            }}
                            checked={selectedCities.size === filteredAvailableCities.length && filteredAvailableCities.length > 0}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.cities.city')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.cities.uf')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.cities.ibgeCode')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                      {filteredAvailableCities.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            {searchTerm.trim() === ''
                              ? t('carriers.freightRates.cities.searchPrompt')
                              : t('carriers.freightRates.cities.noCityAvailable')}
                          </td>
                        </tr>
                      ) : (
                        filteredAvailableCities.map((city) => (
                        <tr
                          key={city.city_id}
                          className="hover:bg-gray-50 dark:bg-gray-900 cursor-pointer"
                          onClick={() => toggleCitySelection(city.city_id)}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedCities.has(city.city_id)}
                              onChange={() => toggleCitySelection(city.city_id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{city.city_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{city.city_state}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{city.city_ibge_code || '-'}</td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex justify-between items-center mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <label htmlFor="bulkDeliveryDays" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prazo de Entrega (opcional):
                  </label>
                  <div className="relative">
                    <input
                      id="bulkDeliveryDays"
                      type="number"
                      min="0"
                      step="1"
                      value={bulkDeliveryDays ?? ''}
                      onChange={(e) => setBulkDeliveryDays(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Padrão"
                      className="w-28 pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      dias
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleAddMultipleCities}
                  disabled={selectedCities.size === 0 || isSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                >
                  {isSaving ? t('carriers.freightRates.cities.linking') : t('carriers.freightRates.cities.linkSelected', { count: selectedCities.size })}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('carriers.freightRates.cities.linkedCities')} ({linkedCities.length})
                </h3>
                <button
                  onClick={() => setShowAddMode(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Upload size={18} />
                  <span>{t('carriers.freightRates.cities.uploadCities')}</span>
                </button>
              </div>

              {linkedCities.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('carriers.freightRates.cities.searchLinkedCity')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.cities.city')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.cities.uf')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.cities.ibgeCode')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.cities.deliveryDays')}</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.cities.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                    {filteredLinkedCities.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                          {linkedCities.length === 0
                            ? t('carriers.freightRates.cities.noLinkedCitiesClickAdd')
                            : t('carriers.freightRates.cities.noLinkedCitiesFound')
                          }
                        </td>
                      </tr>
                    ) : (
                      filteredLinkedCities.map((city) => (
                        <tr key={city.id} className="hover:bg-gray-50 dark:bg-gray-900">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{city.city_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{city.city_state}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{city.city_ibge_code || '-'}</td>
                          <td className="px-6 py-4">
                            {editingCityId === city.id ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={editingDeliveryDays ?? ''}
                                  onChange={(e) => setEditingDeliveryDays(e.target.value ? parseInt(e.target.value) : null)}
                                  placeholder="Padrão"
                                  className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  autoFocus
                                />
                                  <button
                                    onClick={() => handleSaveDeliveryDays(city.id)}
                                    disabled={isSaving}
                                    className="text-green-600 hover:text-green-800 disabled:text-gray-400"
                                    title={t('carriers.freightRates.cities.saveTitle')}
                                  >
                                    <Check size={18} />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200"
                                    title={t('carriers.freightRates.cities.cancelTitle')}
                                  >
                                    <X size={18} />
                                  </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {city.delivery_days !== null && city.delivery_days !== undefined
                                    ? `${city.delivery_days} dias`
                                    : t('carriers.freightRates.cities.defaultDeliveryDays')}
                                </span>
                                <button
                                  onClick={() => handleEditDeliveryDays(city)}
                                  disabled={isSaving}
                                  className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                                  title={t('carriers.freightRates.cities.editDeliveryDaysTitle')}
                                >
                                  <Edit2 size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleRemoveCity(city.id)}
                              disabled={isSaving}
                              className="text-red-600 hover:text-red-800 disabled:text-gray-400 transition-colors"
                              title={t('carriers.freightRates.cities.unlinkCityTitle')}
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
          >
            {t('carriers.freightRates.cities.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
