import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Search, Plus, Filter, Download, Map } from 'lucide-react';
import { statesService, State } from '../../services/statesService';
import { StateCard } from './StateCard';
import { StateView } from './StateView';
import { StateForm } from './StateForm';
import { BrazilMap } from './BrazilMap';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { logCreate, logUpdate, logDelete } from '../../services/logsService';

export const States: React.FC = () => {
  const breadcrumbItems = [
    { label: 'Configurações' },
    { label: 'Estados', current: true }
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; stateId?: string }>({ isOpen: false });
  const itemsPerPage = 12;

  const regions = [
    'Todos',
    'Norte',
    'Nordeste',
    'Centro-Oeste',
    'Sudeste',
    'Sul'
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
      console.error('Erro ao carregar estados:', error);
      setToast({ message: 'Erro ao carregar estados.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStates = statesList.filter(state => {
    const matchesSearch = state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         state.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         state.capital.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         state.ibge_code.includes(searchTerm);
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

  const handleDeleteState = (stateId: string) => {
    setConfirmDialog({ isOpen: true, stateId });
  };

  const confirmDelete = async () => {
    if (confirmDialog.stateId) {
      const state = states.find(s => s.id === confirmDialog.stateId);
      const success = await statesService.delete(confirmDialog.stateId);
      if (success) {
        if (state) {
          await logDelete('state', confirmDialog.stateId, state, 1, 'Administrador');
        }
        setToast({ message: 'Estado excluído com sucesso!', type: 'success' });
        await loadStates();
      } else {
        setToast({ message: 'Erro ao excluir estado.', type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleSaveState = async (stateData: any) => {
    try {
      const normalizedData = {
        name: stateData.name,
        abbreviation: stateData.abbreviation,
        ibge_code: stateData.ibgeCode || stateData.ibge_code,
        capital: stateData.capital,
        region: stateData.region,
      };

      if (editingState) {
        const updated = await statesService.update(editingState.id, {
          ...normalizedData,
          updated_by: 'current-user-id'
        });
        if (updated) {
          await logUpdate('state', editingState.id, editingState, updated, 1, 'Administrador');
          setToast({ message: 'Estado atualizado com sucesso!', type: 'success' });
        } else {
          setToast({ message: 'Erro ao atualizar estado.', type: 'error' });
          return;
        }
      } else {
        const created = await statesService.create({
          ...normalizedData,
          created_by: 'current-user-id'
        });
        if (created) {
          await logCreate('state', created.id, created, 1, 'Administrador');
        }
        setToast({ message: 'Estado criado com sucesso!', type: 'success' });
      }

      setShowForm(false);
      setEditingState(null);
      await loadStates();
    } catch (error) {
      console.error('Error saving state:', error);
      setToast({ message: 'Erro ao salvar estado. Tente novamente.', type: 'error' });
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
      ['Nome', 'Sigla', 'Código IBGE', 'Capital', 'Região'].join(','),
      ...filteredStates.map(state => [
        state.name,
        state.abbreviation,
        state.ibge_code,
        state.capital,
        state.region
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
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estados do Brasil</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie o cadastro de estados brasileiros</p>
        </div>
        <button
          onClick={handleNewState}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Novo Estado</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Filter size={18} />
              <span>Lista</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'map'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Map size={18} />
              <span>Mapa</span>
            </div>
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
                  placeholder="Buscar por nome, sigla, capital ou código IBGE..."
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
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>

              <button
                onClick={handleExport}
                className="border border-gray-300 hover:bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Download size={18} />
                <span>Exportar</span>
              </button>
            </div>

            {/* Stats */}
            <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <span>Total: {filteredStates.length} estados</span>
              <span>Página {currentPage} de {totalPages}</span>
            </div>
          </div>

          {/* States Grid */}
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando estados...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayedStates.map((state) => (
                <StateCard
                  key={`${state.id}-${refreshKey}`}
                  state={state}
                  onView={handleViewState}
                  onEdit={handleEditState}
                  onDelete={handleDeleteState}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredStates.length)} de {filteredStates.length} estados
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
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
                    Próximo
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum estado encontrado</h3>
              <p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou cadastrar um novo estado.</p>
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
          title="Confirmar Exclusão"
          message="Tem certeza que deseja excluir este estado? Esta ação não pode ser desfeita."
          confirmText="Excluir"
          cancelText="Cancelar"
          type="danger"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDialog({ isOpen: false })}
        />
      )}
    </div>
  );
};
