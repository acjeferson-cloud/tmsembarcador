import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Search, Plus, Trash2, Edit2 } from 'lucide-react';
import { holidaysService, Holiday } from '../../services/holidaysService';
import { HolidayForm } from './HolidayForm';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useTranslation } from 'react-i18next';

export const Holidays: React.FC = () => {
  const { t } = useTranslation();
  const breadcrumbItems = [
    { label: t('holidays.breadcrumb') },
    { label: t('holidays.title'), current: true }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedType, setSelectedType] = useState<'all' | 'nacional' | 'estadual' | 'municipal'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidaysList, setHolidaysList] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; holidayId?: string }>({ isOpen: false });

  useEffect(() => {
    loadHolidays();
  }, [selectedYear]);

  const loadHolidays = async () => {
    try {
      setIsLoading(true);
      const data = await holidaysService.getByYear(selectedYear);
      setHolidaysList(data);
    } catch (error) {
      setToast({ message: t('holidays.messages.loadError'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHolidays = holidaysList.filter(holiday => {
    const matchesSearch = holiday.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || holiday.type === selectedType;
    return matchesSearch && matchesType;
  });

  const groupedHolidays = {
    nacional: filteredHolidays.filter(h => h.type === 'nacional'),
    estadual: filteredHolidays.filter(h => h.type === 'estadual'),
    municipal: filteredHolidays.filter(h => h.type === 'municipal')
  };

  const handleNewHoliday = (type: 'nacional' | 'estadual' | 'municipal') => {
    setEditingHoliday({ type } as Holiday);
    setShowForm(true);
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setShowForm(true);
  };

  const handleDeleteHoliday = (holidayId: string) => {
    setConfirmDialog({ isOpen: true, holidayId });
  };

  const confirmDelete = async () => {
    if (confirmDialog.holidayId) {
      try {
        await holidaysService.delete(confirmDialog.holidayId);
        setToast({ message: t('holidays.messages.deleteSuccess'), type: 'success' });
        await loadHolidays();
      } catch (error) {
        setToast({ message: t('holidays.messages.deleteError'), type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleSaveHoliday = async () => {
    setShowForm(false);
    setEditingHoliday(null);
    await loadHolidays();
    setToast({ message: t('holidays.messages.saveSuccess'), type: 'success' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="p-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('holidays.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('holidays.subtitle')}</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('holidays.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
          <option value={2027}>2027</option>
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">{t('holidays.types.all')}</option>
          <option value="nacional">{t('holidays.types.nacional')}</option>
          <option value="estadual">{t('holidays.types.estadual')}</option>
          <option value="municipal">{t('holidays.types.municipal')}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feriados Nacionais */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 dark:text-white">{t('holidays.boards.nacional')}</h2>
            <button
              onClick={() => handleNewHoliday('nacional')}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">{t('holidays.messages.loading')}</p>
            ) : groupedHolidays.nacional.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">{t('holidays.emptyStates.nacional')}</p>
            ) : (
              groupedHolidays.nacional.map(holiday => (
                <div key={holiday.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:bg-gray-900">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{holiday.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{formatDate(holiday.date)}</div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditHoliday(holiday)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteHoliday(holiday.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {holiday.is_recurring && (
                    <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                      {t('holidays.card.recurring')}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feriados Estaduais */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 dark:text-white">{t('holidays.boards.estadual')}</h2>
            <button
              onClick={() => handleNewHoliday('estadual')}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">{t('holidays.messages.loading')}</p>
            ) : groupedHolidays.estadual.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">{t('holidays.emptyStates.estadual')}</p>
            ) : (
              groupedHolidays.estadual.map(holiday => (
                <div key={holiday.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:bg-gray-900">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{holiday.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{formatDate(holiday.date)}</div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditHoliday(holiday)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteHoliday(holiday.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {holiday.is_recurring && (
                    <span className="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                      {t('holidays.card.recurring')}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feriados Municipais */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 dark:text-white">{t('holidays.boards.municipal')}</h2>
            <button
              onClick={() => handleNewHoliday('municipal')}
              className="p-1 text-orange-600 hover:bg-orange-50 rounded"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">{t('holidays.messages.loading')}</p>
            ) : groupedHolidays.municipal.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">{t('holidays.emptyStates.municipal')}</p>
            ) : (
              groupedHolidays.municipal.map(holiday => (
                <div key={holiday.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:bg-gray-900">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{holiday.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{formatDate(holiday.date)}</div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditHoliday(holiday)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteHoliday(holiday.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {holiday.is_recurring && (
                    <span className="inline-block px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded">
                      {t('holidays.card.recurring')}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <HolidayForm
          holiday={editingHoliday}
          onClose={() => {
            setShowForm(false);
            setEditingHoliday(null);
          }}
          onSave={handleSaveHoliday}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={t('holidays.messages.confirmDeleteTitle')}
          message={t('holidays.messages.confirmDeleteMessage')}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDialog({ isOpen: false })}
        />
      )}
    </div>
  );
};
