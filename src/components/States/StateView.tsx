import React from 'react';
import { ArrowLeft, Edit, MapPin, Hash, Globe } from 'lucide-react';
import { State } from '../../services/statesService';
import { useTranslation } from 'react-i18next';

interface StateViewProps {
  onBack: () => void;
  onEdit: () => void;
  state: State;
  isAdmin?: boolean;
}

export const StateView: React.FC<StateViewProps> = ({ onBack, onEdit, state, isAdmin }) => {
  const { t } = useTranslation();
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>{t('states.form.back')}</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('states.view.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('states.view.subtitle')}</p>
          </div>
          {isAdmin && (
            <button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Edit size={20} />
              <span>{t('states.view.edit_button')}</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start space-x-6">
            {/* State Flag */}
            <div className="flex-shrink-0">
              {state.bandeira_url ? (
                <img src={state.bandeira_url} alt={`Bandeira de ${state.name}`} className="w-24 h-24 rounded-xl object-cover shadow-lg border border-gray-200 dark:border-gray-700" />
              ) : (
                <div className="w-24 h-24 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-3xl font-bold text-blue-600">{state.abbreviation}</span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{state.name}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{t('states.fields.ibge_code')}: {state.ibge_code}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Capital</p>
                  <p className="font-medium text-gray-900 dark:text-white">{state.capital}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Região</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRegionColor(state.region || '')}`}>
                    {state.region}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sigla</p>
                  <p className="font-medium text-gray-900 dark:text-white">{state.abbreviation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Código IBGE</p>
                  <p className="font-medium text-gray-900 dark:text-white">{state.ibge_code}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('states.view.location_info')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Globe className="text-purple-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('states.fields.region')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{state.region}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="text-red-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('states.fields.capital')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{state.capital}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Hash className="text-orange-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('states.fields.ibge_code')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{state.ibge_code}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('states.view.general_info')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{state.abbreviation}</p>
              <p className="text-sm text-blue-700">{t('states.fields.abbreviation')}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{state.ibge_code}</p>
              <p className="text-sm text-green-700">{t('states.fields.ibge_code')}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{state.region}</p>
              <p className="text-sm text-purple-700">{t('states.fields.region')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
