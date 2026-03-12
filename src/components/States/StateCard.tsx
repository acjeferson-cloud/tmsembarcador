import React from 'react';
import { Edit, Trash2, Eye, MapPin, Hash, Globe } from 'lucide-react';
import { State } from '../../services/statesService';

interface StateCardProps {
  state: State;
  onView: (state: State) => void;
  onEdit: (state: State) => void;
  onDelete: (stateId: string | number) => void;
  isAdmin?: boolean;
}

export const StateCard: React.FC<StateCardProps> = ({
  state,
  onView,
  onEdit,
  onDelete,
  isAdmin
}) => {
  const getRegionColor = (region: string) => {
    switch (region) {
      case 'Norte': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'Nordeste': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'Centro-Oeste': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
      case 'Sudeste': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'Sul': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-12 flex-shrink-0 flex items-center justify-center rounded-lg overflow-hidden bg-gray-50 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
            {state.bandeira_url ? (
              <img src={state.bandeira_url} alt={`Bandeira de ${state.name}`} className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full bg-blue-100 flex items-center justify-center dark:bg-blue-900/30">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{state.abbreviation}</span>
               </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {state.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Sigla* : {state.abbreviation}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onView(state)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            title="Visualizar"
          >
            <Eye size={16} />
          </button>
          {isAdmin && (
            <>
              <button 
                onClick={() => onEdit(state)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                title="Editar"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(state.id!); }}
                className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                title="Excluir"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="space-y-3 text-sm flex-grow mb-6">
        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
          <Globe size={16} className="text-gray-400" />
          <span>{state.region || 'Não informado'}</span>
        </div>
        
        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
          <MapPin size={16} className="text-gray-400" />
          <span>{state.capital || 'Não informado'}</span>
        </div>
        
        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
          <Hash size={16} className="text-gray-400" />
          <span>Código IBGE: {state.ibge_code || 'Não informado'}</span>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400">Sigla* : </span>
          <span className="font-bold text-gray-900 dark:text-white ml-0.5">{state.abbreviation}</span>
        </div>
        <div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRegionColor(state.region || '')}`}>
            {state.region || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};