import React from 'react';
import { Printer, RefreshCw, ThumbsUp, ThumbsDown, Clock as ArrowClockwise, Download, FileText } from 'lucide-react';

interface CTesActionsProps {
  selectedCount: number;
  onAction: (action: string) => void;
  isLoading: boolean;
}

export const CTesActions: React.FC<CTesActionsProps> = ({ selectedCount, onAction, isLoading }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedCount} CT-e{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
        </span>
        
        <div className="flex-1"></div>
        
        <button
          onClick={() => onAction('print')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <Printer size={16} />
          <span>Imprimir DACTE</span>
        </button>
        
        <button
          onClick={() => onAction('recalculate')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <RefreshCw size={16} />
          <span>Recalcular CT-e</span>
        </button>
        
        <button
          onClick={() => onAction('approve')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <ThumbsUp size={16} />
          <span>Aprovar CT-e</span>
        </button>
        
        <button
          onClick={() => onAction('reject')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <ThumbsDown size={16} />
          <span>Reprovar CT-e</span>
        </button>
        
        <button
          onClick={() => onAction('revert')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <ArrowClockwise size={16} />
          <span>Estornar CT-e</span>
        </button>
        
        <button
          onClick={() => onAction('download')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <Download size={16} />
          <span>Download XMLs</span>
        </button>

        <button
          onClick={() => onAction('reportDivergence')}
          disabled={selectedCount !== 1 || isLoading}
          className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <FileText size={16} />
          <span>Reportar Divergência</span>
        </button>
      </div>
    </div>
  );
};
