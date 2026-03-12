import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Search, Plus, Filter, Download } from 'lucide-react';
import { countriesService, Country } from '../../services/countriesService';
import { CountryCard } from './CountryCard';
import { CountryView } from './CountryView';
import { CountryForm } from './CountryForm';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { logCreate, logUpdate, logDelete } from '../../services/logsService';

export const Countries: React.FC = () => {
  const breadcrumbItems = [
    { label: 'Configurações' },
    { label: 'Países', current: true }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [continentFilter, setContinentFilter] = useState('Todos');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingCountry, setEditingCountry] = useState<any>(null);
  const [viewingCountry, setViewingCountry] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [countriesList, setCountriesList] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; countryId?: string }>({ isOpen: false });
  const itemsPerPage = 12;

  const continents = [
    'Todos',
    'América do Norte',
    'América do Sul',
    'América Central',
    'Europa',
    'Ásia',
    'África',
    'Oceania',
    'Caribe'
  ];

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      setIsLoading(true);
      const data = await countriesService.getAll();
      setCountriesList(data);
    } catch (error) {
      setToast({ message: 'Erro ao carregar países.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCountries = countriesList.filter(country => {
    const matchesSearch = country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         country.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (country.capital && country.capital.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesContinent = continentFilter === 'Todos' || country.continent === continentFilter;
    return matchesSearch && matchesContinent;
  });

  const totalPages = Math.ceil(filteredCountries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedCountries = filteredCountries.slice(startIndex, startIndex + itemsPerPage);

  const handleNewCountry = () => {
    setEditingCountry(null);
    setShowForm(true);
  };

  const handleEditCountry = (country: any) => {
    setEditingCountry(country);
    setShowForm(true);
  };

  const handleViewCountry = (country: any) => {
    setViewingCountry(country);
    setShowView(true);
  };

  const handleDeleteCountry = (countryId: string | number) => {
    setConfirmDialog({ isOpen: true, countryId: String(countryId) });
  };

  const confirmDelete = async () => {
    if (confirmDialog.countryId) {
      const country = countriesList.find(c => String(c.id) === String(confirmDialog.countryId));
      const success = await countriesService.delete(confirmDialog.countryId);
      if (success) {
        if (country) {
          await logDelete('country', confirmDialog.countryId, country, 1, 'Administrador');
        }
        setToast({ message: 'País excluído com sucesso!', type: 'success' });
        await loadCountries();
      } else {
        setToast({ message: 'Erro ao excluir país.', type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleSaveCountry = async (countryData: any) => {
    try {
      const normalizedData = {
        code: countryData.code,
        name: countryData.name,
        flag: countryData.flag,
        continent: countryData.continent,
        capital: countryData.capital,
        language: countryData.language,
        bacen_code: countryData.bacenCode || countryData.bacen_code,
      };

      if (editingCountry) {
        const updated = await countriesService.update(editingCountry.id, {
          ...normalizedData,
          updated_by: 'current-user-id'
        });
        if (updated) {
          await logUpdate('country', editingCountry.id, editingCountry, updated, 1, 'Administrador');
          setToast({ message: 'País atualizado com sucesso!', type: 'success' });
        } else {
          setToast({ message: 'Erro ao atualizar país.', type: 'error' });
          return;
        }
      } else {
        const newCountry = await countriesService.create({
          ...normalizedData,
          created_by: 'current-user-id'
        });
        if (newCountry) {
          await logCreate('country', newCountry.id, newCountry, 1, 'Administrador');
        }
        setToast({ message: 'País criado com sucesso!', type: 'success' });
      }

      setShowForm(false);
      setEditingCountry(null);
      await loadCountries();
    } catch (error) {
      setToast({ message: 'Erro ao salvar país. Tente novamente.', type: 'error' });
    }
  };

  const handleBackToList = () => {
    setShowForm(false);
    setShowView(false);
    setEditingCountry(null);
    setViewingCountry(null);
  };

  const handleExport = () => {
    const csvContent = [
      ['Código', 'Nome', 'Continente', 'Capital', 'Idioma', 'Código BACEN'].join(','),
      ...filteredCountries.map(country => [
        country.code,
        country.name,
        country.continent,
        country.capital,
        country.language,
        country.bacen_code || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'paises.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (showForm) {
    return (
      <CountryForm
        onBack={handleBackToList}
        onSave={handleSaveCountry}
        country={editingCountry}
      />
    );
  }

  if (showView) {
    return (
      <CountryView
        onBack={handleBackToList}
        onEdit={() => {
          setShowView(false);
          handleEditCountry(viewingCountry);
        }}
        country={viewingCountry}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Países</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie o cadastro de países do mundo</p>
        </div>
        <button
          onClick={handleNewCountry}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Novo País</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, código ou capital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>

          <select
            value={continentFilter}
            onChange={(e) => setContinentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {continents.map(continent => (
              <option key={continent} value={continent}>
                {continent}
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
          <span>Total: {filteredCountries.length} países</span>
          <span>Página {currentPage} de {totalPages}</span>
        </div>
      </div>

      {/* Countries Grid */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando países...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedCountries.map((country) => (
            <CountryCard
              key={`${country.id}-${refreshKey}`}
              country={country}
              onView={handleViewCountry}
              onEdit={handleEditCountry}
              onDelete={handleDeleteCountry}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredCountries.length)} de {filteredCountries.length} países
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

      {filteredCountries.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum país encontrado</h3>
          <p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou cadastrar um novo país.</p>
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
          title="Confirmar Exclusão"
          message="Tem certeza que deseja excluir este país? Esta ação não pode ser desfeita."
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
