import React from 'react';
import { Edit, Trash2, Eye, Globe, MapPin, Languages } from 'lucide-react';
import { Country } from '../../services/countriesService';

interface CountryCardProps {
  country: Country;
  onView: (country: Country) => void;
  onEdit: (country: Country) => void;
  onDelete: (countryId: string | number) => void;
  isAdmin?: boolean;
}

export const CountryCard: React.FC<CountryCardProps> = ({ 
  country, 
  onView, 
  onEdit, 
  onDelete,
  isAdmin
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-12 flex-shrink-0 flex items-center justify-center rounded-lg overflow-hidden bg-gray-50 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
            {country.bandeira_url ? (
              <img src={country.bandeira_url} alt={`Bandeira de ${country.name}`} className="w-full h-full object-cover" />
            ) : country.flag ? (
              <span className="text-4xl leading-none">{country.flag}</span>
            ) : (
               <div className="w-full h-full bg-blue-100 flex items-center justify-center dark:bg-blue-900/30">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{country.code}</span>
               </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {country.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Cod. ISO* : {country.code}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onView(country)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            title="Visualizar"
          >
            <Eye size={16} />
          </button>
          {isAdmin && (
            <>
              <button 
                onClick={() => onEdit(country)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                title="Editar"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(country.id!); }}
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
          <span>{country.continent || 'Não informado'}</span>
        </div>
        
        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
          <MapPin size={16} className="text-gray-400" />
          <span>{country.capital || 'Não informado'}</span>
        </div>
        
        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
          <Languages size={16} className="text-gray-400" />
          <span>{country.language || 'Não informado'}</span>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400">Cod. ISO* : </span>
          <span className="font-bold text-gray-900 dark:text-white ml-0.5">{country.code}</span>
        </div>
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            {country.continent || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};