import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Search, Plus, Download, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { occurrencesService } from '../../services/occurrencesService';
import { OccurrenceCard } from './OccurrenceCard';
import { OccurrenceView } from './OccurrenceView';
import { OccurrenceForm } from './OccurrenceForm';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export const Occurrences: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.email === 'jeferson.costa@logaxis.com.br';
  const breadcrumbItems = [
    { label: t('occurrences.breadcrumb') },
    { label: t('occurrences.title'), current: true }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingOccurrence, setEditingOccurrence] = useState<any>(null);
  const [viewingOccurrence, setViewingOccurrence] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [occurrencesList, setOccurrencesList] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; occurrenceId?: string }>({ isOpen: false });
  const itemsPerPage = 12;

  useEffect(() => {
    loadOccurrences();
  }, []);

  const loadOccurrences = async () => {
    try {
      const data = await occurrencesService.getAll();
      setOccurrencesList(data);
    } catch (error) {
      setToast({ message: t('occurrences.messages.loadError'), type: 'error' });
    }
  };

  const filteredOccurrences = occurrencesList.filter(occurrence => {
    const matchesSearch = occurrence.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         occurrence.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredOccurrences.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedOccurrences = filteredOccurrences.slice(startIndex, startIndex + itemsPerPage);

  const handleNewOccurrence = () => {
    setEditingOccurrence(null);
    setShowForm(true);
  };

  const handleEditOccurrence = (occurrence: any) => {
    setEditingOccurrence(occurrence);
    setShowForm(true);
  };

  const handleViewOccurrence = (occurrence: any) => {
    setViewingOccurrence(occurrence);
    setShowView(true);
  };

  const handleDeleteOccurrence = (occurrenceId: string) => {
    setConfirmDialog({ isOpen: true, occurrenceId });
  };

  const confirmDelete = async () => {
    if (confirmDialog.occurrenceId) {
      const success = await occurrencesService.delete(confirmDialog.occurrenceId);
      if (success) {
        setToast({ message: t('occurrences.messages.deleteSuccess'), type: 'success' });
        await loadOccurrences();
      } else {
        setToast({ message: t('occurrences.messages.deleteError'), type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleSaveOccurrence = async (occurrenceData: any) => {
    try {
      if (editingOccurrence) {
        const updated = await occurrencesService.update(editingOccurrence.id, {
          ...occurrenceData
        });
        if (updated) {
          setToast({ message: t('occurrences.messages.updateSuccess'), type: 'success' });
        } else {
          setToast({ message: t('occurrences.messages.updateError'), type: 'error' });
          return;
        }
      } else {
        await occurrencesService.create({
          ...occurrenceData
        });
        setToast({ message: t('occurrences.messages.createSuccess'), type: 'success' });
      }

      setShowForm(false);
      setEditingOccurrence(null);
      await loadOccurrences();
    } catch (error) {
      setToast({ message: t('occurrences.messages.saveError'), type: 'error' });
    }
  };

  const handleBackToList = () => {
    setShowForm(false);
    setShowView(false);
    setEditingOccurrence(null);
    setViewingOccurrence(null);
  };

  const handleExport = () => {
    const csvContent = [
      ['Código', 'Descrição'].join(','),
      ...filteredOccurrences.map(occurrence => [
        occurrence.codigo,
        occurrence.descricao
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historicos_ocorrencias.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (showForm) {
    return (
      <OccurrenceForm
        onBack={handleBackToList}
        onSave={handleSaveOccurrence}
        occurrence={editingOccurrence}
      />
    );
  }

  if (showView) {
    return (
      <OccurrenceView
        onBack={handleBackToList}
        onEdit={() => {
          setShowView(false);
          handleEditOccurrence(viewingOccurrence);
        }}
        occurrence={viewingOccurrence}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('occurrences.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('occurrences.subtitle')}</p>
        </div>
        {isAdmin && (
          <button 
            onClick={handleNewOccurrence}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>{t('occurrences.newButton')}</span>
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('occurrences.stats.total')}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{occurrencesList.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('occurrences.stats.deliveries')}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {occurrencesList.filter(o => parseInt(o.codigo) < 50).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('occurrences.stats.problems')}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {occurrencesList.filter(o => parseInt(o.codigo) >= 50).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-600" />
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
              placeholder={t('occurrences.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          
          <button 
            onClick={handleExport}
            className="border border-gray-300 hover:bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download size={18} />
            <span>{t('occurrences.export')}</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
          <span>{t('occurrences.summary', { total: filteredOccurrences.length })}</span>
          <span>{t('occurrences.page', { current: currentPage, total: totalPages || 1 })}</span>
        </div>
      </div>

      {/* Occurrences Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayedOccurrences.map((occurrence) => (
          <OccurrenceCard
            key={occurrence.id}
            occurrence={occurrence}
            onView={handleViewOccurrence}
            onEdit={handleEditOccurrence}
            onDelete={handleDeleteOccurrence}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('occurrences.messages.pagination', { start: startIndex + 1, end: Math.min(startIndex + itemsPerPage, filteredOccurrences.length), total: filteredOccurrences.length })}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('occurrences.messages.prev')}
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
                {t('occurrences.messages.next')}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredOccurrences.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <FileText size={48} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('occurrences.emptyTitle')}</h3>
          <p className="text-gray-600 dark:text-gray-400">{t('occurrences.emptyDesc')}</p>
        </div>
      )}

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('occurrences.about.title')}</h3>
        <p className="text-blue-800 mb-4">
          {t('occurrences.about.desc')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">{t('occurrences.about.patternTitle')}</p>
            <p className="text-blue-700">{t('occurrences.about.patternDesc')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">{t('occurrences.about.trackingTitle')}</p>
            <p className="text-blue-700">{t('occurrences.about.trackingDesc')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">{t('occurrences.about.standardTitle')}</p>
            <p className="text-blue-700">{t('occurrences.about.standardDesc')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">{t('occurrences.about.customTitle')}</p>
            <p className="text-blue-700">{t('occurrences.about.customDesc')}</p>
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
          isOpen={confirmDialog.isOpen}
          title={t('occurrences.messages.confirmDeleteTitle')}
          message={t('occurrences.messages.confirmDeleteMessage')}
          confirmText={t('occurrences.messages.confirmDeleteBtn')}
          cancelText={t('occurrences.messages.cancelBtn')}
          type="danger"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDialog({ isOpen: false })}
        />
      )}
    </div>
  );
};
