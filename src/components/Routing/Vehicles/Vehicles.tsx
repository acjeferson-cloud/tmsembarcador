import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../../Layout/Breadcrumbs';
import { Search, Plus, Download, Truck } from 'lucide-react';
import { vehiclesService, Vehicle } from '../../../services/vehiclesService';
import { VehicleCard } from './VehicleCard';
import { VehicleForm } from './VehicleForm';
import { Toast, ToastType } from '../../common/Toast';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export const Vehicles: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.perfil !== 'personalizado' || (user.permissoes && user.permissoes.includes('vehicles'));
  
  const breadcrumbItems = [
    { label: t('menu.routing', { defaultValue: 'Roteirização' }) },
    { label: t('menu.vehicles', { defaultValue: 'Veículos' }), current: true }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; vehicleId?: string }>({ isOpen: false });
  const itemsPerPage = 12;

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setIsLoading(true);
      const data = await vehiclesService.getAll();
      setVehiclesList(data);
    } catch (error) {
      setToast({ message: 'Erro ao carregar veículos', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVehicles = vehiclesList.filter(vehicle => {
    const term = searchTerm.toLowerCase();
    return (vehicle.placa || '').toLowerCase().includes(term) ||
           (vehicle.tipo || '').toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedVehicles = filteredVehicles.slice(startIndex, startIndex + itemsPerPage);

  const handleNewVehicle = () => {
    setEditingVehicle(null);
    setShowForm(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    setConfirmDialog({ isOpen: true, vehicleId });
  };

  const confirmDelete = async () => {
    if (confirmDialog.vehicleId) {
      try {
        await vehiclesService.delete(confirmDialog.vehicleId);
        setToast({ message: 'Veículo excluído com sucesso', type: 'success' });
        await loadVehicles();
      } catch (error) {
        setToast({ message: 'Erro ao excluir veículo', type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleSaveVehicle = async (vehicleData: Partial<Vehicle>) => {
    try {
      if (editingVehicle) {
        await vehiclesService.update(editingVehicle.id, vehicleData);
        setToast({ message: 'Veículo atualizado com sucesso', type: 'success' });
      } else {
        await vehiclesService.create(vehicleData as any);
        setToast({ message: 'Veículo criado com sucesso', type: 'success' });
      }
      setShowForm(false);
      setEditingVehicle(null);
      await loadVehicles();
    } catch (error) {
      setToast({ message: 'Erro ao salvar veículo', type: 'error' });
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Placa', 'Tipo', 'Capacidade (kg)', 'Cubagem (m3)', 'Status'].join(','),
      ...filteredVehicles.map(v => [
        v.placa, v.tipo, v.capacidade_kg, v.cubagem_m3, v.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'veiculos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (showForm) {
    return (
      <VehicleForm
        onBack={() => { setShowForm(false); setEditingVehicle(null); }}
        onSave={handleSaveVehicle}
        vehicle={editingVehicle}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Veículos da Frota</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerenciamento de veículos próprios para roteirização</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleNewVehicle}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Novo Veículo</span>
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
              placeholder="Buscar por placa ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-full dark:bg-gray-700 dark:text-white"
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
          <span>Total: {filteredVehicles.length}</span>
          {totalPages > 0 && <span>Página {currentPage} / {totalPages}</span>}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando veículos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={handleEditVehicle}
              onDelete={handleDeleteVehicle}
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
              {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredVehicles.length)} / {filteredVehicles.length}
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

      {filteredVehicles.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <Truck className="w-12 h-12 opacity-50" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum veículo encontrado</h3>
          <p className="text-gray-600 dark:text-gray-400">Tente ajustar a busca ou cadastre um novo veículo.</p>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title="Excluir Veículo"
          message="Tem certeza que deseja excluir este veículo? Esta ação não poderá ser desfeita."
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
