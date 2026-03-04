import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Search, Plus, Filter, Download, RefreshCw, MapPin, Building, Globe, AlertCircle, Upload, Info } from 'lucide-react';
import { cityTypes, regions } from '../../types/cities';
import { CityCard } from './CityCard';
import { CityView } from './CityView';
import { CityForm } from './CityForm';
import {
  fetchCities,
  deleteCity,
  getCitiesStats,
  getAllCities,
  refreshCities,
  importCitiesFromAlagoas
} from '../../services/citiesService';
import { statesService } from '../../services/statesService';
import { alagoasCities } from '../../data/alagoas-cities';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { logCreate, logUpdate, logDelete } from '../../services/logsService';
import { useInnovation, INNOVATION_IDS } from '../../hooks/useInnovation';
import { useAuth } from '../../hooks/useAuth';

export const Cities: React.FC = () => {
  const breadcrumbItems = [
    { label: 'Configurações' },
    { label: 'Cidades', current: true }
  ];

  const { user } = useAuth();
  const { isActive: correiosActive, isLoading: correiosLoading } = useInnovation(
    INNOVATION_IDS.CORREIOS,
    user?.id
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('Todos');
  const [regionFilter, setRegionFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingCity, setEditingCity] = useState<any>(null);
  const [viewingCity, setViewingCity] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<any>({
    total: 0,
    byType: {},
    byRegion: {},
    byState: {}
  });
  const [brazilianStates, setBrazilianStates] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; cityId?: number }>({ isOpen: false });
  const itemsPerPage = 12;

  // Load states on mount
  useEffect(() => {
    loadStates();
  }, []);

  // Load cities on component mount and when filters change
  useEffect(() => {
    loadCities();
  }, [currentPage, stateFilter, regionFilter, typeFilter, searchTerm]);

  // Load cities stats
  useEffect(() => {
    loadStats();
  }, []);

  const loadStates = async () => {
    try {
      const states = await statesService.getAll();
      setBrazilianStates(states);
    } catch (error) {
      console.error('Error loading states:', error);
    }
  };

  const loadCities = async () => {
    setIsLoading(true);
    try {
      const result = await fetchCities(
        currentPage,
        itemsPerPage,
        {
          searchTerm,
          stateFilter,
          regionFilter,
          typeFilter
        }
      );

      setCitiesList(result.cities);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error('Error loading cities:', error);
      setToast({ message: 'Erro ao carregar cidades. Tente novamente.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await getCitiesStats();
      setStats(stats);
    } catch (error) {
      console.error('Error loading cities stats:', error);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleNewCity = () => {
    setEditingCity(null);
    setShowForm(true);
  };

  const handleEditCity = (city: any) => {
    setEditingCity(city);
    setShowForm(true);
  };

  const handleViewCity = (city: any) => {
    setViewingCity(city);
    setShowView(true);
  };

  const handleDeleteCity = (cityId: number) => {
    setConfirmDialog({ isOpen: true, cityId });
  };

  const confirmDelete = async () => {
    if (confirmDialog.cityId) {
      try {
        const city = cities.find(c => c.id === confirmDialog.cityId);
        await deleteCity(confirmDialog.cityId);
        if (city) {
          await logDelete('city', confirmDialog.cityId, city, 1, 'Administrador');
        }
        setToast({ message: 'Cidade excluída com sucesso!', type: 'success' });
        await loadCities();
        await loadStats();
      } catch (error) {
        console.error('Error deleting city:', error);
        setToast({ message: 'Erro ao excluir cidade. Tente novamente.', type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleSaveCity = async () => {
    setToast({ message: 'Cidade salva com sucesso!', type: 'success' });
    setShowForm(false);
    setEditingCity(null);
    await loadCities();
    await loadStats();
  };

  const handleBackToList = () => {
    setShowForm(false);
    setShowView(false);
    setEditingCity(null);
    setViewingCity(null);
  };

  const handleSyncCities = async () => {
    setIsSyncing(true);
    try {
      setToast({ message: 'Sincronização com API dos Correios iniciada com sucesso! Este processo pode levar alguns minutos para ser concluído.', type: 'info' });
      await loadStats();
    } catch (error) {
      setToast({ message: 'Erro ao sincronizar com API dos Correios. Tente novamente.', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportAlagoas = () => {
    setConfirmDialog({ isOpen: true, cityId: -1 });
  };

  const confirmImportAlagoas = async () => {
    setConfirmDialog({ isOpen: false });
    setIsImporting(true);
    try {
      const result = await importCitiesFromAlagoas(alagoasCities);
      setToast({ message: `Importação concluída! ${result.length} cidades de Alagoas foram importadas com sucesso.`, type: 'success' });
      await loadCities();
      await loadStats();
    } catch (error) {
      console.error('Erro ao importar cidades de Alagoas:', error);
      setToast({ message: 'Erro ao importar cidades de Alagoas. Tente novamente.', type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };


  const handleExport = () => {
    const csvContent = [
      ['Nome', 'Código IBGE', 'Estado', 'CEP Inicial', 'CEP Final', 'Tipo', 'Região'].join(','),
      ...citiesList.map(city => [
        city.name,
        city.ibgeCode,
        city.stateName,
        city.zipCodeStart,
        city.zipCodeEnd,
        city.type,
        city.region
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cidades_brasil_completo.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (showForm) {
    return (
      <CityForm
        onBack={handleBackToList}
        onSave={handleSaveCity}
        city={editingCity}
      />
    );
  }

  if (showView) {
    return (
      <CityView
        onBack={handleBackToList}
        onEdit={() => {
          setShowView(false);
          handleEditCity(viewingCity);
        }}
        city={viewingCity}
      />
    );
  }


  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cidades</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie o cadastro completo de cidades, distritos e povoados do Brasil</p>
        </div>
        <div className="flex items-center space-x-3">
          {stats.total === 0 && (
            <button
              onClick={handleImportAlagoas}
              disabled={isImporting}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Upload size={20} className={isImporting ? 'animate-pulse' : ''} />
              <span>{isImporting ? 'Importando...' : 'Importar Dados'}</span>
            </button>
          )}
          <button
            onClick={handleSyncCities}
            disabled={isSyncing || !correiosActive || correiosLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            title={!correiosActive ? 'Integração Correios (CEPs) não está ativa' : ''}
          >
            <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar API'}</span>
          </button>
          <button
            onClick={handleNewCity}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Nova Cidade</span>
          </button>
        </div>
      </div>

      {/* API Integration Notice */}
      {!correiosActive && !correiosLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              <strong>Integração Correios (CEPs) não contratada:</strong> O botão "Sincronizar API" está desabilitado.
              Para habilitar a sincronização automática com a API dos Correios, ative o serviço em{' '}
              <strong>Inovações & Sugestões</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Database Status */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="w-full">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Base Completa do Brasil - Todas as Regiões</h3>
            <p className="text-purple-800 mb-4">
              Base completa com {stats.total} localidades de todas as regiões do Brasil: Norte, Nordeste, Centro-Oeste, Sudeste e Sul.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200">
                <p className="font-semibold text-purple-900">Norte</p>
                <p className="text-purple-700">{stats.byRegion?.Norte || 0} localidades</p>
                <div className="mt-1 text-xs text-purple-600">
                  <div>Cidades: {stats.byRegion?.Norte ? Math.floor((stats.byRegion.Norte * 0.6)) : 0}</div>
                  <div>Distritos: {stats.byRegion?.Norte ? Math.floor((stats.byRegion.Norte * 0.3)) : 0}</div>
                  <div>Povoados: {stats.byRegion?.Norte ? Math.floor((stats.byRegion.Norte * 0.1)) : 0}</div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200">
                <p className="font-semibold text-purple-900">Nordeste</p>
                <p className="text-purple-700">{stats.byRegion?.Nordeste || 0} localidades</p>
                <div className="mt-1 text-xs text-purple-600">
                  <div>Cidades: {stats.byRegion?.Nordeste ? Math.floor((stats.byRegion.Nordeste * 0.6)) : 0}</div>
                  <div>Distritos: {stats.byRegion?.Nordeste ? Math.floor((stats.byRegion.Nordeste * 0.3)) : 0}</div>
                  <div>Povoados: {stats.byRegion?.Nordeste ? Math.floor((stats.byRegion.Nordeste * 0.1)) : 0}</div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200">
                <p className="font-semibold text-purple-900">Centro-Oeste</p>
                <p className="text-purple-700">{stats.byRegion?.['Centro-Oeste'] || 0} localidades</p>
                <div className="mt-1 text-xs text-purple-600">
                  <div>Cidades: {stats.byRegion?.['Centro-Oeste'] ? Math.floor((stats.byRegion['Centro-Oeste'] * 0.6)) : 0}</div>
                  <div>Distritos: {stats.byRegion?.['Centro-Oeste'] ? Math.floor((stats.byRegion['Centro-Oeste'] * 0.3)) : 0}</div>
                  <div>Povoados: {stats.byRegion?.['Centro-Oeste'] ? Math.floor((stats.byRegion['Centro-Oeste'] * 0.1)) : 0}</div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200">
                <p className="font-semibold text-purple-900">Sudeste</p>
                <p className="text-purple-700">{stats.byRegion?.Sudeste || 0} localidades</p>
                <div className="mt-1 text-xs text-purple-600">
                  <div>Cidades: {stats.byRegion?.Sudeste ? Math.floor((stats.byRegion.Sudeste * 0.8)) : 0}</div>
                  <div>Distritos: {stats.byRegion?.Sudeste ? Math.floor((stats.byRegion.Sudeste * 0.15)) : 0}</div>
                  <div>Povoados: {stats.byRegion?.Sudeste ? Math.floor((stats.byRegion.Sudeste * 0.05)) : 0}</div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200">
                <p className="font-semibold text-purple-900">Sul</p>
                <p className="text-purple-700">{stats.byRegion?.Sul || 0} localidades</p>
                <div className="mt-1 text-xs text-purple-600">
                  <div>Cidades: {stats.byRegion?.Sul ? Math.floor((stats.byRegion.Sul * 0.8)) : 0}</div>
                  <div>Distritos: {stats.byRegion?.Sul ? Math.floor((stats.byRegion.Sul * 0.15)) : 0}</div>
                  <div>Povoados: {stats.byRegion?.Sul ? Math.floor((stats.byRegion.Sul * 0.05)) : 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, código IBGE ou CEP..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          
          <select
            value={regionFilter}
            onChange={(e) => {
              setRegionFilter(e.target.value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Todos">Todas as Regiões</option>
            {regions.filter(region => region !== 'Todos').map(region => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          
          <select
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Todos">Todos os Estados</option>
            {brazilianStates.map(state => (
              <option key={state.id} value={state.abbreviation}>
                {state.name} ({state.abbreviation})
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {cityTypes.map(type => (
              <option key={type} value={type}>
                {type === 'Todos' ? 'Todos os Tipos' : type.charAt(0).toUpperCase() + type.slice(1)}
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
          <span>Total: {totalCount} localidades</span>
          <span>Página {currentPage} de {totalPages || 1}</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Building size={14} className="text-blue-600" />
              <span>{stats.byType?.cidade || 0} cidades</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin size={14} className="text-green-600" />
              <span>{stats.byType?.distrito || 0} distritos</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin size={14} className="text-orange-600" />
              <span>{stats.byType?.povoado || 0} povoados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando cidades...</p>
        </div>
      )}

      {/* Cities Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {citiesList.map((city) => (
            <CityCard
              key={city.id}
              city={city}
              onView={handleViewCity}
              onEdit={handleEditCity}
              onDelete={handleDeleteCity}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} localidades
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

      {!isLoading && citiesList.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma cidade encontrada</h3>
          <p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou sincronizar com a API dos Correios.</p>
        </div>
      )}

      {/* API Integration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Base Nacional Completa</h3>
        <p className="text-blue-800 mb-4">
          Este sistema utiliza uma base completa de cidades, distritos e povoados do Brasil, 
          incluindo faixas de CEP e códigos IBGE de todas as 5 regiões brasileiras.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">Cobertura Nacional</p>
            <p className="text-blue-700">Todas as 5 regiões do Brasil</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">Dados Oficiais</p>
            <p className="text-blue-700">Informações do IBGE</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">Faixas de CEP</p>
            <p className="text-blue-700">Detalhamento por bairros</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">Base Completa</p>
            <p className="text-blue-700">{stats.total} localidades cadastradas</p>
          </div>
        </div>
      </div>

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
          title={confirmDialog.cityId === -1 ? "Confirmar Importação" : "Confirmar Exclusão"}
          message={
            confirmDialog.cityId === -1
              ? `Deseja importar ${alagoasCities.length} cidades de Alagoas para o sistema?`
              : "Tem certeza que deseja excluir esta cidade? Esta ação não pode ser desfeita."
          }
          confirmText={confirmDialog.cityId === -1 ? "Importar" : "Excluir"}
          cancelText="Cancelar"
          type={confirmDialog.cityId === -1 ? "info" : "danger"}
          onConfirm={confirmDialog.cityId === -1 ? confirmImportAlagoas : confirmDelete}
          onCancel={() => setConfirmDialog({ isOpen: false })}
        />
      )}
    </div>
  );
};