import React, { useState, useEffect } from 'react'; 
import { SmartDateInput } from '../../components/common/SmartDateInput';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Calendar, Truck, MapPin, User, FileText, ShoppingCart } from 'lucide-react';
import { brazilianStates } from '../../data/statesData';
import { carriersService, Carrier } from '../../services/carriersService';
import { businessPartnersService, BusinessPartner } from '../../services/businessPartnersService';
import { AutocompleteSelect } from '../common/AutocompleteSelect';
import { useFilterCache } from '../../hooks/useFilterCache';

interface OrdersFiltersProps {
  onFilterChange: (filters: any) => void;
  filters: {
    transportador: string;
    cliente: string;
    periodoEmissao: { start: string; end: string };
    periodoEntrada: { start: string; end: string };
    periodoPrevisao: { start: string; end: string };
    ufDestino: string;
    cidadeDestino: string;
    status: string[];
    numeroPedido: string;
  };
}


export const OrdersFilters: React.FC<OrdersFiltersProps> = ({ onFilterChange, filters }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);

  useFilterCache('orders-filters', localFilters, setLocalFilters);

  useEffect(() => {
    loadCarriers();
    loadBusinessPartners();
  }, []);

  const loadBusinessPartners = async () => {
    try {
      const data = await businessPartnersService.getAll();
      setBusinessPartners(data || []);
    } catch (error) {
      console.error('Error loading business partners:', error);
    }
  };

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
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateRangeChange = (range: 'periodoEmissao' | 'periodoEntrada' | 'periodoPrevisao', field: 'start' | 'end', value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [range]: {
        ...prev[range],
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
      cliente: '',
      periodoEmissao: { start: '', end: '' },
      periodoEntrada: { start: '', end: '' },
      periodoPrevisao: { start: '', end: '' },
      ufDestino: '',
      cidadeDestino: '',
      status: [] as string[],
      numeroPedido: ''
    };
    
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  // Quick search by número do pedido
  const handleQuickSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      numeroPedido: value
    }));
    
    // Apply filter immediately for quick search
    onFilterChange({
      ...localFilters,
      numeroPedido: value
    });
  };

  // Mock data for cities
  const cities = [
    'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 
    'Salvador', 'Recife', 'Fortaleza', 'Brasília', 'Goiânia', 'Manaus', 'Belém'
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Quick Search */}
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t('orders.filters.searchPlaceholder')}
            value={localFilters.numeroPedido}
            onChange={handleQuickSearch}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
        >
          <Filter size={18} />
          <span>{t('orders.filters.advancedFilters')}</span>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {Object.values(localFilters).filter(val => 
              Array.isArray(val) ? val.length > 0 : 
              typeof val === 'object' ? (val.start || val.end) : 
              val !== ''
            ).length}
          </span>
        </button>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Transportador Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <Truck size={16} />
                <span>{t('orders.filters.carrier')}</span>
              </label>
              <select
                name="transportador"
                value={localFilters.transportador}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('orders.filters.carrier')}</option>
                {carriers.map(carrier => (
                  <option key={carrier.id} value={carrier.id}>
                    {carrier.codigo} - {carrier.razao_social}
                  </option>
                ))}
              </select>
            </div>

            {/* Cliente Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <User size={16} />
                <span>{t('orders.filters.customer')}</span>
              </label>
              <AutocompleteSelect
                options={businessPartners.map(partner => ({
                  value: `${partner.document} - ${partner.name}`,
                  label: `${partner.document} - ${partner.name}`
                }))}
                value={localFilters.cliente}
                onChange={(value) => setLocalFilters(prev => ({ ...prev, cliente: value }))}
                placeholder={t('orders.filters.customerPlaceholder')}
              />
            </div>

            {/* Período de Emissão Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <Calendar size={16} />
                <span>{t('orders.filters.issueDate')}</span>
              </label>
              <div className="flex space-x-2">
                <SmartDateInput value={localFilters.periodoEmissao.start} onChange={(val) => handleDateRangeChange('periodoEmissao', 'start', val)} />
                <span className="flex items-center text-gray-500 dark:text-gray-400">{t('orders.filters.to')}</span>
                <SmartDateInput value={localFilters.periodoEmissao.end} onChange={(val) => handleDateRangeChange('periodoEmissao', 'end', val)} />
              </div>
            </div>

            {/* Período de Entrada Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <Calendar size={16} />
                <span>{t('orders.filters.entryDate')}</span>
              </label>
              <div className="flex space-x-2">
                <SmartDateInput value={localFilters.periodoEntrada.start} onChange={(val) => handleDateRangeChange('periodoEntrada', 'start', val)} />
                <span className="flex items-center text-gray-500 dark:text-gray-400">{t('orders.filters.to')}</span>
                <SmartDateInput value={localFilters.periodoEntrada.end} onChange={(val) => handleDateRangeChange('periodoEntrada', 'end', val)} />
              </div>
            </div>

            {/* Período de Previsão de Entrega Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <Calendar size={16} />
                <span>{t('orders.filters.expectedDate')}</span>
              </label>
              <div className="flex space-x-2">
                <SmartDateInput value={localFilters.periodoPrevisao.start} onChange={(val) => handleDateRangeChange('periodoPrevisao', 'start', val)} />
                <span className="flex items-center text-gray-500 dark:text-gray-400">{t('orders.filters.to')}</span>
                <SmartDateInput value={localFilters.periodoPrevisao.end} onChange={(val) => handleDateRangeChange('periodoPrevisao', 'end', val)} />
              </div>
            </div>

            {/* UF Destino Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <MapPin size={16} />
                <span>{t('orders.filters.destinationState')}</span>
              </label>
              <select
                name="ufDestino"
                value={localFilters.ufDestino}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('orders.filters.destinationState')}</option>
                {brazilianStates.map(state => (
                  <option key={state.id} value={state.abbreviation}>
                    {state.abbreviation} - {state.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cidade Destino Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <MapPin size={16} />
                <span>{t('orders.filters.destinationCity')}</span>
              </label>
              <input
                type="text"
                name="cidadeDestino"
                value={localFilters.cidadeDestino}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('orders.filters.destinationCity')}
              />
            </div>
          </div>

          {/* Status Checkboxes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-1">
              <ShoppingCart size={16} />
              <span>{t('orders.filters.orderStatus')}</span>
            </label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-emitido"
                  value="emitido"
                  checked={localFilters.status.includes('emitido')}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="status-emitido" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('orders.status.emitido')}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-coletado"
                  value="coletado"
                  checked={localFilters.status.includes('coletado')}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="status-coletado" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('orders.status.coletado')}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-em_transito"
                  value="em_transito"
                  checked={localFilters.status.includes('em_transito')}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="status-em_transito" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('orders.status.em_transito')}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-saiu_entrega"
                  value="saiu_entrega"
                  checked={localFilters.status.includes('saiu_entrega')}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="status-saiu_entrega" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('orders.status.saiu_entrega')}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-entregue"
                  value="entregue"
                  checked={localFilters.status.includes('entregue')}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="status-entregue" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('orders.status.entregue')}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-cancelado"
                  value="cancelado"
                  checked={localFilters.status.includes('cancelado')}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="status-cancelado" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('orders.status.cancelado')}
                </label>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            >
              {t('orders.actions.clearFilters')}
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('common.filter')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
