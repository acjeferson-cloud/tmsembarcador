import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Download, Users as UsersIcon, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { usersService, User } from '../../services/usersService';
import { UserCard } from './UserCard';
import { UserView } from './UserView';
import { UserForm } from './UserForm';
import { BlockedUsers } from './BlockedUsers';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { logCreate, logUpdate, logDelete } from '../../services/logsService';

export const Users: React.FC = () => {
  const { setLanguage } = useLanguage();
  const breadcrumbItems = [
    { label: 'Configurações' },
    { label: 'Usuários', current: true }
  ];
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, status: { ativos: 0, inativos: 0, bloqueados: 0 }, perfis: { administradores: 0, gerentes: 0, operadores: 0, visualizadores: 0, personalizados: 0 } });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [perfilFilter, setPerfilFilter] = useState('Todos');
  const [establishmentFilter, setEstablishmentFilter] = useState('Todos');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; userId?: string }>({ isOpen: false });
  const itemsPerPage = 12;
  const currentUserEmail = JSON.parse(localStorage.getItem('tms-user') || '{}').email || 'admin@tmsgestor.com';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);

      // Validate context before loading
      const context = await usersService.getCurrentContext();
      if (!context.orgId || !context.envId) {
        setToast({
          message: 'Erro: Contexto de sessão não encontrado. Faça logout e login novamente.',
          type: 'error'
        });
        setIsLoading(false);
        return;
      }

      const data = await usersService.getAll();
      setUsersList(data);
      const statsData = await usersService.getStats();
      setStats(statsData);
    } catch (error) {
      setToast({ message: 'Erro ao carregar usuários.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const forceRefresh = () => {
    loadUsers();
  };

  const filteredUsers = usersList.filter(user => {
    const matchesSearch = (user.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.cpf || '').includes(searchTerm) ||
                         (user.codigo || '').includes(searchTerm) ||
                         (user.cargo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.departamento || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || user.status === statusFilter;
    const matchesPerfil = perfilFilter === 'Todos' || user.perfil === perfilFilter;
    const matchesEstablishment = establishmentFilter === 'Todos' || user.estabelecimento_nome?.includes(establishmentFilter);
    return matchesSearch && matchesStatus && matchesPerfil && matchesEstablishment;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleNewUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleViewUser = (user: any) => {
    setViewingUser(user);
    setShowView(true);
  };

  const handleDeleteUser = (userId: string) => {
    const user = usersList.find(u => u.id === userId);
    if (user?.codigo === '0001') {
      setToast({ message: 'Não é possível excluir o usuário administrador principal!', type: 'warning' });
      return;
    }
    setConfirmDialog({ isOpen: true, userId });
  };

  const confirmDelete = async () => {
    if (confirmDialog.userId) {
      try {
        const user = usersList.find(u => u.id === confirmDialog.userId);
        const success = await usersService.delete(confirmDialog.userId);
        if (success) {
          if (user) {
            await logDelete('user', confirmDialog.userId, user, 1, 'Administrador');
          }
          setToast({ message: 'Usuário excluído com sucesso!', type: 'success' });
          forceRefresh();
        } else {
          setToast({ message: 'Erro ao excluir usuário.', type: 'error' });
        }
      } catch (error) {
        setToast({ message: 'Erro ao excluir usuário: ' + (error as Error).message, type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleBackToList = () => {
    setShowForm(false);
    setShowView(false);
    setEditingUser(null);
    setViewingUser(null);
    forceRefresh();
  };

  const handleSaveUser = async (userData: any) => {
    try {
      // Extract profile photo if present
      const profilePhoto = userData._profilePhoto;
      const { _profilePhoto, ...userDataWithoutPhoto } = userData;

      if (editingUser) {
        // Check if user is editing their own profile
        const currentUserFromStorage = JSON.parse(localStorage.getItem('tms-user') || '{}');
        const isEditingSelf = currentUserFromStorage.email === editingUser.email;
        const languageChanged = isEditingSelf && userData.preferred_language && userData.preferred_language !== editingUser.preferred_language;

        const updated = await usersService.update(editingUser.id, userDataWithoutPhoto);
        if (updated) {
          // Upload profile photo if provided
          if (profilePhoto && profilePhoto instanceof File) {
            const photoUrl = await usersService.uploadProfilePhoto(editingUser.id, profilePhoto);
            if (photoUrl) {
              updated.foto_perfil_url = photoUrl;
            }
          }

          await logUpdate('user', editingUser.id, editingUser, updated, 1, 'Administrador');

          // If user edited their own profile, update localStorage with new data
          if (isEditingSelf) {
            const updatedUserData = {
              ...currentUserFromStorage,
              name: updated.nome,
              foto_perfil_url: updated.foto_perfil_url,
              preferred_language: updated.preferred_language
            };
            localStorage.setItem('tms-user', JSON.stringify(updatedUserData));
            // Dispatch custom event to notify Header to update photo
            window.dispatchEvent(new CustomEvent('user-profile-updated', {
              detail: { foto_perfil_url: updated.foto_perfil_url }
            }));

            // If language didn't change, just reload to update all components
            if (!languageChanged) {
              window.location.reload();
            }
          }

          setToast({ message: 'Usuário atualizado com sucesso!', type: 'success' });

          if (languageChanged) {
            await setLanguage(userData.preferred_language);

            setTimeout(() => {
              window.location.reload();
            }, 1500);

            return;
          }
        } else {
          setToast({ message: 'Erro ao atualizar usuário.', type: 'error' });
          return;
        }
      } else {
        // Validate context before creating user
        const context = await usersService.getCurrentContext();
        if (!context.orgId || !context.envId) {
          setToast({
            message: 'Erro: Sessão expirada. Faça logout e login novamente para continuar.',
            type: 'error'
          });
          return;
        }

        const nextCode = await usersService.getNextCode();
        const newUser = {
          ...userDataWithoutPhoto,
          codigo: nextCode,
          tentativas_login: 0,
          created_by: 1
        };
        const created = await usersService.create(newUser);
        if (created) {
          // Upload profile photo if provided
          if (profilePhoto && profilePhoto instanceof File) {
            const photoUrl = await usersService.uploadProfilePhoto(created.id, profilePhoto);
            if (photoUrl) {
              // Update user with photo URL
              await usersService.update(created.id, { foto_perfil_url: photoUrl } as any);
            }
          }

          await logCreate('user', created.id, created, 1, 'Administrador');
        }
        setToast({ message: 'Usuário criado com sucesso!', type: 'success' });
      }

      setShowForm(false);
      setShowView(false);
      setEditingUser(null);
      setViewingUser(null);
      forceRefresh();
    } catch (error) {
      const errorMessage = (error as Error).message;

      // Check if error is related to missing context
      if (errorMessage.includes('Contexto de org/env não disponível') ||
          errorMessage.includes('Context') ||
          errorMessage.includes('organization') ||
          errorMessage.includes('environment')) {
        setToast({
          message: 'Sessão expirada. Por favor, faça logout e login novamente para continuar.',
          type: 'error'
        });
      } else {
        setToast({ message: 'Erro ao salvar usuário: ' + errorMessage, type: 'error' });
      }
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Código', 'Nome', 'Email', 'CPF', 'Cargo', 'Departamento', 'Perfil', 'Status', 'Estabelecimento', 'Data Admissão'].join(','),
      ...filteredUsers.map(user => [
        user.codigo,
        user.nome,
        user.email,
        user.cpf,
        user.cargo,
        user.departamento,
        user.perfil,
        user.status,
        user.estabelecimento_nome || '',
        user.data_admissao
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get unique values for filters
  const establishments = ['Todos', ...Array.from(new Set(usersList.map(u => u.estabelecimento_nome).filter(Boolean)))].sort();

  if (showForm) {
    return (
      <UserForm
        onBack={handleBackToList}
        onSave={handleSaveUser}
        user={editingUser}
      />
    );
  }

  if (showView) {
    return (
        <UserView
          onBack={handleBackToList}
          onEdit={() => {
            setShowView(false);
            handleEditUser(viewingUser);
          }}
          user={viewingUser}
        />
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-400">Carregando usuários...</div>
        </div>
      </div>
    );
  }

  // Se estiver mostrando usuários bloqueados
  if (showBlockedUsers) {
    return (
      <div className="p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários Bloqueados</h1>
            <p className="text-gray-600 dark:text-gray-400">Gerencie usuários bloqueados por segurança</p>
          </div>
          <button
            onClick={() => setShowBlockedUsers(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Voltar para Usuários
          </button>
        </div>
        <BlockedUsers currentUserEmail={currentUserEmail} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie o cadastro de usuários do sistema</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBlockedUsers(!showBlockedUsers)}
            className={`${
              stats.status.bloqueados > 0
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-600 hover:bg-gray-700'
            } text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors relative`}
          >
            <Shield size={20} />
            <span>Usuários Bloqueados</span>
            {stats.status.bloqueados > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 dark:text-white font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {stats.status.bloqueados}
              </span>
            )}
          </button>
          <button
            onClick={handleNewUser}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Usuários</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UsersIcon size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Usuários Ativos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.status.ativos}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administradores</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.perfis.administradores}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Personalizados</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.perfis.personalizados}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Shield size={24} className="text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bloqueados</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.status.bloqueados}</p>
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
              placeholder="Buscar por nome, email, CPF, código, cargo ou departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Todos">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="bloqueado">Bloqueado</option>
          </select>

          <select
            value={perfilFilter}
            onChange={(e) => setPerfilFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Todos">Todos os Perfis</option>
            <option value="administrador">Administrador</option>
            <option value="gerente">Gerente</option>
            <option value="operador">Operador</option>
            <option value="visualizador">Visualizador</option>
            <option value="personalizado">Personalizado</option>
          </select>

          <select
            value={establishmentFilter}
            onChange={(e) => setEstablishmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {establishments.map(establishment => (
              <option key={establishment} value={establishment}>
                {establishment === 'Todos' ? 'Todos os Estabelecimentos' : establishment}
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
          <span>Total: {filteredUsers.length} usuários</span>
          <span>Página {currentPage} de {totalPages}</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <CheckCircle size={14} className="text-green-600" />
              <span>{stats.status.ativos} ativos</span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertTriangle size={14} className="text-red-600" />
              <span>{stats.status.bloqueados} bloqueados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayedUsers.map((user) => (
          <UserCard
            key={`${user.id}-${refreshKey}`}
            user={user}
            onView={handleViewUser}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredUsers.length)} de {filteredUsers.length} usuários
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

      {filteredUsers.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum usuário encontrado</h3>
          <p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou cadastrar um novo usuário.</p>
        </div>
      )}

      {/* Security Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Segurança e Controle de Acesso</h3>
        <p className="text-yellow-800 mb-4">
          O sistema possui controle rigoroso de acesso com diferentes níveis de permissão e monitoramento de atividades.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-yellow-900">Perfis de Acesso</p>
            <p className="text-yellow-700">5 níveis de permissão</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-yellow-900">Permissões</p>
            <p className="text-yellow-700">Controle granular</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-yellow-900">Bloqueio Automático</p>
            <p className="text-yellow-700">Após 5 tentativas</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-yellow-900">Auditoria</p>
            <p className="text-yellow-700">Log de atividades</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-yellow-900">Proteção Admin</p>
            <p className="text-yellow-700">Usuário protegido</p>
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
          message="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
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