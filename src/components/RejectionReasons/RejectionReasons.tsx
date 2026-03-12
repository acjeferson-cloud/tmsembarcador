import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Search, Plus, Filter, Download, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { rejectionReasonsService } from '../../services/rejectionReasonsService';
import { RejectionReasonCard } from './RejectionReasonCard';
import { RejectionReasonView } from './RejectionReasonView';
import { RejectionReasonForm } from './RejectionReasonForm';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const RejectionReasons: React.FC = () => {
  const breadcrumbItems = [
    { label: 'Configurações' },
    { label: 'Motivos de Rejeição', current: true }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingReason, setEditingReason] = useState<any>(null);
  const [viewingReason, setViewingReason] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [reasonsList, setReasonsList] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todas']);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byCategory: {} as Record<string, number>
  });
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    reasonId?: string;
  }>({ isOpen: false });
  const itemsPerPage = 12;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [reasons, allCategories, stats] = await Promise.all([
        rejectionReasonsService.getAll(),
        rejectionReasonsService.getAllCategories(),
        rejectionReasonsService.getStats()
      ]);

      setReasonsList(reasons);
      setCategories(['Todas', ...allCategories]);
      setStats(stats);
    } catch (error) {

      setToast({ message: 'Erro ao carregar dados.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const forceRefresh = async () => {
    await loadInitialData();
  };

  const filteredReasons = reasonsList.filter(reason => {
    const matchesSearch = reason.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reason.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reason.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todas' || reason.categoria === categoryFilter;
    const matchesStatus = statusFilter === 'Todos' || 
                         (statusFilter === 'Ativos' && reason.ativo) || 
                         (statusFilter === 'Inativos' && !reason.ativo);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredReasons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedReasons = filteredReasons.slice(startIndex, startIndex + itemsPerPage);

  const handleNewReason = () => {
    setEditingReason(null);
    setShowForm(true);
  };

  const handleEditReason = (reason: any) => {
    setEditingReason(reason);
    setShowForm(true);
  };

  const handleViewReason = (reason: any) => {
    setViewingReason(reason);
    setShowView(true);
  };

  const handleDeleteReason = (reasonId: string) => {
    setConfirmDialog({ isOpen: true, reasonId });
  };

  const confirmDelete = async () => {
    if (confirmDialog.reasonId) {
      const success = await rejectionReasonsService.delete(confirmDialog.reasonId);
      if (success) {
        setToast({ message: 'Motivo de rejeição excluído com sucesso!', type: 'success' });
        await forceRefresh();
      } else {
        setToast({ message: 'Erro ao excluir motivo de rejeição.', type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleSaveReason = async (reasonData: any) => {
    try {
      if (editingReason) {
        const updated = await rejectionReasonsService.update(editingReason.id, {
          ...reasonData
        });
        if (updated) {
          setToast({ message: 'Motivo de rejeição atualizado com sucesso!', type: 'success' });
        } else {
          setToast({ message: 'Erro ao atualizar motivo de rejeição.', type: 'error' });
          return;
        }
      } else {
        await rejectionReasonsService.create({
          ...reasonData
        });
        setToast({ message: 'Motivo de rejeição criado com sucesso!', type: 'success' });
      }

      setShowForm(false);
      setEditingReason(null);
      await forceRefresh();
    } catch (error) {

      setToast({ message: 'Erro ao salvar motivo de rejeição. Tente novamente.', type: 'error' });
    }
  };

  const handleBackToList = () => {
    setShowForm(false);
    setShowView(false);
    setEditingReason(null);
    setViewingReason(null);
  };

  const handleExport = () => {
    const csvContent = [
      ['Código', 'Categoria', 'Descrição', 'Status'].join(','),
      ...filteredReasons.map(reason => [
        reason.codigo,
        reason.categoria,
        `"${reason.descricao.replace(/"/g, '""')}"`, // Escape quotes for CSV
        reason.ativo ? 'Ativo' : 'Inativo'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'motivos_rejeicao.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (showForm) {
    return (
      <RejectionReasonForm
        onBack={handleBackToList}
        onSave={handleSaveReason}
        reason={editingReason}
        categories={categories.filter(c => c !== 'Todas')}
      />
    );
  }

  if (showView) {
    return (
      <RejectionReasonView
        onBack={handleBackToList}
        onEdit={() => {
          setShowView(false);
          handleEditReason(viewingReason);
        }}
        reason={viewingReason}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Motivos de Rejeições de Documentos</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie os motivos de rejeição para conferência eletrônica de documentos</p>
        </div>
        <button 
          onClick={handleNewReason}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Novo Motivo</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Motivos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Motivos Ativos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Motivos Inativos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.inactive}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribuição por Categoria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stats.byCategory).map(([category, count]) => (
            <div key={category} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]" title={category}>{category}</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{count}</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(count / stats.total) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por código, categoria ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Ativos">Somente Ativos</option>
            <option value="Inativos">Somente Inativos</option>
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
          <span>Total: {filteredReasons.length} motivos</span>
          <span>Página {currentPage} de {totalPages || 1}</span>
        </div>
      </div>

      {/* Reasons Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayedReasons.map((reason) => (
          <RejectionReasonCard
            key={reason.id}
            reason={reason}
            onView={handleViewReason}
            onEdit={handleEditReason}
            onDelete={handleDeleteReason}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredReasons.length)} de {filteredReasons.length} motivos
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

      {filteredReasons.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <AlertCircle size={48} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum motivo de rejeição encontrado</h3>
          <p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou cadastrar um novo motivo de rejeição.</p>
        </div>
      )}

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Sobre Motivos de Rejeição</h3>
        <p className="text-blue-800 mb-4">
          Os motivos de rejeição são utilizados para padronizar o processo de conferência eletrônica de documentos fiscais.
          Quando uma inconsistência é identificada, o sistema associa um motivo padronizado de rejeição ao documento.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">Auditoria Automática</p>
            <p className="text-blue-700">Validação de CT-es e Faturas</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">Conciliação</p>
            <p className="text-blue-700">Processo de conciliação de fretes</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">Notificações</p>
            <p className="text-blue-700">Alertas para transportadores</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">Categorização</p>
            <p className="text-blue-700">Agrupamento por tipo de problema</p>
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
          title="Confirmar Exclusão"
          message="Tem certeza que deseja excluir este motivo de rejeição? Esta ação não pode ser desfeita."
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