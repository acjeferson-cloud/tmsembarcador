import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Calendar, Truck, MapPin, User, FileText, Package } from 'lucide-react';
import { carriersService, Carrier } from '../../services/carriersService';

interface PickupsFiltersProps {
  onFilterChange: (filters: any) => void;
  filters: {
    transportador: string;
    numeroColeta: string;
    dataCriacao: { start: string; end: string };
    status: string[];
    usuarioResponsavel: string;
    enderecoColeta: string;
  };
}

export const PickupsFilters: React.FC<PickupsFiltersProps> = ({ onFilterChange, filters }) => {
  const { t } = useTranslation();

  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [carriers, setCarriers] = useState<Carrier[]>([]);

  useEffect(() => {
    loadCarriers();
  }, []);

  const loadCarriers = async () => {
    try {
      const data = await carriersService.getAll();
      const sortedCarriers = [...data].sort((a, b) => {
        const codeA = a.codigo || '';
        const codeB = b.codigo || '';
        return codeA.localeCompare(codeB);
      });
      setCarriers(sortedCarriers);
    } catch (error) {
      console.error('Error loading carriers:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      dataCriacao: {
        ...prev.dataCriacao,
        [field]: value
      }
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    setLocalFilters(prev => {
      const newStatus = checked
        ? [...prev.status, value]
        : prev.status.filter(status => status !== value);

      return {
        ...prev,
        status: newStatus
      };
    });
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      transportador: '',
      numeroColeta: '',
      dataCriacao: { start: '', end: '' },
      status: [] as string[],
      usuarioResponsavel: '',
      enderecoColeta: ''
    };

    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  // Quick search by número de coleta
  const handleQuickSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      numeroColeta: value
    }));
  };

  // Apply quick search on Enter
  const handleQuickSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onFilterChange(localFilters);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Quick Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="numeroColeta"
              value={localFilters.numeroColeta}
              onChange={handleQuickSearch}
              onKeyPress={handleQuickSearchKeyPress}
              placeholder={t('pickups.filters.searchPlaceholder')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <Filter size={20} />
            <span>{isExpanded ? t('pickups.filters.hideFilters') : t('pickups.filters.showFilters')}</span>
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {/* First Row of Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Transportador Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <Truck size={16} />
                <span>{t('pickups.filters.carrier')}</span>
              </label>
              <select
                name="transportador"
                value={localFilters.transportador}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">{t('pickups.filters.carrierPlaceholder')}</option>
                {carriers.map(carrier => (
                  <option key={carrier.id} value={carrier.id}>
                    {carrier.codigo} - {carrier.razao_social}
                  </option>
                ))}
              </select>
            </div>

            {/* Usuário Responsável Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <User size={16} />
                <span>{t('pickups.filters.responsibleUser')}</span>
              </label>
              <input
                type="text"
                name="usuarioResponsavel"
                value={localFilters.usuarioResponsavel}
                onChange={handleInputChange}
                placeholder={t('pickups.filters.userPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Endereço de Coleta Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <MapPin size={16} />
                <span>{t('pickups.filters.pickupAddress')}</span>
              </label>
              <input
                type="text"
                name="enderecoColeta"
                value={localFilters.enderecoColeta}
                onChange={handleInputChange}
                placeholder={t('pickups.filters.addressPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Second Row - Date Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-1">
              <Calendar size={16} />
              <span>{t('pickups.filters.creationPeriod')}</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                value={localFilters.dataCriacao.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder={t('pickups.filters.startDate')}
              />
              <input
                type="date"
                value={localFilters.dataCriacao.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder={t('pickups.filters.endDate')}
              />
            </div>
          </div>

          {/* Status Checkboxes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-1">
              <Package size={16} />
              <span>{t('pickups.filters.pickupStatus')}</span>
            </label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-emitida"
                  value="emitida"
                  checked={localFilters.status.includes('emitida')}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="status-emitida" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('pickups.status.emitida')}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-solicitada"
                  value="solicitada"
                  checked={localFilters.status.includes('solicitada')}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="status-solicitada" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('pickups.status.solicitada')}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-realizada"
                  value="realizada"
                  checked={localFilters.status.includes('realizada')}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="status-realizada" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('pickups.status.realizada')}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-cancelada"
                  value="cancelada"
                  checked={localFilters.status.includes('cancelada')}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="status-cancelada" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('pickups.status.cancelada')}
                </label>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('pickups.filters.clearBtn')}
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('pickups.filters.applyBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
