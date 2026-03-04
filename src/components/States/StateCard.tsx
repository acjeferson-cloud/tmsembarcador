import React from 'react';
import { Edit, Trash2, Eye, MapPin, Building, Hash } from 'lucide-react';
import { BrazilianState } from '../../data/statesData';

interface StateCardProps {
  state: BrazilianState;
  onView: (state: BrazilianState) => void;
  onEdit: (state: BrazilianState) => void;
  onDelete: (stateId: number) => void;
}

export const StateCard: React.FC<StateCardProps> = ({
  state,
  onView,
  onEdit,
  onDelete
}) => {
  const getRegionColor = (region: string) => {
    switch (region) {
      case 'Norte': return 'bg-green-100 text-green-800';
      case 'Nordeste': return 'bg-yellow-100 text-yellow-800';
      case 'Centro-Oeste': return 'bg-orange-100 text-orange-800';
      case 'Sudeste': return 'bg-blue-100 text-blue-800';
      case 'Sul': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Bandeira do Brasil para todos os estados
  const brazilFlag = '🇧🇷';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-white">{state.abbreviation}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{state.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">IBGE: {state.ibgeCode || (state as any).ibge_code}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => onView(state)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            title="Visualizar"
          >
            <Eye size={16} />
          </button>
          <button 
            onClick={() => onEdit(state)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => onDelete(state.id)}
            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
            title="Excluir"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <MapPin size={14} />
          <span>{state.capital}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Building size={14} />
          <span>Região {state.region}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Hash size={14} />
          <span>Código IBGE: {state.ibgeCode || (state as any).ibge_code}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="text-sm">
          <span className="text-gray-600 dark:text-gray-400">Sigla:</span>
          <span className="font-semibold text-gray-900 dark:text-white ml-1">{state.abbreviation}</span>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRegionColor(state.region)}`}>
            {state.region}
          </div>
        </div>
      </div>
    </div>
  );
};