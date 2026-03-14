import React, { useState, useEffect } from 'react';
import { X, Plus, Search, Edit, Trash2, AlertTriangle, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { restrictedItemsService, RestrictedItem } from '../../services/restrictedItemsService';
import { Toast } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface RestrictedItemsModalProps {
  freightRateTableId: string;
  freightRateTableName: string;
  onClose: () => void;
}

const RestrictedItemsModal: React.FC<RestrictedItemsModalProps> = ({
  freightRateTableId,
  freightRateTableName,
  onClose
}) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<RestrictedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<RestrictedItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; itemId?: string }>({ isOpen: false });

  const [formData, setFormData] = useState({
    item_code: '',
    item_description: '',
    ncm_code: '',
    ean_code: ''
  });

  useEffect(() => {
    loadItems();
  }, [freightRateTableId]);

  const loadItems = async () => {
    setLoading(true);
    const data = await restrictedItemsService.getByFreightRateTableId(freightRateTableId);
    setItems(data);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadItems();
      return;
    }
    setLoading(true);
    const data = await restrictedItemsService.search(freightRateTableId, searchTerm);
    setItems(data);
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      item_code: '',
      item_description: '',
      ncm_code: '',
      ean_code: ''
    });
    setShowForm(true);
  };

  const handleEdit = (item: RestrictedItem) => {
    setEditingItem(item);
    setFormData({
      item_code: item.item_code,
      item_description: item.item_description,
      ncm_code: item.ncm_code || '',
      ean_code: item.ean_code || ''
    });
    setShowForm(true);
  };

  const handleDelete = (itemId: string) => {
    setConfirmDialog({ isOpen: true, itemId });
  };

  const confirmDelete = async () => {
    if (confirmDialog.itemId) {
      const result = await restrictedItemsService.delete(confirmDialog.itemId);
      if (result.success) {
        await loadItems();
        setToast({ message: t('carriers.freightRates.restrictedItems.deleteSuccess'), type: 'success' });
      } else {
        setToast({ message: result.error || t('carriers.freightRates.restrictedItems.deleteError'), type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.ncm_code && formData.ncm_code.length > 50) {
      setToast({ message: t('carriers.freightRates.restrictedItems.ncmMaxLength'), type: 'error' });
      return;
    }

    if (formData.ean_code && formData.ean_code.length > 50) {
      setToast({ message: t('carriers.freightRates.restrictedItems.eanMaxLength'), type: 'error' });
      return;
    }

    if (formData.ncm_code && !/^[0-9.]+$/.test(formData.ncm_code)) {
      setToast({ message: t('carriers.freightRates.restrictedItems.ncmFormat'), type: 'error' });
      return;
    }

    if (formData.ean_code && !/^[0-9.]+$/.test(formData.ean_code)) {
      setToast({ message: t('carriers.freightRates.restrictedItems.eanFormat'), type: 'error' });
      return;
    }

    const itemData: RestrictedItem = {
      freight_rate_table_id: freightRateTableId,
      item_code: formData.item_code,
      item_description: formData.item_description,
      ncm_code: formData.ncm_code || undefined,
      ean_code: formData.ean_code || undefined
    };

    if (editingItem?.id) {
      const result = await restrictedItemsService.update(editingItem.id, itemData);
      if (result.success) {
        await loadItems();
        setToast({ message: t('carriers.freightRates.restrictedItems.updateSuccess'), type: 'success' });
        setShowForm(false);
      } else {
        setToast({ message: result.error || t('carriers.freightRates.restrictedItems.updateError'), type: 'error' });
      }
    } else {
      const result = await restrictedItemsService.create(itemData);
      if (result.success) {
        await loadItems();
        setToast({ message: t('carriers.freightRates.restrictedItems.saveSuccess'), type: 'success' });
        setShowForm(false);
      } else {
        setToast({ message: result.error || t('carriers.freightRates.restrictedItems.saveError'), type: 'error' });
      }
    }
  };

  const filteredItems = items;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('carriers.freightRates.restrictedItems.title')}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{freightRateTableName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!showForm ? (
              <>
                {/* Filters and Actions */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder={t('carriers.freightRates.restrictedItems.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSearch}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Search className="w-4 h-4" />
                      {t('carriers.freightRates.restrictedItems.search')}
                    </button>
                  </div>
                  <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {t('carriers.freightRates.restrictedItems.addItem')}
                  </button>
                </div>

                {/* Items List */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">{t('carriers.freightRates.restrictedItems.loading')}</p>
                  </div>
                ) : filteredItems.length > 0 ? (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('carriers.freightRates.restrictedItems.code')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('carriers.freightRates.restrictedItems.description')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('carriers.freightRates.restrictedItems.ncm')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('carriers.freightRates.restrictedItems.ean')}
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('carriers.freightRates.restrictedItems.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                        {filteredItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50 dark:bg-gray-900">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{item.item_code}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-900 dark:text-white">{item.item_description}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm text-gray-600 dark:text-gray-400">{item.ncm_code || '-'}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm text-gray-600 dark:text-gray-400">{item.ean_code || '-'}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title={t('carriers.freightRates.restrictedItems.edit')}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id!)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title={t('carriers.freightRates.restrictedItems.delete')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">{t('carriers.freightRates.restrictedItems.noItemsRegistered')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {t('carriers.freightRates.restrictedItems.addItemsThatCannotBeTransported')}
                    </p>
                    <button
                      onClick={handleAdd}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg inline-flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {t('carriers.freightRates.restrictedItems.addFirstItem')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-orange-900 mb-1">
                        {t('carriers.freightRates.restrictedItems.attentionRestrictedItem')}
                      </h3>
                      <p className="text-sm text-orange-700">
                        {t('carriers.freightRates.restrictedItems.itemsCannotBeTransported')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('carriers.freightRates.restrictedItems.itemCode')}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      value={formData.item_code}
                      onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ex: PROD-12345"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('carriers.freightRates.restrictedItems.codeHelp')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('carriers.freightRates.restrictedItems.ncmCode')}
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={formData.ncm_code}
                      onChange={(e) => setFormData({ ...formData, ncm_code: e.target.value.replace(/[^0-9.]/g, '') })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ex: 1234.56.78"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('carriers.freightRates.restrictedItems.ncmHelp')}</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('carriers.freightRates.restrictedItems.itemDescription')}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={formData.item_description}
                      onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ex: Produto inflamável"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('carriers.freightRates.restrictedItems.descriptionHelp')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('carriers.freightRates.restrictedItems.eanCode')}
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={formData.ean_code}
                      onChange={(e) => setFormData({ ...formData, ean_code: e.target.value.replace(/[^0-9.]/g, '') })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ex: 7891234567890"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('carriers.freightRates.restrictedItems.eanHelp')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                  >
                    {t('carriers.freightRates.restrictedItems.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingItem ? t('carriers.freightRates.restrictedItems.update') : t('carriers.freightRates.restrictedItems.save')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer Info */}
          {!showForm && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>{t('carriers.freightRates.restrictedItems.totalItems')}</strong> {items.length}
              </p>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={t('carriers.freightRates.restrictedItems.confirmDeleteTitle')}
        message={t('carriers.freightRates.restrictedItems.confirmDeleteMessage')}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false })}
      />
    </>
  );
};

export default RestrictedItemsModal;
