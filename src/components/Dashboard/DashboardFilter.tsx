import React, { useState } from 'react';
import { Calendar, MapPin, Info } from 'lucide-react';
import { DashboardFilters } from '../../services/dashboardService';
import { Toast } from '../common/Toast';

interface Props {
  filters: DashboardFilters;
  onFilterChange: (newFilters: DashboardFilters) => void;
  onShowCalc: () => void;
}

const BRAZILIAN_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const DashboardFilter: React.FC<Props> = ({ filters, onFilterChange, onShowCalc }) => {

  const [localStart, setLocalStart] = useState(filters.dateRange.start);
  const [localEnd, setLocalEnd] = useState(filters.dateRange.end);
  const [localUf, setLocalUf] = useState(filters.uf || '');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const handleApply = () => {
    const startObj = new Date(localStart);
    const endObj = new Date(localEnd);
    
    // Validação de intervalo máximo
    // const diffTime = Math.abs(endObj.getTime() - startObj.getTime());
    // const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Temporariamente desabilitado para testes
    /* 
    if (diffDays > 90) {
      setToast({
        type: 'warning',
        message: 'O período do filtro não pode exceder 90 dias por motivos de performance.'
      });
      return;
    }
    */
    
    if (startObj > endObj) {
      setToast({
        type: 'warning',
        message: 'A data de início não pode ser maior que a data de fim.'
      });
      return;
    }

    onFilterChange({
      ...filters,
      dateRange: { start: localStart, end: localEnd },
      uf: localUf || undefined
    });
    
    setToast({
      type: 'success',
      message: 'Filtros aplicados com sucesso.'
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-end items-start sm:items-center">

      <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">

        {/* Date Range */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 shadow-sm whitespace-nowrap">
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
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 shadow-sm">
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
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          Aplicar Filtros
        </button>

      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onShowCalc}
          className="p-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors shadow-sm flex items-center gap-2"
          title="Como é calculado o dashboard?"
        >
          <Info size={16} />
          <span className="text-sm font-medium hidden sm:block">Como é calculado?</span>
        </button>
      </div>

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
