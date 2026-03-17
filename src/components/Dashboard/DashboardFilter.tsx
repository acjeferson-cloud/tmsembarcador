import React, { useState } from 'react';
import { Calendar, MapPin, Truck, RefreshCw } from 'lucide-react';
import { DashboardFilterDates, DashboardFilters } from '../../services/dashboardService';
import { useTranslation } from 'react-i18next';

interface Props {
  filters: DashboardFilters;
  onFilterChange: (newFilters: DashboardFilters) => void;
  onRefresh: () => void;
}

const BRAZILIAN_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const DashboardFilter: React.FC<Props> = ({ filters, onFilterChange, onRefresh }) => {
  const { t } = useTranslation();
  
  // Local state to avoid rendering issues typing
  const [localStart, setLocalStart] = useState(filters.dateRange.start);
  const [localEnd, setLocalEnd] = useState(filters.dateRange.end);
  const [localUf, setLocalUf] = useState(filters.uf || '');

  const handleApply = () => {
    onFilterChange({
      ...filters,
      dateRange: { start: localStart, end: localEnd },
      uf: localUf || undefined
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 justify-end items-start sm:items-center">
      
      <div className="flex flex-wrap items-center justify-end gap-4 w-full sm:w-auto">
        
        {/* Date Range */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5">
          <Calendar size={18} className="text-gray-500 dark:text-gray-400" />
          <input
            type="date"
            value={localStart}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setLocalStart(e.target.value)}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
          />
          <span className="text-gray-500 dark:text-gray-400 text-sm">até</span>
          <input
            type="date"
            value={localEnd}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setLocalEnd(e.target.value)}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
          />
        </div>

        {/* UF Selector */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5">
          <MapPin size={18} className="text-gray-500 dark:text-gray-400" />
          <select 
             value={localUf}
             onChange={(e) => setLocalUf(e.target.value)}
             className="bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none w-28"
          >
            <option value="">Todas UFs</option>
            {BRAZILIAN_UFS.map(uf => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleApply}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          Aplicar Filtros
        </button>

      </div>

      <div>
         <button
            onClick={onRefresh}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2"
            title="Atualizar dados agora"
          >
           <RefreshCw size={16} />
           <span className="text-sm font-medium hidden sm:block">Atualizar</span>
         </button>
      </div>

    </div>
  );
};
