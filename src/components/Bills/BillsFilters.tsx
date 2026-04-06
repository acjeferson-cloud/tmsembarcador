import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Truck, FileText } from 'lucide-react';
import { carriersService, Carrier } from '../../services/carriersService';
import { useFilterCache } from '../../hooks/useFilterCache';

interface BillsFiltersProps {
  onFilterChange: (filters: any) => void;
  filters: {
    transportador: string;
    periodoEmissao: { start: string; end: string };
    periodoVencimento: { start: string; end: string };
    status: string[];
    numeroFatura: string;
  };
}

export const BillsFilters: React.FC<BillsFiltersProps> = ({ onFilterChange, filters }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [carriers, setCarriers] = useState<Carrier[]>([]);

  useFilterCache('bills-filters', localFilters, setLocalFilters);

  useEffect(() => {
    loadCarriers();
  }, []);

  const loadCarriers = async () => {
    try {
      const data = await carriersService.getAll();
      setCarriers(data);
    } catch (error) {
// null
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateRangeChange = (range: 'periodoEmissao' | 'periodoVencimento', field: 'start' | 'end', value: string) => {
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
      periodoEmissao: { start: '', end: '' },
      periodoVencimento: { start: '', end: '' },
      status: [] as string[],
      numeroFatura: ''
    };
    
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  // Quick search by número da fatura
  const handleQuickSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      numeroFatura: value
    }));
    
    // Apply filter immediately for quick search
    onFilterChange({
      ...localFilters,
      numeroFatura: value
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Quick Search */}
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por número da fatura..."
            value={localFilters.numeroFatura}
            onChange={handleQuickSearch}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
        >
          <Filter size={18} />
          <span>Filtros Avançados</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Transportador Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <Truck size={16} />
                <span>Transportador</span>
              </label>
              <select
                name="transportador"
                value={localFilters.transportador}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os Transportadores</option>
                {carriers.map(carrier => (
                  <option key={carrier.id} value={carrier.id}>
                    {carrier.codigo} {carrier.razao_social}
                  </option>
                ))}
              </select>
            </div>

            {/* Período de Emissão Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <Calendar size={16} />
                <span>Período de Emissão</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={localFilters.periodoEmissao.start}
                  onChange={(e) => handleDateRangeChange('periodoEmissao', 'start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="flex items-center text-gray-500 dark:text-gray-400">a</span>
                <input
                  type="date"
                  value={localFilters.periodoEmissao.end}
                  onChange={(e) => handleDateRangeChange('periodoEmissao', 'end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Período de Vencimento Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <Calendar size={16} />
                <span>Período de Vencimento</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={localFilters.periodoVencimento.start}
                  onChange={(e) => handleDateRangeChange('periodoVencimento', 'start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="flex items-center text-gray-500 dark:text-gray-400">a</span>
                <input
                  type="date"
                  value={localFilters.periodoVencimento.end}
                  onChange={(e) => handleDateRangeChange('periodoVencimento', 'end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Status Checkboxes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-1">
              <FileText size={16} />
              <span>Status da Fatura</span>
            </label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-importado"
                  value="importado"
                  checked={localFilters.status.includes('importado')}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="status-importado" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Importado
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-aprovado"
                  value="auditado_aprovado"
                  checked={localFilters.status.includes('auditado_aprovado')}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="status-aprovado" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Auditada e Aprovada
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-reprovado"
                  value="auditado_reprovado"
                  checked={localFilters.status.includes('auditado_reprovado')}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="status-reprovado" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Auditada e Reprovada
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
                  Cancelado
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-referenciado"
                  value="com_nfe_referenciada"
                  checked={localFilters.status.includes('com_nfe_referenciada')}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="status-referenciado" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Com NF-e Referenciada
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
              Limpar Filtros
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
