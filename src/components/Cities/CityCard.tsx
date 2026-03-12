import React from 'react';
import { CreditCard as Edit, Trash2, Eye, MapPin, Hash, Building, Mail, Info } from 'lucide-react';
import { BrazilianCity } from '../../types/cities';

interface CityCardProps {
  city: BrazilianCity;
  onView: (city: BrazilianCity) => void;
  onEdit: (city: BrazilianCity) => void;
  onDelete: (cityId: number) => void;
  isAdmin?: boolean;
}

export const CityCard: React.FC<CityCardProps> = ({ 
  city, 
  onView, 
  onEdit, 
  onDelete,
  isAdmin
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cidade': return 'bg-blue-100 text-blue-800';
      case 'distrito': return 'bg-green-100 text-green-800';
      case 'povoado': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cidade': return <Building size={14} />;
      case 'distrito': return <MapPin size={14} />;
      case 'povoado': return <MapPin size={14} />;
      default: return <MapPin size={14} />;
    }
  };

  const zipRangeCount = city.zipCodeRanges?.length || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600">{city.stateAbbreviation}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{city.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{city.stateName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => onView(city)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            title="Visualizar"
          >
            <Eye size={16} />
          </button>
          {isAdmin && (
            <>
              <button 
                onClick={() => onEdit(city)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                title="Editar"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => onDelete(city.id)}
                className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                title="Excluir"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Hash size={14} />
          <span>IBGE: {city.ibgeCode}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Mail size={14} />
          <span>CEP: {city.zipCodeStart}</span>
          {city.zipCodeStart !== city.zipCodeEnd && (
            <span> - {city.zipCodeEnd}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <MapPin size={14} />
          <span>Região {city.region}</span>
        </div>

        {/* ZIP Code Ranges Info */}
        {zipRangeCount > 0 && (
          <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-2 py-1 rounded">
            <Info size={14} />
            <span className="text-xs font-medium">
              {zipRangeCount} faixa{zipRangeCount > 1 ? 's' : ''} de CEP detalhada{zipRangeCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="text-sm">
          <span className="text-gray-600 dark:text-gray-400">Estado:</span>
          <span className="font-semibold text-gray-900 dark:text-white ml-1">{city.stateAbbreviation}</span>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(city.type)}`}>
            {getTypeIcon(city.type)}
            <span className="ml-1 capitalize">{city.type.charAt(0).toUpperCase() + city.type.slice(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};