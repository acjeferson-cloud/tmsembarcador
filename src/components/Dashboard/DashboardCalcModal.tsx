import React from 'react';
import { Info, X, TrendingUp, Activity, Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DashboardCalcModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-600" />
            {t('dashboard.calcModal.title')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          
          {/* Aba Executiva */}
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <h4 className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              {t('dashboard.tabs.executive')}
            </h4>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.executive.freightExpense')}</p>
                <p className="text-sm">{t('dashboard.calcModal.executive.freightExpenseDesc')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.executive.shipments')}</p>
                <p className="text-sm">{t('dashboard.calcModal.executive.shipmentsDesc')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.executive.averageTicket')}</p>
                <p className="text-sm">{t('dashboard.calcModal.executive.averageTicketDesc')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.executive.sla')}</p>
                <p className="text-sm">{t('dashboard.calcModal.executive.slaDesc')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.executive.representativity')}</p>
                <p className="text-sm">{t('dashboard.calcModal.executive.representativityDesc')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.executive.operationalCost')}</p>
                <p className="text-sm">{t('dashboard.calcModal.executive.operationalCostDesc')}</p>
              </div>
               <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.executive.divergenceCost')}</p>
                <p className="text-sm">{t('dashboard.calcModal.executive.divergenceCostDesc')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.executive.extraFees')}</p>
                <p className="text-sm">{t('dashboard.calcModal.executive.extraFeesDesc')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.executive.costEvolution')}</p>
                <p className="text-sm">{t('dashboard.calcModal.executive.costEvolutionDesc')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.executive.carrierShare')}</p>
                <p className="text-sm">{t('dashboard.calcModal.executive.carrierShareDesc')}</p>
              </div>
            </div>
          </div>

          {/* Aba Operacional */}
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <h4 className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">
              <Activity className="w-5 h-5 text-green-600" />
              {t('dashboard.tabs.operational')}
            </h4>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.operational.leadTime')}</p>
                <p className="text-sm">{t('dashboard.calcModal.operational.leadTimeDesc')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.operational.collectionSla')}</p>
                <p className="text-sm">{t('dashboard.calcModal.operational.collectionSlaDesc')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.operational.backlogVolume')}</p>
                <p className="text-sm">{t('dashboard.calcModal.operational.backlogVolumeDesc')}</p>
              </div>
               <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.operational.pipeline')}</p>
                <p className="text-sm">{t('dashboard.calcModal.operational.pipelineDesc')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.operational.statusComposition')}</p>
                <p className="text-sm">{t('dashboard.calcModal.operational.statusCompositionDesc')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.operational.topOccurrences')}</p>
                <p className="text-sm">{t('dashboard.calcModal.operational.topOccurrencesDesc')}</p>
              </div>
            </div>
          </div>

          {/* Aba Mapa de Custos */}
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <h4 className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">
              <Map className="w-5 h-5 text-orange-600" />
              {t('dashboard.tabs.map')}
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.map.densityMap')}</p>
              <p className="text-sm">{t('dashboard.calcModal.map.densityMapDesc')}</p>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            {t('dashboard.calcModal.understood')}
          </button>
        </div>
      </div>
    </div>
  );
};
