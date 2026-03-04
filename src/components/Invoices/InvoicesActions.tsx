import React from 'react';
import { Printer, Download, PackagePlus, Calendar } from 'lucide-react';

interface InvoicesActionsProps {
  selectedCount: number;
  onAction: (action: string) => void;
  isLoading: boolean;
}

export const InvoicesActions: React.FC<InvoicesActionsProps> = ({ selectedCount, onAction, isLoading }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedCount} Nota{selectedCount !== 1 ? 's' : ''} Fiscal{selectedCount !== 1 ? 'is' : ''} selecionada{selectedCount !== 1 ? 's' : ''}
        </span>

        <div className="flex-1"></div>

        <button
          onClick={() => onAction('schedule-pickup')}
          disabled={selectedCount === 0 || isLoading}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm font-medium"
        >
          <Calendar size={18} />
          <span>Agendar Coleta</span>
        </button>

        <button
          onClick={() => onAction('create-pickup')}
          disabled={selectedCount === 0 || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm font-medium"
        >
          <PackagePlus size={18} />
          <span>Criar Coleta(s)</span>
        </button>

        <button
          onClick={() => onAction('print')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <Printer size={16} />
          <span>Imprimir DANFE</span>
        </button>

        <button
          onClick={() => onAction('download')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <Download size={16} />
          <span>Download XMLs</span>
        </button>
      </div>
    </div>
  );
};