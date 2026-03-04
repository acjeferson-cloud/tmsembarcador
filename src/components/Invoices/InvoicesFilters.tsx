import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Truck, MapPin, User, FileText, DollarSign } from 'lucide-react';
import { brazilianStates } from '../../data/statesData';
import { carriersService, Carrier } from '../../services/carriersService';
import { useFilterCache } from '../../hooks/useFilterCache';

interface InvoicesFiltersProps {
  onFilterChange: (filters: any) => void;
  filters: {
    transportador: string;
    cliente: string;
    periodoEmissao: { start: string; end: string };
    periodoEntrada: { start: string; end: string };
    ufDestino: string;
    cidadeDestino: string;
    status: string[];
    baseCusto: string;
    numeroOuChave: string;
  };
}

export const InvoicesFilters: React.FC<InvoicesFiltersProps> = ({ onFilterChange, filters }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [carriers, setCarriers] = useState<Carrier[]>([]);

  useFilterCache('invoices-filters', localFilters, setLocalFilters);

  useEffect(() => {
    loadCarriers();
  }, []);

  const loadCarriers = async () => {
    try {
      const data = await carriersService.getAll();
      setCarriers(data);
    } catch (error) {
      console.error('Erro ao carregar transportadores:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateRangeChange = (range: 'periodoEmissao' | 'periodoEntrada', field: 'start' | 'end', value: string) => {
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
      ufDestino: '',
      cidadeDestino: '',
      status: [] as string[],
      baseCusto: '',
      numeroOuChave: ''
    };

    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  // Quick search by número ou chave
  const handleQuickSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      numeroOuChave: value
    }));
    
    // Apply filter immediately for quick search
    onFilterChange({
      ...localFilters,
      numeroOuChave: value
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
            placeholder="Buscar por número ou chave de acesso..."
            value={localFilters.numeroOuChave}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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

            {/* Cliente Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <User size={16} />
                <span>Cliente</span>
              </label>
              <input
                type="text"
                name="cliente"
                value={localFilters.cliente}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o nome do cliente"
              />
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

            {/* Período de Entrada Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <Calendar size={16} />
                <span>Período de Entrada</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={localFilters.periodoEntrada.start}
                  onChange={(e) => handleDateRangeChange('periodoEntrada', 'start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="flex items-center text-gray-500 dark:text-gray-400">a</span>
                <input
                  type="date"
                  value={localFilters.periodoEntrada.end}
                  onChange={(e) => handleDateRangeChange('periodoEntrada', 'end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* UF Destino Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <MapPin size={16} />
                <span>UF de Destino</span>
              </label>
              <select
                name="ufDestino"
                value={localFilters.ufDestino}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas as UFs</option>
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
                <span>Cidade de Destino</span>
              </label>
              <input
                type="text"
                name="cidadeDestino"
                value={localFilters.cidadeDestino}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite a cidade de destino"
              />
            </div>

            {/* Base para Custo Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <DollarSign size={16} />
                <span>Base para Custo</span>
              </label>
              <select
                name="baseCusto"
                value={localFilters.baseCusto}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                <option value="tabela">Tabela de Frete</option>
                <option value="negociacao">Negociação Individual</option>
              </select>
            </div>

          </div>

          {/* Status Checkboxes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-1">
              <FileText size={16} />
              <span>Status da NF-e</span>
            </label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-nfe_emitida"
                  value="nfe_emitida"
                  checked={localFilters.status.includes('nfe_emitida')}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="status-nfe_emitida" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Nota Fiscal Emitida
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-coletado_transportadora"
                  value="coletado_transportadora"
                  checked={localFilters.status.includes('coletado_transportadora')}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="status-coletado_transportadora" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Coletado pela Transportadora
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
                  Em Trânsito
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
                  Saiu para Entrega
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
                  Entregue
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
                  Cancelada
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            >
              Limpar Filtros
            </button>
            <button
              type="button"
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