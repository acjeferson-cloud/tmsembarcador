import React from 'react';
import { Printer, Download, XCircle, Send, CheckCircle } from 'lucide-react';

interface PickupsActionsProps {
  selectedCount: number;
  onAction: (action: string) => void;
  isLoading: boolean;
}

export const PickupsActions: React.FC<PickupsActionsProps> = ({ selectedCount, onAction, isLoading }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedCount} Coleta{selectedCount !== 1 ? 's' : ''} selecionada{selectedCount !== 1 ? 's' : ''}
        </span>

        <div className="flex-1"></div>

        <button
          onClick={() => onAction('solicitar-coleta')}
          disabled={selectedCount !== 1 || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm font-medium"
          title={selectedCount !== 1 ? 'Selecione apenas 1 coleta' : 'Solicitar coleta ao transportador'}
        >
          <Send size={18} />
          <span>Solicitar Coleta ao Transportador</span>
        </button>

        <button
          onClick={() => onAction('realizar')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <CheckCircle size={16} />
          <span>Marcar como Realizada</span>
        </button>

        <button
          onClick={() => onAction('print')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <Printer size={16} />
          <span>Imprimir</span>
        </button>

        <button
          onClick={() => onAction('download')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <Download size={16} />
          <span>Exportar</span>
        </button>

        <button
          onClick={() => onAction('cancelar')}
          disabled={selectedCount === 0 || isLoading}
          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <XCircle size={16} />
          <span>Cancelar</span>
        </button>
      </div>
    </div>
  );
};
