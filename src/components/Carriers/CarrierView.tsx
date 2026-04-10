import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Edit, Star, Phone, Mail, MapPin, Building, Clock, Truck, Globe, Eye, CheckCircle, Circle } from 'lucide-react';
import { FreightRateTablesList } from '../FreightRates/FreightRateTablesList';
import { CarrierVision360 } from './CarrierVision360';
import { formatarCNPJ } from '../../utils/cnpj/formatter';

interface CarrierViewProps {
  onBack: () => void;
  onEdit: () => void;
  carrier: any;
}

export const CarrierView: React.FC<CarrierViewProps> = ({ onBack, onEdit, carrier }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'vision360' | 'details' | 'freight-rates'>('vision360');
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={20}
        className={i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === undefined || value === null) return t('carriers.view.notInformed');
    const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(numericValue)) return t('carriers.view.notInformed');
    return (numericValue / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatPercentage = (value: number | string | null | undefined) => {
    if (value === undefined || value === null) return t('carriers.view.notInformed');
    return `${value}%`;
  };

  // Remover mock de getLocationName, pois os dados já vêm diretamente do banco na chamada

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>{t('carriers.backToCarriers')}</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('carriers.view.pageTitle')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('carriers.view.pageSubtitle')}</p>
          </div>
          <button
            onClick={onEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Edit size={20} />
            <span>{t('carriers.editAction')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('vision360')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'vision360'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Eye size={16} />
                <span>{t('carriers.view.vision360Tab')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Truck size={16} />
                <span>{t('carriers.view.carrierData')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('freight-rates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'freight-rates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock size={16} />
                <span>{t('carriers.freightRates.title')}</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'vision360' ? (
        <CarrierVision360 carrierId={carrier.id} carrierName={carrier.razao_social} />
      ) : activeTab === 'details' ? (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start space-x-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                {carrier.logotipo ? (
                  <img
                    src={carrier.logotipo}
                    alt={`Logo ${carrier.name}`}
                    className="w-24 h-24 object-contain border border-gray-200 dark:border-gray-700 rounded-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{t('carriers.form.logoLabel')}</span>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{carrier.name}</h2>
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium px-2.5 py-0.5 rounded">
                    {carrier.codigo}
                  </span>
                </div>
                <div className="flex items-center space-x-6 mb-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 mb-1">NPS Interno</span>
                    <div className="flex items-center space-x-1">
                      {renderStars(carrier.nps_interno || 0)}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">({(carrier.nps_interno || 0).toFixed(1)})</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 mb-1">NPS Externo</span>
                    <div className="flex items-center space-x-1">
                      {renderStars(carrier.nps_externo || 0)}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">({(carrier.nps_externo || 0).toFixed(1)})</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.form.companyNameLabel')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{carrier.razao_social || t('carriers.view.notInformed')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.form.fantasyName')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{carrier.fantasia || carrier.nome_fantasia || t('carriers.view.notInformed')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">CNPJ</p>
                    <p className="font-medium text-gray-900 dark:text-white">{carrier.cnpj ? formatarCNPJ(carrier.cnpj) : t('carriers.view.notInformed')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.view.status')}</p>
                    <span className={`
                      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                      ${carrier.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    `}>
                      {carrier.status === 'ativo' ? t('carriers.form.status.active') : t('carriers.form.status.inactive')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="text-center">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-600">{carrier.active_shipments || 0}</p>
                  <p className="text-sm text-blue-700">{t('carriers.view.activeDeliveries')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('carriers.view.contactInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="text-blue-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.form.email')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{carrier.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="text-green-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.form.phone')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{carrier.phone || t('carriers.view.notInformed')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('carriers.view.locationInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Globe className="text-purple-500" size={20} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.view.country')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{carrier.pais || t('carriers.view.notInformed')}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Building className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.view.state')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{carrier.estado || t('carriers.view.notInformed')}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="text-red-500" size={20} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.view.city')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{carrier.cidade || t('carriers.view.notInformed')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tolerance Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('carriers.view.toleranceSettings')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* CT-e Tolerances */}
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">{t('carriers.view.cte')}</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.view.valueTolerance')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(carrier.tolerancia_valor_cte)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.view.percentTolerance')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatPercentage(carrier.tolerancia_percentual_cte)}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Tolerances */}
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">{t('carriers.view.invoice')}</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.view.valueTolerance')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(carrier.tolerancia_valor_fatura)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.view.percentTolerance')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatPercentage(carrier.tolerancia_percentual_fatura)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transport Modals */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('carriers.form.transportModalsTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg border-2 ${carrier.modal_rodoviario ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  {carrier.modal_rodoviario ? (
                    <CheckCircle className="text-green-600" size={24} />
                  ) : (
                    <Circle className="text-gray-400" size={24} />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('carriers.form.modals.rodoviario')}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {carrier.modal_rodoviario ? t('carriers.form.status.active') : t('carriers.form.status.inactive')}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${carrier.modal_aereo ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  {carrier.modal_aereo ? (
                    <CheckCircle className="text-blue-600" size={24} />
                  ) : (
                    <Circle className="text-gray-400" size={24} />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('carriers.form.modals.aereo')}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {carrier.modal_aereo ? t('carriers.form.status.active') : t('carriers.form.status.inactive')}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${carrier.modal_aquaviario ? 'border-cyan-500 bg-cyan-50' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  {carrier.modal_aquaviario ? (
                    <CheckCircle className="text-cyan-600" size={24} />
                  ) : (
                    <Circle className="text-gray-400" size={24} />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('carriers.form.modals.aquaviario')}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {carrier.modal_aquaviario ? t('carriers.form.status.active') : t('carriers.form.status.inactive')}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${carrier.modal_ferroviario ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  {carrier.modal_ferroviario ? (
                    <CheckCircle className="text-orange-600" size={24} />
                  ) : (
                    <Circle className="text-gray-400" size={24} />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('carriers.form.modals.ferroviario')}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {carrier.modal_ferroviario ? t('carriers.form.status.active') : t('carriers.form.status.inactive')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('carriers.view.performanceMetrics')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{(carrier.nps_interno || carrier.nps_externo) ? (((carrier.nps_interno || 0) + (carrier.nps_externo || 0)) / ((carrier.nps_interno ? 1 : 0) + (carrier.nps_externo ? 1 : 0))).toFixed(1) : 'S/N'}</p>
                <p className="text-sm text-blue-700">{t('carriers.view.averageRating')}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{carrier.active_shipments || 0}</p>
                <p className="text-sm text-green-700">{t('carriers.view.activeDeliveries')}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{carrier.taxa_entrega ? `${carrier.taxa_entrega}%` : 'S/N'}</p>
                <p className="text-sm text-purple-700">{t('carriers.view.deliveryRate')}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <FreightRateTablesList carrierId={carrier.id} carrierName={carrier.name} />
      )}
    </div>
  );
};
