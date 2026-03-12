import React from 'react';
import { Edit, Trash2, Eye, FileText, Hash } from 'lucide-react';
import { Occurrence } from '../../data/occurrencesData';

interface OccurrenceCardProps {
  occurrence: Occurrence;
  onView: (occurrence: Occurrence) => void;
  onEdit: (occurrence: Occurrence) => void;
  onDelete: (occurrenceId: number) => void;
  isAdmin?: boolean;
}

export const OccurrenceCard: React.FC<OccurrenceCardProps> = ({ 
  occurrence, 
  onView, 
  onEdit, 
  onDelete,
  isAdmin
}) => {
  // Determine if this is a delivery success or problem occurrence
  const isDeliveryProblem = parseInt(occurrence.codigo) >= 50 || 
                           ['003', '004', '007', '008', '009', '010', '011', '012', '013', '014', '015', '016'].includes(occurrence.codigo);
  
  const getStatusColor = () => {
    if (occurrence.codigo === '001') return 'bg-green-100 text-green-800'; // Entrega normal
    if (isDeliveryProblem) return 'bg-red-100 text-red-800'; // Problemas
    return 'bg-yellow-100 text-yellow-800'; // Outras situações
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-blue-600">{occurrence.codigo}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">{occurrence.descricao}</h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor()}`}>
              {isDeliveryProblem ? 'Problema' : 'Entrega'}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => onView(occurrence)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            title="Visualizar"
          >
            <Eye size={16} />
          </button>
          {isAdmin && (
            <>
              <button 
                onClick={() => onEdit(occurrence)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                title="Editar"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => onDelete(occurrence.id)}
                className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                title="Excluir"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Hash size={14} />
          <span>Código: {occurrence.codigo}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <FileText size={14} />
          <span className="line-clamp-2">{occurrence.descricao}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="text-sm">
          <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
          <span className="font-semibold text-gray-900 dark:text-white ml-1">
            {isDeliveryProblem ? 'Problema' : 'Entrega'}
          </span>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {occurrence.codigo}
          </div>
        </div>
      </div>
    </div>
  );
};