import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard as Edit, MapPin, Hash, Building, Mail, Globe, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { BrazilianCity } from '../../types/cities';
import { fetchCityById } from '../../services/citiesService';
import { useTranslation } from 'react-i18next';

interface CityViewProps {
  onBack: () => void;
  onEdit: () => void;
  city: BrazilianCity;
  isAdmin?: boolean;
}

export const CityView: React.FC<CityViewProps> = ({ onBack, onEdit, city, isAdmin }) => {
  const { t } = useTranslation();
  const [showZipRanges, setShowZipRanges] = useState(false);
  const [fullCity, setFullCity] = useState<BrazilianCity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch full city data with ZIP code ranges
  useEffect(() => {
    const fetchFullCity = async () => {
      try {
        const data = await fetchCityById(city.id);
        setFullCity(data);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFullCity();
  }, [city.id]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cidade': return 'bg-blue-100 text-blue-800';
      case 'distrito': return 'bg-green-100 text-green-800';
      case 'povoado': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const zipRangeCount = fullCity?.zipCodeRanges?.length || 0;

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>{t('cities.actions.back', { defaultValue: 'Voltar para Cidades' })}</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('cities.messages.loading', { defaultValue: 'Carregando...' })}</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>{t('cities.actions.back', { defaultValue: 'Voltar para Cidades' })}</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('cities.actions.viewTitle', { defaultValue: 'Visualizar Cidade' })}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('cities.form.viewSubtitle', { defaultValue: 'Detalhes completos da cidade' })}</p>
          </div>
          {isAdmin && (
            <button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Edit size={20} />
              <span>{t('cities.actions.edit', { defaultValue: 'Editar' })}</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start space-x-6">
            {/* State Abbreviation */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">{fullCity?.stateAbbreviation || city.stateAbbreviation}</span>
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{fullCity?.name || city.name}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{fullCity?.stateName || city.stateName} - {fullCity?.region || city.region}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('cities.form.ibgeCode', { defaultValue: 'Código IBGE' })}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{fullCity?.ibgeCode || city.ibgeCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('cities.form.type', { defaultValue: 'Tipo' })}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(fullCity?.type || city.type)}`}>
                    {t(`cities.types.${fullCity?.type || city.type}`, { defaultValue: (fullCity?.type || city.type).charAt(0).toUpperCase() + (fullCity?.type || city.type).slice(1) })}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('cities.form.state', { defaultValue: 'Estado' })}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{fullCity?.stateName || city.stateName} ({fullCity?.stateAbbreviation || city.stateAbbreviation})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('cities.form.region', { defaultValue: 'Região' })}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{fullCity?.region || city.region}</p>
                </div>
              </div>
            </div>

            {/* ZIP Range Stats */}
            <div className="text-center">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600">{zipRangeCount}</p>
                <p className="text-sm text-blue-700">{t('cities.stats.zipRangesCount', { defaultValue: 'Faixas de CEP' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('cities.form.locationInfo', { defaultValue: 'Informações de Localização' })}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Globe className="text-purple-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Região</p>
                <p className="font-medium text-gray-900 dark:text-white">{fullCity?.region || city.region}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Building className="text-blue-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Estado</p>
                <p className="font-medium text-gray-900 dark:text-white">{fullCity?.stateName || city.stateName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="text-red-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cidade</p>
                <p className="font-medium text-gray-900 dark:text-white">{fullCity?.name || city.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Postal Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('cities.form.postalInfo', { defaultValue: 'Informações Postais' })}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <Mail className="text-green-500" size={24} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('cities.form.zipStart', { defaultValue: 'CEP Inicial' })}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{fullCity?.zipCodeStart || city.zipCodeStart}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Mail className="text-orange-500" size={24} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('cities.form.zipEnd', { defaultValue: 'CEP Final' })}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{fullCity?.zipCodeEnd || city.zipCodeEnd}</p>
              </div>
            </div>
          </div>
          
          {(fullCity?.zipCodeStart !== fullCity?.zipCodeEnd) && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{t('cities.form.zipRangeBold', { defaultValue: 'Faixa de CEPs:' })}</strong> {t('cities.form.zipRangeDesc', { defaultValue: 'Esta localidade possui uma faixa de CEPs de {{start}} até {{end}}.', start: fullCity?.zipCodeStart || city.zipCodeStart, end: fullCity?.zipCodeEnd || city.zipCodeEnd })}
              </p>
            </div>
          )}
        </div>

        {/* Detailed ZIP Code Ranges */}
        {zipRangeCount > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('cities.form.detailedZipRanges', { defaultValue: 'Faixas Detalhadas de CEP' })}</h3>
              <button
                onClick={() => setShowZipRanges(!showZipRanges)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span className="text-sm font-medium">
                  {showZipRanges ? t('cities.actions.hide', { defaultValue: 'Ocultar' }) : t('cities.actions.show', { defaultValue: 'Mostrar' })} {t('cities.stats.zipRanges', { count: zipRangeCount, defaultValue: '{{count}} faixa(s)' })}
                </span>
                {showZipRanges ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {showZipRanges && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fullCity?.zipCodeRanges?.map((range, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{t('cities.form.rangeTitle', { defaultValue: 'Faixa' })} {index + 1}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">#{index + 1}</span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">CEP:</span>
                          <span className="font-mono font-medium text-gray-900 dark:text-white ml-1">
                            {range.start} - {range.end}
                          </span>
                        </div>
                        
                        {range.area && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">{t('cities.form.area', { defaultValue: 'Área:' })}</span>
                            <span className="font-medium text-gray-900 dark:text-white ml-1">{range.area}</span>
                          </div>
                        )}
                        
                        {range.neighborhood && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">{t('cities.form.neighborhood', { defaultValue: 'Bairro/Região:' })}</span>
                            <span className="font-medium text-gray-900 dark:text-white ml-1">{range.neighborhood}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info size={16} className="text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-green-800 font-medium">{t('cities.form.detailedZipRanges', { defaultValue: 'Faixas de CEP Detalhadas' })}</p>
                      <p className="text-xs text-green-700 mt-1">
                        {t('cities.messages.zipDetailBox', { count: zipRangeCount, defaultValue: `Esta localidade possui {{count}} faixa(s) específica(s) de CEP, permitindo identificação precisa de áreas, bairros e regiões para melhor logística de entrega.` })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Codes and Identifiers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('cities.form.codesIdentifiers', { defaultValue: 'Códigos e Identificadores' })}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <Hash className="text-blue-600" size={24} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('cities.form.ibgeCode', { defaultValue: 'Código IBGE' })}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{fullCity?.ibgeCode || city.ibgeCode}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Building className="text-green-600" size={24} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('cities.form.stateId', { defaultValue: 'ID do Estado' })}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{fullCity?.stateId || city.stateId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('cities.form.generalInfo', { defaultValue: 'Informações Gerais' })}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {t(`cities.types.${fullCity?.type || city.type}`, { defaultValue: (fullCity?.type || city.type).charAt(0).toUpperCase() + (fullCity?.type || city.type).slice(1) })}
              </p>
              <p className="text-sm text-blue-700">{t('cities.form.type', { defaultValue: 'Tipo' })}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{fullCity?.stateAbbreviation || city.stateAbbreviation}</p>
              <p className="text-sm text-green-700">{t('cities.form.state', { defaultValue: 'Estado' })}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{fullCity?.region || city.region}</p>
              <p className="text-sm text-purple-700">{t('cities.form.region', { defaultValue: 'Região' })}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{zipRangeCount}</p>
              <p className="text-sm text-orange-700">{t('cities.stats.zipRangesCount', { defaultValue: 'Faixas de CEP' })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
