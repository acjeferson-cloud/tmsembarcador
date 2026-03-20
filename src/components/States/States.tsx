import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Search, Plus, List, Download, Map } from 'lucide-react';
import { statesService, State } from '../../services/statesService';
import { StateCard } from './StateCard';
import { StateView } from './StateView';
import { StateForm } from './StateForm';
import { BrazilMap } from './BrazilMap';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { logCreate, logUpdate, logDelete } from '../../services/logsService';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useInnovation, INNOVATION_IDS } from '../../hooks/useInnovation';

export const States: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.email === 'jeferson.costa@logaxis.com.br';
  const breadcrumbItems = [
    { label: t('menu.settings', 'Configurações') },
    { label: t('states.title'), current: true }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('Todos');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingState, setEditingState] = useState<any>(null);
  const [viewingState, setViewingState] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const [statesList, setStatesList] = useState<State[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; stateId?: string }>({ isOpen: false });
  const itemsPerPage = 12;

  const regions = [
    { value: 'Todos', label: t('states.filters.all_regions') },
    { value: 'Norte', label: t('states.regions.norte') },
    { value: 'Nordeste', label: t('states.regions.nordeste') },
    { value: 'Centro-Oeste', label: t('states.regions.centro_oeste') },
    { value: 'Sudeste', label: t('states.regions.sudeste') },
    { value: 'Sul', label: t('states.regions.sul') }
  ];

  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    try {
      setIsLoading(true);
      const data = await statesService.getAll();
      setStatesList(data);
    } catch (error) {
      setToast({ message: t('states.messages.load_error'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStates = statesList.filter(state => {
    const matchesSearch = state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         state.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         state.capital?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         state.ibge_code?.includes(searchTerm);
    const matchesRegion = regionFilter === 'Todos' || state.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  const totalPages = Math.ceil(filteredStates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedStates = filteredStates.slice(startIndex, startIndex + itemsPerPage);

  const handleNewState = () => {
    setEditingState(null);
    setShowForm(true);
  };

  const handleEditState = (state: any) => {
    setEditingState(state);
    setShowForm(true);
  };

  const handleViewState = (state: any) => {
    setViewingState(state);
    setShowView(true);
  };

  const handleDeleteState = (stateId: string | number) => {
    setConfirmDialog({ isOpen: true, stateId: String(stateId) });
  };

  const confirmDelete = async () => {
    if (confirmDialog.stateId) {
      const state = statesList.find(s => String(s.id) === String(confirmDialog.stateId));
      const success = await statesService.delete(confirmDialog.stateId);
      if (success) {
        if (state) {
          await logDelete('state', confirmDialog.stateId, state, 1, 'Administrador');
        }
        setToast({ message: t('states.messages.delete_success'), type: 'success' });
        await loadStates();
      } else {
        setToast({ message: t('states.messages.delete_error'), type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleSaveState = async (stateData: any) => {
    try {
      const normalizedData = {
        name: stateData.name,
        abbreviation: stateData.abbreviation,
        ibge_code: stateData.ibge_code,
        capital: stateData.capital,
        region: stateData.region,
        bandeira_url: stateData.bandeira_url,
        nome: stateData.name,
        sigla: stateData.abbreviation,
        codigo: stateData.ibge_code
      };

      if (editingState) {
        const updated = await statesService.update(editingState.id, {
          ...normalizedData
        });
        if (updated) {
          await logUpdate('state', editingState.id, editingState, updated, 1, 'Administrador');
          setToast({ message: t('states.messages.update_success'), type: 'success' });
        } else {
          setToast({ message: t('states.messages.update_error'), type: 'error' });
          return;
        }
      } else {
        const created = await statesService.create({
          ...normalizedData
        });
        if (created) {
          await logCreate('state', created.id, created, 1, 'Administrador');
        }
        setToast({ message: t('states.messages.create_success'), type: 'success' });
      }

      setShowForm(false);
      setEditingState(null);
      await loadStates();
    } catch (error) {
      setToast({ message: t('states.messages.create_error'), type: 'error' });
    }
  };

  const handleBackToList = () => {
    setShowForm(false);
    setShowView(false);
    setEditingState(null);
    setViewingState(null);
  };

  const handleExport = () => {
    const csvContent = [
      [t('states.fields.name'), t('states.fields.abbreviation'), t('states.fields.ibge_code'), t('states.fields.capital'), t('states.fields.region')].join(','),
      ...filteredStates.map(state => [
        state.name || '',
        state.abbreviation || '',
        state.ibge_code || '',
        state.capital || '',
        state.region || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estados.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (showForm) {
    return (
      <StateForm
        onBack={handleBackToList}
        onSave={handleSaveState}
        state={editingState}
      />
    );
  }

  if (showView) {
    return (
      <StateView
        onBack={handleBackToList}
        onEdit={() => {
          setShowView(false);
          handleEditState(viewingState);
        }}
        state={viewingState}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('states.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('states.subtitle')}</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleNewState}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>{t('states.new_state')}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'list'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4" />
            {t('states.tabs.list')}
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'map'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Map className="w-4 h-4" />
            {t('states.tabs.map')}
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={t('states.filters.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>

              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {regions.map(region => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleExport}
                className="border border-gray-300 hover:bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Download size={18} />
                <span>{t('states.filters.export')}</span>
              </button>
            </div>

            {/* Stats */}
            <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <span>{t('states.list.total', { count: filteredStates.length })}</span>
              <span>{t('states.list.page_info', { current: currentPage, total: totalPages })}</span>
            </div>
          </div>

          {/* States Grid */}
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">{t('states.list.loading')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayedStates.map((state) => (
                <StateCard
                  key={state.id}
                  state={state}
                  onView={handleViewState}
                  onEdit={handleEditState}
                  onDelete={handleDeleteState}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('states.list.showing', { start: startIndex + 1, end: Math.min(startIndex + itemsPerPage, filteredStates.length), total: filteredStates.length })}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('states.list.previous')}
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (page > totalPages) return null;

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 text-sm rounded transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('states.list.next')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {filteredStates.length === 0 && !isLoading && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('states.list.empty_title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('states.list.empty_subtitle')}</p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <BrazilMap
            states={statesList}
            onStateClick={handleViewState}
          />
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={t('states.dialogs.delete_title')}
          message={t('states.dialogs.delete_message')}
          confirmText={t('states.dialogs.delete_confirm')}
          cancelText={t('states.dialogs.delete_cancel')}
          type="danger"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDialog({ isOpen: false })}
        />
      )}
    </div>
  );
};
