import React from 'react';
import { Package, Hash, Tag, FileText, Calendar, Edit, ArrowLeft } from 'lucide-react';
import { CatalogItem } from '../../services/catalogItemsService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface CatalogItemViewProps {
  item: CatalogItem;
  onBack: () => void;
  onEdit: () => void;
  isAdmin?: boolean;
}

export const CatalogItemView: React.FC<CatalogItemViewProps> = ({ 
  item, 
  onBack, 
  onEdit,
  isAdmin = true 
}) => {
  const { t } = useTranslation();
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          {t('catalogItems.backToList')}
        </button>
        {isAdmin && (
          <button
            onClick={onEdit}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Edit className="w-4 h-4 mr-2" />
            {t('catalogItems.editItem')}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-10 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Package size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{item.item_code}</h1>
              <p className="text-blue-100 mt-1 text-lg">{item.item_description}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-500" />
                  {t('catalogItems.fiscalInfo')}
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 space-y-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('catalogItems.ncmLabel')}</span>
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="text-gray-900 dark:text-white font-mono">{item.ncm_code || t('catalogItems.notInformed')}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('catalogItems.eanLabel')}</span>
                    <div className="flex items-center">
                      <Hash className="w-4 h-4 mr-2 text-green-500" />
                      <span className="text-gray-900 dark:text-white font-mono">{item.ean_code || t('catalogItems.notInformed')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                  {t('catalogItems.systemInfo')}
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 space-y-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('catalogItems.createdAt')}</span>
                    <span className="text-gray-900 dark:text-white">{formatDate(item.created_at)}</span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('catalogItems.updatedAt')}</span>
                    <span className="text-gray-900 dark:text-white">{formatDate(item.updated_at)}</span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('catalogItems.internalId')}</span>
                    <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">{item.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
