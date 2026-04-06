import React, { useState } from 'react';
import { ArrowLeft, Edit, Trash2, DollarSign, MapPin, User, Package, Clock, Info, Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FreightRate } from '../../data/freightRatesData';
import { FreightRateCitiesModal } from './FreightRateCitiesModal';

interface FreightRateViewProps {
  onBack: () => void;
  onEdit: (rate: FreightRate) => void;
  onDelete: (rateId: number) => void;
  rate: FreightRate;
  tableId: number;
}

export const FreightRateView: React.FC<FreightRateViewProps> = ({
  onBack,
  onEdit,
  onDelete,
  rate,
  tableId
}) => {
  const { t } = useTranslation();
  const [showCitiesModal, setShowCitiesModal] = useState(false);

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getTipoAplicacaoLabel = (tipo: string) => {
    switch (tipo) {
      case 'cidade': return t('carriers.freightRates.view.byCity');
      case 'cliente': return t('carriers.freightRates.view.byClient');
      case 'produto': return t('carriers.freightRates.view.byProduct');
      default: return tipo;
    }
  };

  const getTipoAplicacaoIcon = (tipo: string) => {
    switch (tipo) {
      case 'cidade': return <MapPin size={24} className="text-blue-600" />;
      case 'cliente': return <User size={24} className="text-green-600" />;
      case 'produto': return <Package size={24} className="text-purple-600" />;
      default: return <DollarSign size={24} className="text-gray-600 dark:text-gray-400" />;
    }
  };

  const handleDeleteClick = () => {
    if (window.confirm(t('carriers.freightRates.view.confirmDelete'))) {
      onDelete(rate.id);
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
          <span>{t('carriers.freightRates.view.back')}</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('carriers.freightRates.view.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('carriers.freightRates.view.subtitle')}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onEdit(rate)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Edit size={20} />
              <span>{t('carriers.freightRates.view.edit')}</span>
            </button>
            <button
              onClick={() => setShowCitiesModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Map size={20} />
              <span>{t('carriers.freightRates.view.cities')}</span>
            </button>
            <button
              onClick={handleDeleteClick}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Trash2 size={20} />
              <span>{t('carriers.freightRates.view.delete')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start space-x-6">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                {getTipoAplicacaoIcon(rate.tipoAplicacao)}
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{rate.descricao}</h2>
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium px-2.5 py-0.5 rounded">
                  {t('carriers.freightRates.view.code')}: {rate.codigo}
                </span>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">{getTipoAplicacaoLabel(rate.tipoAplicacao)}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.freightRates.view.value')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(rate.valor)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('carriers.freightRates.view.deliveryTime')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {rate.prazoEntrega} {rate.prazoEntrega === 1 ? t('carriers.freightRates.view.day_one') : t('carriers.freightRates.view.day_other')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Type Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('carriers.freightRates.view.applicationDetails')}</h3>
          
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
            <div className="flex items-start space-x-3">
              {getTipoAplicacaoIcon(rate.tipoAplicacao)}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">{getTipoAplicacaoLabel(rate.tipoAplicacao)}</h4>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {rate.tipoAplicacao === 'cidade' && t('carriers.freightRates.view.applicationCity')}
                  {rate.tipoAplicacao === 'cliente' && t('carriers.freightRates.view.applicationClient')}
                  {rate.tipoAplicacao === 'produto' && t('carriers.freightRates.view.applicationProduct')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Time */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('carriers.freightRates.view.deliveryTime')}</h3>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Clock size={32} className="text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{rate.prazoEntrega} {rate.prazoEntrega === 1 ? t('carriers.freightRates.view.day_one') : t('carriers.freightRates.view.day_other')}</p>
              <p className="text-gray-600 dark:text-gray-400">{t('carriers.freightRates.view.estimatedDelivery')}</p>
            </div>
          </div>
        </div>

        {/* Value Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('carriers.freightRates.view.valueInfo')}</h3>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign size={32} className="text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(rate.valor)}</p>
              <p className="text-gray-600 dark:text-gray-400">{t('carriers.freightRates.view.tariffValue')}</p>
            </div>
          </div>
        </div>

        {/* Observations */}
        {rate.observacoes && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('carriers.freightRates.view.observations')}</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">{rate.observacoes}</p>
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Info size={24} className="text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('carriers.freightRates.view.aboutTariffs')}</h3>
              <p className="text-blue-800 mb-4">
                {t('carriers.freightRates.view.aboutTariffsDesc')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-semibold text-blue-900">{t('carriers.freightRates.view.value')}</p>
                  <p className="text-blue-700">{t('carriers.freightRates.view.valueDesc')}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-semibold text-blue-900">{t('carriers.freightRates.view.deliveryTime').split(' ')[0]}</p>
                  <p className="text-blue-700">{t('carriers.freightRates.view.prazoDesc')}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-semibold text-blue-900">{t('carriers.freightRates.view.application')}</p>
                  <p className="text-blue-700">{t('carriers.freightRates.view.applicationDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCitiesModal && (
        <FreightRateCitiesModal
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rate={rate as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tableId={tableId as any}
          onClose={() => setShowCitiesModal(false)}
          onUpdate={() => {}}
        />
      )}
    </div>
  );
};
