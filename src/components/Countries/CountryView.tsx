import React from 'react';
import { ArrowLeft, Edit, MapPin, Globe, Languages, Building } from 'lucide-react';
import { Country } from '../../services/countriesService';
import { useTranslation } from 'react-i18next';

interface CountryViewProps {
  onBack: () => void;
  onEdit: () => void;
  country: Country;
  isAdmin?: boolean;
}

export const CountryView: React.FC<CountryViewProps> = ({ onBack, onEdit, country, isAdmin }) => {
  const { t } = useTranslation();
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>{t('countries.actions.back')}</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('countries.actions.view')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('countries.viewSubtitle', { defaultValue: 'Detalhes completos do país' })}</p>
          </div>
          {isAdmin && (
            <button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Edit size={20} />
              <span>{t('countries.actions.edit')}</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              {country.bandeira_url ? (
                <img src={country.bandeira_url} alt={`Bandeira de ${country.name}`} className="w-24 h-24 rounded-full object-cover shadow-lg border border-gray-200 dark:border-gray-700" />
              ) : (
                <div className="text-8xl">{country.flag}</div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{country.name}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{t('countries.form.code')}: {country.code}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('countries.form.continent')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{country.continent}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('countries.form.capital')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{country.capital}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('countries.form.language')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{country.language}</p>
                </div>
                {country.iso3 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('countries.form.iso3', 'Cod. ISO 3166-1')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{country.iso3}</p>
                  </div>
                )}
                {country.bacen_code && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('countries.form.bacenCode')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{country.bacen_code}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('countries.locationInfo', { defaultValue: 'Informações de Localização' })}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Globe className="text-purple-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('countries.form.continent')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{country.continent}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="text-red-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('countries.form.capital')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{country.capital}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Languages className="text-orange-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('countries.form.language')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{country.language}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Codes and Identifiers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('countries.codesAndIdentifiers', { defaultValue: 'Códigos e Identificadores' })}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <Building className="text-blue-600" size={24} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('countries.form.code')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{country.code}</p>
              </div>
            </div>
            
            {country.bacen_code && (
              <div className="flex items-center space-x-3">
                <Building className="text-green-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('countries.form.bacenCode')}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{country.bacen_code}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('countries.generalInfo', { defaultValue: 'Informações Gerais' })}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{country.code}</p>
              <p className="text-sm text-blue-700">{t('countries.form.code')}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{country.flag}</p>
              <p className="text-sm text-green-700">{t('countries.form.flag')} (Emoji)</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{country.continent}</p>
              <p className="text-sm text-purple-700">{t('countries.form.continent')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};