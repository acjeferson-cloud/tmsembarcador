import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Search, AlertCircle, CheckCircle, Edit2, Check } from 'lucide-react';
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
    } catch (error) {
      showToast('error', 'Erro ao carregar cidades');
      console.error('Erro ao carregar cidades:', error);
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
    } catch (error) {
      showToast('error', 'Erro ao buscar cidades disponíveis');
      console.error('Erro ao buscar cidades:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddCity = async (cityId: string) => {
    try {
      setIsSaving(true);
      await freightRateCitiesService.addCityToRate(rate.id, tableId, cityId);
      showToast('success', 'Cidade vinculada com sucesso');
      await loadData();
      onUpdate();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Erro ao vincular cidade');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMultipleCities = async () => {
    if (selectedCities.size === 0) {
      showToast('error', 'Selecione pelo menos uma cidade');
      return;
    }

    try {
      setIsSaving(true);
      const cityIds = Array.from(selectedCities);
      const result = await freightRateCitiesService.addMultipleCitiesToRate(
        rate.id,
        tableId,
        cityIds
      );

      if (result.success.length > 0) {
        showToast('success', `${result.success.length} cidade(s) vinculada(s) com sucesso`);
      }

      if (result.errors.length > 0) {
        console.error('Erros ao vincular cidades:', result.errors);
        const firstError = result.errors[0];
        showToast('error', `${result.errors.length} cidade(s) não puderam ser vinculadas: ${firstError.error}`);
      }

      setSelectedCities(new Set());
      if (result.success.length > 0) {
        setShowAddMode(false);
      }

      try {
        await loadData();
        onUpdate();
      } catch (loadError) {
        console.error('Erro ao recarregar dados:', loadError);
      }
    } catch (error) {
      console.error('Erro ao vincular cidades:', error);
      showToast('error', 'Erro ao vincular cidades');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveCity = async (id: string) => {
    if (!confirm('Deseja realmente desvincular esta cidade da tarifa?')) return;

    try {
      setIsSaving(true);
      await freightRateCitiesService.removeCityFromRate(id);
      showToast('success', 'Cidade desvinculada com sucesso');
      await loadData();
      onUpdate();
    } catch (error) {
      showToast('error', 'Erro ao desvincular cidade');
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
      showToast('success', 'Prazo de entrega atualizado com sucesso');
      await loadData();
      setEditingCityId(null);
      setEditingDeliveryDays(null);
      onUpdate();
    } catch (error) {
      showToast('error', 'Erro ao atualizar prazo de entrega');
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cidades da Tarifa</h2>
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
                  Adicionar Cidades ({selectedCities.size} selecionadas)
                </h3>
                <button
                  onClick={() => {
                    setShowAddMode(false);
                    setSelectedCities(new Set());
                    setSearchTerm('');
                  }}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar cidade..."
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Cidade</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">UF</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Código IBGE</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                      {filteredAvailableCities.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            {searchTerm.trim() === ''
                              ? 'Digite o nome da cidade ou UF para buscar...'
                              : 'Nenhuma cidade disponível com este filtro'}
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

              <div className="flex justify-end">
                <button
                  onClick={handleAddMultipleCities}
                  disabled={selectedCities.size === 0 || isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Vinculando...' : `Vincular ${selectedCities.size} cidade(s)`}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cidades Vinculadas ({linkedCities.length})
                </h3>
                <button
                  onClick={() => setShowAddMode(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Upload size={18} />
                  <span>Adicionar Cidades</span>
                </button>
              </div>

              {linkedCities.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar cidade vinculada..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Cidade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">UF</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Código IBGE</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Prazo de Entrega (dias)</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                    {filteredLinkedCities.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                          {linkedCities.length === 0
                            ? 'Nenhuma cidade vinculada. Clique em "Adicionar Cidades" para começar.'
                            : 'Nenhuma cidade encontrada com este filtro.'
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
                                  title="Salvar"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200"
                                  title="Cancelar"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {city.delivery_days !== null && city.delivery_days !== undefined
                                    ? `${city.delivery_days} dias`
                                    : 'Padrão da tarifa'}
                                </span>
                                <button
                                  onClick={() => handleEditDeliveryDays(city)}
                                  disabled={isSaving}
                                  className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                                  title="Editar prazo"
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
                              title="Desvincular cidade"
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
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
