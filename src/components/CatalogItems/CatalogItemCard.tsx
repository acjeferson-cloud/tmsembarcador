import React from 'react';
import { Edit, Trash2, Eye, Tag, Hash, FileText, Package } from 'lucide-react';
import { CatalogItem } from '../../services/catalogItemsService';
import { useTranslation } from 'react-i18next';

interface CatalogItemCardProps {
  item: CatalogItem;
  onView: (item: CatalogItem) => void;
  onEdit: (item: CatalogItem) => void;
  onDelete: (itemId: string) => void;
  isAdmin?: boolean;
}

export const CatalogItemCard: React.FC<CatalogItemCardProps> = ({ 
  item, 
  onView, 
  onEdit, 
  onDelete,
  isAdmin = true 
}) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]" title={item.item_description}>
              {item.item_description.length > 40 ? item.item_description.substring(0, 40) + '...' : item.item_description}
            </h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}>
              <Hash size={12} className="mr-1" />
              <span className="truncate max-w-[150px]" title={item.item_code}>{t('catalogItems.codeLabel')}{item.item_code}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => onView(item)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            title={t('catalogItems.view')}
          >
            <Eye size={16} />
          </button>
          {isAdmin && (
            <>
              <button 
                onClick={() => onEdit(item)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                title={t('catalogItems.edit')}
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => onDelete(item.id!)}
                className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                title={t('catalogItems.delete')}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="space-y-3 text-sm mt-4">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
          <Tag size={14} className="text-blue-500" />
          <span className="font-medium">{t('catalogItems.ncmCode')}</span>
          <span>{item.ncm_code || t('catalogItems.notInformed')}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
          <Hash size={14} className="text-green-500" />
          <span className="font-medium">{t('catalogItems.eanCode')}</span>
          <span>{item.ean_code || t('catalogItems.notInformed')}</span>
        </div>
        
        <div className="flex items-start space-x-2 text-gray-600 dark:text-gray-400 p-2">
          <FileText size={14} className="min-w-[14px] mt-0.5" />
          <span className="line-clamp-2" title={item.item_description}>{item.item_description}</span>
        </div>
      </div>
    </div>
  );
};
