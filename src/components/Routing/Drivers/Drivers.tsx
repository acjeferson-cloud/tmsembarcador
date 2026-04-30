import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../../Layout/Breadcrumbs';
import { Search, Plus, Download, Users as UsersIcon } from 'lucide-react';
import { driversService, Driver } from '../../../services/driversService';
import { DriverCard } from './DriverCard';
import { DriverForm } from './DriverForm';
import { Toast, ToastType } from '../../common/Toast';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export const Drivers: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.perfil !== 'personalizado' || (user.permissoes && user.permissoes.includes('drivers'));
  
  const breadcrumbItems = [
    { label: t('menu.routing', { defaultValue: 'Roteirização' }) },
    { label: t('menu.drivers', { defaultValue: 'Motoristas' }), current: true }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; driverId?: string }>({ isOpen: false });
  const itemsPerPage = 12;

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setIsLoading(true);
      const data = await driversService.getAll();
      setDriversList(data);
    } catch (error) {
      setToast({ message: 'Erro ao carregar motoristas', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDrivers = driversList.filter(driver => {
    const term = searchTerm.toLowerCase();
    return (driver.nome || '').toLowerCase().includes(term) ||
           (driver.cpf || '').toLowerCase().includes(term) ||
           (driver.cnh || '').toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedDrivers = filteredDrivers.slice(startIndex, startIndex + itemsPerPage);

  const handleNewDriver = () => {
    setEditingDriver(null);
    setShowForm(true);
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setShowForm(true);
  };

  const handleDeleteDriver = (driverId: string) => {
    setConfirmDialog({ isOpen: true, driverId });
  };

  const confirmDelete = async () => {
    if (confirmDialog.driverId) {
      try {
        await driversService.delete(confirmDialog.driverId);
        setToast({ message: 'Motorista excluído com sucesso', type: 'success' });
        await loadDrivers();
      } catch (error) {
        setToast({ message: 'Erro ao excluir motorista', type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleSaveDriver = async (driverData: Partial<Driver>) => {
    try {
      if (editingDriver) {
        await driversService.update(editingDriver.id, driverData);
        setToast({ message: 'Motorista atualizado com sucesso', type: 'success' });
      } else {
        await driversService.create(driverData as any);
        setToast({ message: 'Motorista criado com sucesso', type: 'success' });
      }
      setShowForm(false);
      setEditingDriver(null);
      await loadDrivers();
    } catch (error) {
      setToast({ message: 'Erro ao salvar motorista', type: 'error' });
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Nome', 'CPF', 'CNH', 'Telefone', 'Status'].join(','),
      ...filteredDrivers.map(d => [
        d.nome, d.cpf, d.cnh, d.telefone, d.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'motoristas.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (showForm) {
    return (
      <DriverForm
        onBack={() => { setShowForm(false); setEditingDriver(null); }}
        onSave={handleSaveDriver}
        driver={editingDriver}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Motoristas</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerenciamento de motoristas para entregas de frota própria</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleNewDriver}
            className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Novo Motorista</span>
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
              placeholder="Buscar por nome, CPF ou CNH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent w-full dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            onClick={handleExport}
            className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
          <span>Total: {filteredDrivers.length}</span>
          {totalPages > 0 && <span>Página {currentPage} / {totalPages}</span>}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando motoristas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedDrivers.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              onEdit={handleEditDriver}
              onDelete={handleDeleteDriver}
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
              {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredDrivers.length)} / {filteredDrivers.length}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 dark:text-gray-300"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 dark:text-gray-300"
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredDrivers.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <UsersIcon className="w-12 h-12 opacity-50" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum motorista encontrado</h3>
          <p className="text-gray-600 dark:text-gray-400">Tente ajustar a busca ou cadastre um novo motorista.</p>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title="Excluir Motorista"
          message="Tem certeza que deseja excluir este motorista? Esta ação não poderá ser desfeita."
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
