import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Search, Plus, Download } from 'lucide-react';
import { countriesService, Country } from '../../services/countriesService';
import { CountryCard } from './CountryCard';
import { CountryView } from './CountryView';
import { CountryForm } from './CountryForm';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { logCreate, logUpdate, logDelete } from '../../services/logsService';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export const Countries: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.email === 'jeferson.costa@logaxis.com.br';
  const breadcrumbItems = [
    { label: t('settings', { defaultValue: 'Configurações' }) },
    { label: t('countries.title'), current: true }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [continentFilter, setContinentFilter] = useState(t('countries.allContinents'));
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingCountry, setEditingCountry] = useState<any>(null);
  const [viewingCountry, setViewingCountry] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [countriesList, setCountriesList] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; countryId?: string }>({ isOpen: false });
  const itemsPerPage = 12;

  const continents = [
    t('countries.allContinents'),
    t('countries.continents.northAmerica'),
    t('countries.continents.southAmerica'),
    t('countries.continents.centralAmerica'),
    t('countries.continents.europe'),
    t('countries.continents.asia'),
    t('countries.continents.africa'),
    t('countries.continents.oceania'),
    t('countries.continents.caribbean')
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
      setToast({ message: t('countries.messages.loadError'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCountries = countriesList.filter(country => {
    const matchesSearch = (country.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (country.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (country.capital && country.capital.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesContinent = continentFilter === t('countries.allContinents') || country.continent === continentFilter;
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
        setToast({ message: t('countries.messages.deleteSuccess'), type: 'success' });
        await loadCountries();
      } else {
        setToast({ message: t('countries.messages.deleteError'), type: 'error' });
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
          ...normalizedData
        } as Partial<Country>);
        if (updated) {
          await logUpdate('country', editingCountry.id, editingCountry, updated, 1, 'Administrador');
          setToast({ message: t('countries.messages.updateSuccess'), type: 'success' });
        } else {
          setToast({ message: t('countries.messages.updateError'), type: 'error' });
          return;
        }
      } else {
        const newCountry = await countriesService.create({
          ...normalizedData
        } as Omit<Country, 'id' | 'created_at' | 'updated_at'>);
        if (newCountry) {
          await logCreate('country', newCountry.id, newCountry, 1, 'Administrador');
        }
        setToast({ message: t('countries.messages.createSuccess'), type: 'success' });
      }

      setShowForm(false);
      setEditingCountry(null);
      await loadCountries();
    } catch (error) {
      setToast({ message: t('countries.messages.createError'), type: 'error' });
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
      [
        t('countries.form.code'),
        t('countries.form.name'),
        t('countries.form.continent'),
        t('countries.form.capital'),
        t('countries.form.language'),
        t('countries.form.bacenCode')
      ].join(','),
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
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('countries.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('countries.subtitle')}</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleNewCountry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>{t('countries.actions.new')}</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('countries.searchPlaceholder')}
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
            <span>{t('countries.actions.export')}</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
          <span>Total: {filteredCountries.length}</span>
          <span>{currentPage} / {totalPages}</span>
        </div>
      </div>

      {/* Countries Grid */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading', { defaultValue: 'Carregando países...' })}</p>
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
              {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredCountries.length)} / {filteredCountries.length}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.previous', { defaultValue: 'Anterior' })}
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
                {t('common.next', { defaultValue: 'Próximo' })}
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('countries.noDataTitle', { defaultValue: 'Nenhum país encontrado' })}</h3>
          <p className="text-gray-600 dark:text-gray-400">{t('countries.noDataMessage', { defaultValue: 'Tente ajustar os filtros ou cadastrar um novo país.' })}</p>
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
          title={t('countries.deleteConfirm.title')}
          message={t('countries.deleteConfirm.message')}
          confirmText={t('countries.actions.delete')}
          cancelText={t('countries.actions.cancel')}
          type="danger"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDialog({ isOpen: false })}
        />
      )}
    </div>
  );
};
