import React from 'react';
import { Printer, Download, Calculator } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OrdersActionsProps {
  selectedCount: number;
  onAction: (action: string) => void;
  isLoading: boolean;
}

export const OrdersActions: React.FC<OrdersActionsProps> = ({ selectedCount, onAction, isLoading }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedCount === 1 
            ? t('orders.actions.selected', { count: selectedCount }) 
            : t('orders.actions.selectedPlural', { count: selectedCount })}
        </span>
        
        <div className="flex-1"></div>
        
        <button
          onClick={() => onAction('recalculate')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <Calculator size={16} />
          <span>{t('orders.actions.recalculate')}</span>
        </button>

        <button
          onClick={() => onAction('print')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <Printer size={16} />
          <span>{t('orders.actions.print')}</span>
        </button>
        
        <button
          onClick={() => onAction('download')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <Download size={16} />
          <span>{t('orders.actions.download')}</span>
        </button>
      </div>
    </div>
  );
};