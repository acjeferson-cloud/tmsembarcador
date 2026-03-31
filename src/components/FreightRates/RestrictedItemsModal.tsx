import React, { useState, useEffect } from 'react';
import { X, Plus, Search, Edit, Trash2, AlertTriangle, Save, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { restrictedItemsService, RestrictedItem } from '../../services/restrictedItemsService';
import { catalogItemsService, CatalogItem } from '../../services/catalogItemsService';
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

  // Hybrid Form State
  const [restrictionType, setRestrictionType] = useState<'family' | 'specific'>('family');
  
  // Specific Catalog Item Search
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [catalogSearchResults, setCatalogSearchResults] = useState<CatalogItem[]>([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);

  const [formData, setFormData] = useState({
    item_code: '',
    item_description: '',
    ncm_code: '',
    ean_code: ''
  });

  useEffect(() => {
    loadItems();
  }, [freightRateTableId]);

  // Catalog Search Debounce
  useEffect(() => {
    if (restrictionType !== 'specific' || !catalogSearchTerm || catalogSearchTerm.length < 2) {
      setCatalogSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCatalog(true);
      const results = await catalogItemsService.searchItems(catalogSearchTerm);
      setCatalogSearchResults(results);
      setIsSearchingCatalog(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [catalogSearchTerm, restrictionType]);

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
    setRestrictionType('family');
    setCatalogSearchTerm('');
    setSelectedCatalogItem(null);
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
    if (item.catalog_item_id) {
      setRestrictionType('specific');
      setSelectedCatalogItem(item.catalog_items || null);
      setCatalogSearchTerm(item.item_description || '');
    } else {
      setRestrictionType('family');
    }
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

  const selectCatalogItem = (item: CatalogItem) => {
    setSelectedCatalogItem(item);
    setCatalogSearchTerm(item.item_description);
    setCatalogSearchResults([]);
    setFormData({
      item_code: item.item_code,
      item_description: item.item_description,
      ncm_code: item.ncm_code || '',
      ean_code: item.ean_code || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (restrictionType === 'specific' && !selectedCatalogItem && !editingItem?.catalog_item_id) {
      setToast({ message: 'Selecione um item do catálogo para prosseguir.', type: 'error' });
      return;
    }

    if (formData.ncm_code && formData.ncm_code.length > 50) {
      setToast({ message: t('carriers.freightRates.restrictedItems.ncmMaxLength'), type: 'error' });
      return;
    }

    if (formData.ean_code && formData.ean_code.length > 50) {
      setToast({ message: t('carriers.freightRates.restrictedItems.eanMaxLength'), type: 'error' });
      return;
    }

    const itemData: RestrictedItem = {
      freight_rate_table_id: freightRateTableId,
      item_code: formData.item_code,
      item_description: formData.item_description,
      ncm_code: formData.ncm_code || undefined,
      ean_code: formData.ean_code || undefined,
      catalog_item_id: restrictionType === 'specific' ? selectedCatalogItem?.id : undefined
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
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
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
                            Tipo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('carriers.freightRates.restrictedItems.ncm')}
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
                              {item.catalog_item_id ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                  Item Específico
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                  Família (NCM Livre)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm text-gray-600 dark:text-gray-400">{item.ncm_code || '-'}</span>
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
                        Os itens listados aqui farão com que esta transportadora NÃO seja utilizada no motor de cálculo.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mb-6">
                   <button
                     type="button"
                     onClick={() => setRestrictionType('family')}
                     className={`flex-1 py-3 px-4 rounded-lg flex flex-col items-center justify-center border-2 transition-colors ${restrictionType === 'family' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                   >
                      <span className="font-semibold text-gray-900">Por Família (NCM Livre)</span>
                      <span className="text-xs text-gray-500 text-center mt-1">Bloquear todos os itens preenchendo o NCM.</span>
                   </button>
                   <button
                     type="button"
                     onClick={() => setRestrictionType('specific')}
                     className={`flex-1 py-3 px-4 rounded-lg flex flex-col items-center justify-center border-2 transition-colors ${restrictionType === 'specific' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                   >
                      <span className="font-semibold text-gray-900 flex items-center gap-1"><Tag className="w-4 h-4" /> Item Específico</span>
                      <span className="text-xs text-gray-500 text-center mt-1">Busque no catálogo para bloquear exato.</span>
                   </button>
                </div>

                {restrictionType === 'specific' && (
                  <div className="mb-6 bg-white border border-gray-300 rounded-lg p-4 shadow-sm relative z-20">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar Item no Catálogo
                    </label>
                    <div className="relative">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500">
                         <div className="pl-3 py-2 bg-gray-50 border-r border-gray-300">
                           <Search className="w-5 h-5 text-gray-400" />
                         </div>
                         <input
                           type="text"
                           value={catalogSearchTerm}
                           onChange={(e) => {
                             setCatalogSearchTerm(e.target.value);
                             setSelectedCatalogItem(null);
                           }}
                           placeholder="Digite a descrição, EAN ou código para buscar..."
                           className="flex-1 py-2 px-3 focus:outline-none bg-white"
                         />
                      </div>
                      
                      {isSearchingCatalog && (
                        <div className="absolute left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-30">
                          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Buscando...</span>
                          </div>
                        </div>
                      )}

                      {catalogSearchResults.length > 0 && (
                        <div className="absolute left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-30 max-h-60 overflow-y-auto">
                          {catalogSearchResults.map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => selectCatalogItem(item)}
                              className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-orange-50 transition-colors last:border-0"
                            >
                              <div className="font-medium text-gray-900">{item.item_description}</div>
                              <div className="text-xs text-gray-500 mt-1 flex gap-3">
                                <span><strong className="text-gray-700">Ref:</strong> {item.item_code}</span>
                                {item.ean_code && <span><strong className="text-gray-700">EAN:</strong> {item.ean_code}</span>}
                                {item.ncm_code && <span><strong className="text-gray-700">NCM:</strong> {item.ncm_code}</span>}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('carriers.freightRates.restrictedItems.itemCode')}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      disabled={restrictionType === 'specific'}
                      value={formData.item_code}
                      onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder={restrictionType === 'family' ? "Ex: BLOQ-NCM" : ""}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('carriers.freightRates.restrictedItems.codeHelp')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       {restrictionType === 'family' ? 'NCM (Obrigatório para Família)' : 'NCM Code'}
                    </label>
                    <input
                      type="text"
                      required={restrictionType === 'family'}
                      maxLength={50}
                      disabled={restrictionType === 'specific'}
                      value={formData.ncm_code}
                      onChange={(e) => setFormData({ ...formData, ncm_code: e.target.value.replace(/[^0-9.]/g, '') })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="Ex: 12345678"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Este NCM bloqueará as notas com qualquer correspondência.</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('carriers.freightRates.restrictedItems.itemDescription')}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      disabled={restrictionType === 'specific'}
                      value={formData.item_description}
                      onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder={restrictionType === 'family' ? "Ex: Restrição Família NCM X" : ""}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('carriers.freightRates.restrictedItems.descriptionHelp')}</p>
                  </div>

                  {restrictionType === 'specific' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('carriers.freightRates.restrictedItems.eanCode')}
                      </label>
                      <input
                        type="text"
                        disabled
                        value={formData.ean_code}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-100 text-gray-500"
                      />
                    </div>
                  )}
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
