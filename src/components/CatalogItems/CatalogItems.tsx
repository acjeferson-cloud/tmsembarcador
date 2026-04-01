import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Filter, Download, Hash, Tag } from 'lucide-react';
import { catalogItemsService, CatalogItem } from '../../services/catalogItemsService';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CatalogItemCard } from './CatalogItemCard';
import { CatalogItemForm } from './CatalogItemForm';
import { CatalogItemView } from './CatalogItemView';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { useTranslation } from 'react-i18next';

export const CatalogItems: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  // View States
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [viewingItem, setViewingItem] = useState<CatalogItem | null>(null);
  
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; itemId?: string }>({ isOpen: false });

  // Mock stats
  const [stats, setStats] = useState({
    total: 0,
    withNcm: 0,
    withEan: 0
  });

  const breadcrumbItems = [
    { label: t('catalogItems.breadcrumbConfig') },
    { label: t('catalogItems.title'), current: true }
  ];

  useEffect(() => {
    loadItems();
  }, [page]);

  const calculateStats = (data: CatalogItem[], total: number) => {
    // Estimativa simges das estatisticas na página atual
    const withNcm = data.filter(i => !!i.ncm_code).length;
    const withEan = data.filter(i => !!i.ean_code).length;
    setStats({
      total: total,
      withNcm: Math.round((withNcm / (data.length || 1)) * total),
      withEan: Math.round((withEan / (data.length || 1)) * total)
    });
  };

  const loadItems = async (search = searchTerm) => {
    setLoading(true);
    try {
      const { data, count } = await catalogItemsService.getItems(search, page, pageSize);
      setItems(data);
      setTotalCount(count);
      calculateStats(data, count);
    } catch (error) {
      setToast({ message: t('catalogItems.errorLoad'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const forceRefresh = () => {
    setPage(1);
    loadItems(searchTerm);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    forceRefresh();
  };

  const handleNew = () => {
    setEditingItem(null);
    setShowForm(true);
    setShowView(false);
  };

  const handleEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setShowForm(true);
    setShowView(false);
  };

  const handleView = (item: CatalogItem) => {
    setViewingItem(item);
    setShowView(true);
    setShowForm(false);
  };

  const handleDelete = (itemId: string) => {
    setConfirmDialog({ isOpen: true, itemId });
  };

  const confirmDelete = async () => {
    if (confirmDialog.itemId) {
      const result = await catalogItemsService.deleteItem(confirmDialog.itemId);
      if (result.success) {
        setToast({ message: t('catalogItems.successDelete'), type: 'success' });
        loadItems();
      } else {
        setToast({ message: result.error || t('catalogItems.errorDelete'), type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleSave = async (itemData: CatalogItem) => {
    if (editingItem?.id) {
      const result = await catalogItemsService.updateItem(editingItem.id, itemData);
      if (result.error) {
        setToast({ message: result.error, type: 'error' });
        return;
      }
      setToast({ message: t('catalogItems.successUpdate'), type: 'success' });
    } else {
      const result = await catalogItemsService.createItem(itemData);
      if (result.error) {
        setToast({ message: result.error, type: 'error' });
        return;
      }
      setToast({ message: t('catalogItems.successSave'), type: 'success' });
    }
    setShowForm(false);
    forceRefresh();
  };

  const handleBackToList = () => {
    setShowForm(false);
    setShowView(false);
    setEditingItem(null);
    setViewingItem(null);
  };

  const handleExport = () => {
    const csvContent = [
      ['Código Interno', 'Descrição', 'EAN/GTIN', 'NCM'].join(','),
      ...items.map(item => [
        item.item_code,
        `"${item.item_description.replace(/"/g, '""')}"`,
        item.ean_code || '',
        item.ncm_code || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalogo_itens.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (page - 1) * pageSize;

  if (showForm) {
    return (
      <div className="p-6">
        <Breadcrumbs items={[...breadcrumbItems, { label: editingItem ? t('catalogItems.editItem') : t('catalogItems.newItem'), current: true }]} />
        <div className="mt-6">
          <CatalogItemForm
            onBack={handleBackToList}
            onSave={handleSave}
            item={editingItem}
          />
        </div>
      </div>
    );
  }

  if (showView && viewingItem) {
    return (
      <div className="p-6">
        <Breadcrumbs items={[...breadcrumbItems, { label: t('catalogItems.viewItem'), current: true }]} />
        <div className="mt-6">
          <CatalogItemView
            item={viewingItem}
            onBack={handleBackToList}
            onEdit={() => handleEdit(viewingItem)}
            isAdmin={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Package className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            {t('catalogItems.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('catalogItems.subtitle')}
          </p>
        </div>
        <button
          onClick={handleNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>{t('catalogItems.newItem')}</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('catalogItems.totalItems')}</p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">{stats.total}</p>
            </div>
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
              <Package size={28} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('catalogItems.itemsWithNcm')}</p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">{stats.withNcm}</p>
            </div>
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
              <Tag size={28} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('catalogItems.itemsWithEan')}</p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">{stats.withEan}</p>
            </div>
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
              <Hash size={28} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('catalogItems.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
            />
          </div>
          
          <button 
            type="submit"
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {t('catalogItems.search')}
          </button>
          
          <button 
            type="button"
            onClick={handleExport}
            className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-gray-700 dark:text-gray-300"
          >
            <Download size={18} />
            <span className="hidden sm:inline">{t('catalogItems.export')}</span>
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{t('catalogItems.showing')} {totalCount === 0 ? 0 : startIndex + 1} {t('catalogItems.to')} {Math.min(startIndex + pageSize, totalCount)} {t('catalogItems.of')} {totalCount} {t('catalogItems.records')}</span>
          <span>{t('catalogItems.page')} {page} {t('catalogItems.of')} {totalPages || 1}</span>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4 bg-gray-50 dark:bg-gray-900/50 rounded-full flex items-center justify-center">
            <Package size={32} />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{t('catalogItems.noResultsTitle')}</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {t('catalogItems.noResultsDesc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((item) => (
            <CatalogItemCard
              key={item.id}
              item={item}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isAdmin={true}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('catalogItems.page')} {page} {t('catalogItems.of')} {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white"
              >
                {t('catalogItems.previous')}
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                if (p > totalPages) return null;
                
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-sm rounded transition-colors ${
                      page === p
                        ? 'bg-blue-600 text-white font-medium shadow-sm'
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white"
              >
                {t('catalogItems.next')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box Bottom */}
      {!loading && items.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 text-blue-500/10">
            <Package size={140} />
          </div>
          <div className="relative">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              {t('catalogItems.infoDynamicTitle')}
            </h3>
            <p className="text-blue-800 dark:text-blue-200/80 mb-4 max-w-4xl text-sm leading-relaxed">
              {t('catalogItems.infoDynamicDesc')}
            </p>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={t('catalogItems.deleteTitle')}
        message={t('catalogItems.deleteMsg')}
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false })}
      />
    </div>
  );
};
