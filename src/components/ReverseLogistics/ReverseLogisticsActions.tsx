import React from 'react';
import { CheckCircle, XCircle, Truck, FileText, Mail } from 'lucide-react';

interface ReverseLogisticsActionsProps {
  selectedCount: number;
  onBulkAction: (action: string) => void;
}

const ReverseLogisticsActions: React.FC<ReverseLogisticsActionsProps> = ({
  selectedCount,
  onBulkAction
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-blue-900">
            {selectedCount} {selectedCount === 1 ? 'solicitação selecionada' : 'solicitações selecionadas'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onBulkAction('approve')}
            className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Aprovar</span>
          </button>
          <button
            onClick={() => onBulkAction('reject')}
            className="flex items-center space-x-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>Rejeitar</span>
          </button>
          <button
            onClick={() => onBulkAction('schedule_pickup')}
            className="flex items-center space-x-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Truck className="w-4 h-4" />
            <span>Agendar Coleta</span>
          </button>
          <button
            onClick={() => onBulkAction('generate_labels')}
            className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Gerar Etiquetas</span>
          </button>
          <button
            onClick={() => onBulkAction('send_notification')}
            className="flex items-center space-x-2 px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>Notificar Cliente</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReverseLogisticsActions;