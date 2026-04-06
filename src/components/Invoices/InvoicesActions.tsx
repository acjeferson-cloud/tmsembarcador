import React from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, Download, PackagePlus, RefreshCw } from 'lucide-react';

interface InvoicesActionsProps {
  selectedCount: number;
  onAction: (action: string) => void;
  isLoading: boolean;
}

export const InvoicesActions: React.FC<InvoicesActionsProps> = ({ selectedCount, onAction, isLoading }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedCount} {selectedCount !== 1 ? t('invoices.actions.selectedPlural') : t('invoices.actions.selectedSingular')}
        </span>

        <div className="flex flex-wrap items-center gap-2">
        {/* Botão ocultado temporariamente a pedido do usuário
        <button
          onClick={() => onAction('schedule-pickup')}
          disabled={selectedCount === 0 || isLoading}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm font-medium"
        >
          <Calendar size={18} />
          <span>Agendar Coleta</span>
        </button>
        */}

        <button
          onClick={() => onAction('create-pickup')}
          disabled={selectedCount === 0 || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm font-medium"
        >
          <PackagePlus size={18} />
          <span>{t('invoices.actions.createPickup')}</span>
        </button>

        <button
          onClick={() => onAction('recalculate')}
          disabled={selectedCount === 0 || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm font-medium"
        >
          <RefreshCw size={18} />
          <span>{t('invoices.actions.recalculate')}</span>
        </button>

        <button
          onClick={() => onAction('print')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <Printer size={16} />
          <span>{t('invoices.actions.printDanfe')}</span>
        </button>

        <button
          onClick={() => onAction('download')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <Download size={16} />
          <span>{t('invoices.actions.downloadXmls')}</span>
        </button>
        </div>
      </div>
    </div>
  );
};
