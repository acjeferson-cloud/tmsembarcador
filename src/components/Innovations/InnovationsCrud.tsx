import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Sparkles, Check, X } from 'lucide-react';
import { InnovationCrud, innovationsCrudService } from '../../services/innovationsCrudService';
import { InnovationForm } from './InnovationForm';
import { InnovationView } from './InnovationView';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useTranslation } from 'react-i18next';

export const InnovationsCrud: React.FC = () => {
  const { t } = useTranslation();
  const [innovations, setInnovations] = useState<InnovationCrud[]>([]);
  const [filteredInnovations, setFilteredInnovations] = useState<InnovationCrud[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedInnovation, setSelectedInnovation] = useState<InnovationCrud | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    loadInnovations();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredInnovations(innovations);
    } else {
      const filtered = innovations.filter(
        (innovation) =>
          innovation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          innovation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          innovation.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInnovations(filtered);
    }
  }, [searchTerm, innovations]);

  const loadInnovations = async () => {
    setIsLoading(true);
    try {
      const data = await innovationsCrudService.getAll();
      setInnovations(data);
      setFilteredInnovations(data);
    } catch (error) {
      setToast({ message: t('innovations.messages.loadError'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedInnovation(null);
    setShowForm(true);
  };

  const handleEdit = (innovation: InnovationCrud) => {
    setSelectedInnovation(innovation);
    setShowForm(true);
  };

  const handleView = (innovation: InnovationCrud) => {
    setSelectedInnovation(innovation);
    setShowView(true);
  };

  const handleDelete = (innovation: InnovationCrud) => {
    setConfirmDialog({
      isOpen: true,
      title: t('innovations.messages.deleteConfirmTitle'),
      message: t('innovations.messages.deleteConfirmText', { name: innovation.name }),
      onConfirm: async () => {
        try {
          await innovationsCrudService.delete(innovation.id);
          setToast({ message: t('innovations.messages.deleteSuccess'), type: 'success' });
          loadInnovations();
        } catch (error) {
          setToast({ message: t('innovations.messages.deleteError'), type: 'error' });
        }
      }
    });
  };

  const handleSave = async (innovationData: Omit<InnovationCrud, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (selectedInnovation) {
        await innovationsCrudService.update(selectedInnovation.id, innovationData);
        setToast({ message: t('innovations.messages.updateSuccess'), type: 'success' });
      } else {
        await innovationsCrudService.create(innovationData);
        setToast({ message: t('innovations.messages.createSuccess'), type: 'success' });
      }
      setShowForm(false);
      loadInnovations();
    } catch (error) {
      setToast({ message: t('innovations.messages.saveError'), type: 'error' });
    }
  };

  const formatPrice = (price: number): string => {
    return price.toFixed(2);
  };

  return (
    <div className="w-full">
      <div className="mb-6 px-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('innovations.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('innovations.subtitle')}
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t('innovations.buttons.new')}</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('innovations.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredInnovations.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm ? t('innovations.emptyResult.searchTitle') : t('innovations.emptyResult.emptyTitle')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm
              ? t('innovations.emptyResult.searchDesc')
              : t('innovations.emptyResult.emptyDesc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInnovations.map((innovation) => (
            <div
              key={innovation.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${innovation.is_active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Sparkles className={`w-6 h-6 ${innovation.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{innovation.name}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t(`innovations.categories.${innovation.category}`) || innovation.category}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleView(innovation)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                    title={t('innovations.buttons.view')}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(innovation)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                    title={t('innovations.buttons.edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(innovation)}
                    className="p-1 text-red-400 hover:text-red-600 rounded transition-colors"
                    title={t('innovations.buttons.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {innovation.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('innovations.card.startingAt')}</p>
                  <p className="text-lg font-bold text-blue-600">R$ {formatPrice(innovation.monthly_price)}{t('innovations.card.perMonthShort')}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {innovation.is_active ? (
                    <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <Check className="w-3 h-3" />
                      <span>{t('innovations.card.active')}</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      <X className="w-3 h-3" />
                      <span>{t('innovations.card.inactive')}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <InnovationForm
          innovation={selectedInnovation}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}

      {showView && selectedInnovation && (
        <InnovationView
          innovation={selectedInnovation}
          onClose={() => setShowView(false)}
          onEdit={() => {
            setShowView(false);
            handleEdit(selectedInnovation);
          }}
        />
      )}

      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={() => {
            confirmDialog.onConfirm();
            setConfirmDialog({ ...confirmDialog, isOpen: false });
          }}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
