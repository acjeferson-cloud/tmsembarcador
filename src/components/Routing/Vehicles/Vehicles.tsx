import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../../Layout/Breadcrumbs';
import { Search, Plus, Download, Truck, Edit, Trash2, Eye, Hash, CheckCircle2, AlertTriangle, Wrench } from 'lucide-react';
import { vehiclesService, Vehicle } from '../../../services/vehiclesService';
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
  const [statusFilter, setStatusFilter] = useState('Todos os Status');
  const [categoryFilter, setCategoryFilter] = useState('Categoria Operacional');
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
    const matchesSearch = (vehicle.placa || '').toLowerCase().includes(term) ||
           (vehicle.tipo || '').toLowerCase().includes(term);
           
    const statusMatchValue = statusFilter === 'Ativo' ? 'ativo' : statusFilter === 'Inativo' ? 'inativo' : statusFilter === 'Manutenção' ? 'manutencao' : null;
    const matchesStatus = statusFilter === 'Todos os Status' || vehicle.status === statusMatchValue;
    
    const matchesCategory = categoryFilter === 'Categoria Operacional' || vehicle.metadata?.categoria_operacional === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedVehicles = filteredVehicles.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

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
        <div className="flex space-x-3">
          {isAdmin && (
            <button
              onClick={handleNewVehicle}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus size={20} />
              <span>Novo Veículo</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{vehiclesList.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <Truck size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ativos</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {vehiclesList.filter(v => v.status === 'ativo').length}
              </h3>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Em Manutenção</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {vehiclesList.filter(v => v.status === 'manutencao').length}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
              <Wrench size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inativos</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {vehiclesList.filter(v => v.status === 'inativo').length}
              </h3>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por placa ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            >
              <option value="Todos os Status">Todos os Status</option>
              <option value="Ativo">Ativos</option>
              <option value="Inativo">Inativos</option>
              <option value="Manutenção">Em Manutenção</option>
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            >
              <option value="Categoria Operacional">Categoria Operacional</option>
              <option value="Próprio">Próprio</option>
              <option value="Agregado">Agregado</option>
              <option value="Terceiro">Terceiro</option>
            </select>
            
            <button
              onClick={handleExport}
              className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors whitespace-nowrap text-sm"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>

        {/* Resumo */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>Total: {filteredVehicles.length} veículos</span>
          <span>Página {currentPage} de {Math.max(1, totalPages)}</span>
          <span className="flex items-center gap-1 text-green-600 dark:text-green-500">
            <CheckCircle2 size={14} /> {filteredVehicles.filter(v => v.status === 'ativo').length} ativos
          </span>
          <span className="flex items-center gap-1 text-red-600 dark:text-red-500">
            <AlertTriangle size={14} /> {filteredVehicles.filter(v => v.status === 'inativo').length} inativos
          </span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-semibold h-fit">
                    {vehicle.placa}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white leading-tight uppercase">
                      {vehicle.tipo === 'Van' ? 'VUC' : 
                       vehicle.tipo === 'Fiorino' ? 'Fiorino / Van Pequena' : 
                       vehicle.tipo === 'Toco' ? 'Caminhão Toco' : 
                       vehicle.tipo === 'Truck' ? 'Caminhão Truck' : 
                       vehicle.tipo}
                    </h3>
                    <p className="text-xs text-gray-500">{vehicle.metadata?.categoria_operacional || 'Categoria Não Definida'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  {isAdmin && (
                    <>
                      <button 
                        onClick={() => handleEditVehicle(vehicle)}
                        className="p-1 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Editar Veículo"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="p-1 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Excluir Veículo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Truck size={14} className="text-gray-400" /> 
                  <span>{vehicle.metadata?.tipo_operacao || 'Operação Não Definida'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Hash size={14} className="text-gray-400" /> 
                  <span>Capacidade: {vehicle.capacidade_kg.toLocaleString('pt-BR')} kg</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Hash size={14} className="text-gray-400" /> 
                  <span>Cubagem: {vehicle.cubagem_m3.toLocaleString('pt-BR')} m³</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1
                  ${vehicle.status === 'ativo' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                    vehicle.status === 'manutencao' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}
                `}>
                  {vehicle.status === 'ativo' && <CheckCircle2 size={14} strokeWidth={2.5} />}
                  {vehicle.status === 'ativo' ? 'Ativo' : vehicle.status === 'manutencao' ? 'Manutenção' : 'Inativo'}
                </span>
                
                {vehicle.metadata?.avancado?.score && (
                  <span className="text-gray-500 text-xs font-medium flex items-center gap-1">
                    Score: {vehicle.metadata.avancado.score}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredVehicles.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum veículo encontrado</h3>
          <p className="text-gray-600 dark:text-gray-400">Tente ajustar a busca ou cadastre um novo veículo.</p>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredVehicles.length)} de {filteredVehicles.length} resultados
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300"
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
                        : 'border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300"
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Confirm Dialog */}
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
