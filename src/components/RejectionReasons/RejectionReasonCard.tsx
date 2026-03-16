import React from 'react';
import { Edit, Trash2, Eye, FileText, Hash, Tag, CheckCircle, XCircle } from 'lucide-react';
import { RejectionReason } from '../../data/rejectionReasonsData';
import { useTranslation } from 'react-i18next';

interface RejectionReasonCardProps {
  reason: RejectionReason;
  onView: (reason: RejectionReason) => void;
  onEdit: (reason: RejectionReason) => void;
  onDelete: (reasonId: number) => void;
  isAdmin?: boolean;
}

export const RejectionReasonCard: React.FC<RejectionReasonCardProps> = ({ 
  reason, 
  onView, 
  onEdit, 
  onDelete,
  isAdmin
}) => {
  const { t } = useTranslation();
  
  // Get category color based on category name
  const getCategoryColor = () => {
    if (reason.categoria.includes('Dados do Documento')) return 'bg-blue-100 text-blue-800';
    if (reason.categoria.includes('Valor')) return 'bg-green-100 text-green-800';
    if (reason.categoria.includes('Temporais')) return 'bg-yellow-100 text-yellow-800';
    if (reason.categoria.includes('Integrações')) return 'bg-purple-100 text-purple-800';
    if (reason.categoria.includes('Contratuais')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-blue-600">{reason.codigo}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]" title={reason.descricao}>
              {reason.descricao.length > 40 ? reason.descricao.substring(0, 40) + '...' : reason.descricao}
            </h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getCategoryColor()}`}>
              <Tag size={12} className="mr-1" />
              <span className="truncate max-w-[150px]" title={reason.categoria}>{reason.categoria}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => onView(reason)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            title={t('rejectionReasons.card.viewTooltip')}
          >
            <Eye size={16} />
          </button>
          {isAdmin && (
            <>
              <button 
                onClick={() => onEdit(reason)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                title={t('rejectionReasons.card.editTooltip')}
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => onDelete(reason.id)}
                className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                title={t('rejectionReasons.card.deleteTooltip')}
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
          <span>{t('rejectionReasons.card.codePrefix')} {reason.codigo}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Tag size={14} />
          <span className="truncate" title={reason.categoria}>{reason.categoria}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <FileText size={14} />
          <span className="line-clamp-2" title={reason.descricao}>{reason.descricao}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="text-sm">
          <span className="text-gray-600 dark:text-gray-400">{t('rejectionReasons.card.statusPrefix')}</span>
          <span className={`font-semibold ml-1 ${reason.ativo ? 'text-green-600' : 'text-red-600'}`}>
            {reason.ativo ? t('rejectionReasons.card.statusActive') : t('rejectionReasons.card.statusInactive')}
          </span>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${reason.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {reason.ativo ? (
              <>
                <CheckCircle size={14} className="mr-1" />
                <span>{t('rejectionReasons.card.statusActive')}</span>
              </>
            ) : (
              <>
                <XCircle size={14} className="mr-1" />
                <span>{t('rejectionReasons.card.statusInactive')}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};