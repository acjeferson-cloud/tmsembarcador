import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Search, Plus, Filter, Download, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { establishmentsService, Establishment } from '../../services/establishmentsService';
import { EstablishmentCard } from './EstablishmentCard';
import { EstablishmentView } from './EstablishmentView';
import { EstablishmentForm } from './EstablishmentForm';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { logCreate, logUpdate, logDelete } from '../../services/logsService';

export const Establishments: React.FC = () => {
  const breadcrumbItems = [
    { label: 'Configurações' },
    { label: 'Estabelecimentos', current: true }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('Todos');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingEstablishment, setEditingEstablishment] = useState<Establishment | null>(null);
  const [viewingEstablishment, setViewingEstablishment] = useState<Establishment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    establishmentId?: string;
    establishmentName?: string;
    canDelete?: boolean;
    reason?: string;
  }>({ isOpen: false });
  const itemsPerPage = 12;

  useEffect(() => {
    loadEstablishments();
  }, []);

  const loadEstablishments = async () => {
    try {
      console.log('🏗️ [Establishments.loadEstablishments] INÍCIO');
      setIsLoading(true);

      // Buscar email do localStorage (autenticação customizada)
      const savedUser = localStorage.getItem('tms-user');
      console.log('🏗️ [Establishments.loadEstablishments] localStorage tms-user:', savedUser ? 'EXISTE' : 'NÃO EXISTE');

      if (!savedUser) {
        console.error('❌ [Establishments.loadEstablishments] Usuário não autenticado');
        setEstablishments([]);
        return;
      }

      let userEmail: string;
      try {
        const userData = JSON.parse(savedUser);
        userEmail = userData.email;
        console.log('🏗️ [Establishments.loadEstablishments] Email do usuário:', userEmail);
      } catch (parseError) {
        console.error('❌ [Establishments.loadEstablishments] Erro ao parsear userData:', parseError);
        setEstablishments([]);
        return;
      }

      // Buscar estabelecimentos permitidos para o usuário
      console.log('🏗️ [Establishments.loadEstablishments] Buscando estabelecimentos_permitidos...');
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('estabelecimentos_permitidos')
        .eq('email', userEmail)
        .maybeSingle();

      console.log('🏗️ [Establishments.loadEstablishments] userRecord:', {
        encontrado: !!userRecord,
        error: userError?.message,
        estabelecimentos_permitidos: userRecord?.estabelecimentos_permitidos
      });

      // Buscar todos os estabelecimentos via service
      console.log('🏗️ [Establishments.loadEstablishments] Chamando establishmentsService.getAll()...');
      let data = await establishmentsService.getAll();
      console.log('🏗️ [Establishments.loadEstablishments] establishmentsService.getAll() retornou:', {
        count: data.length,
        items: data.map(e => ({ codigo: e.codigo, razao_social: e.razao_social }))
      });

      // Filtrar por estabelecimentos permitidos (se houver)
      if (userRecord?.estabelecimentos_permitidos && userRecord.estabelecimentos_permitidos.length > 0) {
        const allowedIds = userRecord.estabelecimentos_permitidos;
        console.log('🏗️ [Establishments.loadEstablishments] Filtrando por IDs permitidos:', allowedIds);

        const beforeFilterCount = data.length;
        data = data.filter(est => allowedIds.includes(est.id));

        console.log('🏗️ [Establishments.loadEstablishments] Após filtro:', {
          antes: beforeFilterCount,
          depois: data.length,
          filtrados: data.map(e => ({ id: e.id, codigo: e.codigo, razao_social: e.razao_social }))
        });
      } else {
        console.log('🏗️ [Establishments.loadEstablishments] Sem filtro de estabelecimentos permitidos');
      }

      console.log('✅ [Establishments.loadEstablishments] Definindo estado com', data.length, 'estabelecimentos');
      setEstablishments(data);
    } catch (error) {
      console.error('❌ [Establishments.loadEstablishments] Erro geral:', error);
      setToast({ message: 'Erro ao carregar estabelecimentos.', type: 'error' });
    } finally {
      console.log('🏗️ [Establishments.loadEstablishments] FIM');
      setIsLoading(false);
    }
  };

  const forceRefresh = () => {
    loadEstablishments();
  };

  const filteredEstablishments = establishments.filter(establishment => {
    const matchesSearch = establishment.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         establishment.fantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         establishment.cnpj.includes(searchTerm) ||
                         establishment.codigo.toString().includes(searchTerm) ||
                         establishment.cep.includes(searchTerm);
    const matchesState = stateFilter === 'Todos' || establishment.estado === stateFilter;
    return matchesSearch && matchesState;
  });

  const totalPages = Math.ceil(filteredEstablishments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedEstablishments = filteredEstablishments.slice(startIndex, startIndex + itemsPerPage);

  const handleNewEstablishment = () => {
    setEditingEstablishment(null);
    setShowForm(true);
  };

  const handleEditEstablishment = (establishment: Establishment) => {
    setEditingEstablishment(establishment);
    setShowForm(true);
  };

  const handleViewEstablishment = (establishment: Establishment) => {
    setViewingEstablishment(establishment);
    setShowView(true);
  };

  const handleDeleteEstablishment = async (establishmentId: string) => {
    const establishment = establishments.find(e => e.id === establishmentId);

    if (!establishment) {
      setToast({ message: 'Estabelecimento não encontrado.', type: 'error' });
      return;
    }

    // Validate if can delete
    const validation = await establishmentsService.canDelete(establishmentId);

    if (!validation.canDelete) {
      setConfirmDialog({
        isOpen: true,
        establishmentId,
        establishmentName: `${establishment.codigo} - ${establishment.razao_social}`,
        canDelete: false,
        reason: validation.reason
      });
      return;
    }

    // Can delete - show confirmation
    setConfirmDialog({
      isOpen: true,
      establishmentId,
      establishmentName: `${establishment.codigo} - ${establishment.razao_social}`,
      canDelete: true
    });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.canDelete) {
      // Just close the dialog if can't delete
      setConfirmDialog({ isOpen: false });
      return;
    }

    if (confirmDialog.establishmentId) {
      try {
        const establishment = establishments.find(e => e.id === confirmDialog.establishmentId);

        const success = await establishmentsService.delete(confirmDialog.establishmentId);

        if (success) {
          if (establishment) {
            await logDelete(
              'establishment',
              confirmDialog.establishmentId,
              establishment,
              1,
              'Administrador'
            );
          }

          setToast({ message: 'Estabelecimento excluído com sucesso!', type: 'success' });
          forceRefresh();
        } else {
          setToast({ message: 'Erro ao excluir estabelecimento.', type: 'error' });
        }
      } catch (error) {
        console.error('Erro ao excluir:', error);
        setToast({ message: 'Erro ao excluir estabelecimento.', type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleSaveEstablishment = async (establishmentData: any) => {
    try {
      console.log('📝 Dados recebidos para salvar:', establishmentData);

      // Get current user UUID from localStorage (custom auth system)
      let currentUserId: string | null = null;

      try {
        const savedUser = localStorage.getItem('tms-user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);

          // Get user UUID from database using email
          if (userData.email) {
            const { data: dbUser } = await supabase
              .from('users')
              .select('id')
              .eq('email', userData.email)
              .maybeSingle();

            if (dbUser?.id) {
              currentUserId = dbUser.id;
            }
          }
        }
      } catch (err) {
        console.error('Erro ao obter UUID do usuário:', err);
      }

      const dataToSave: any = {
        codigo: establishmentData.codigo,
        cnpj: establishmentData.cnpj,
        inscricao_estadual: establishmentData.inscricaoEstadual,
        razao_social: establishmentData.razaoSocial,
        fantasia: establishmentData.fantasia,
        endereco: establishmentData.endereco,
        bairro: establishmentData.bairro,
        cep: establishmentData.cep,
        cidade: establishmentData.cidade,
        estado: establishmentData.estado,
        tipo: establishmentData.tipo,
        tracking_prefix: establishmentData.trackingPrefix,
        logo_light_base64: establishmentData.logoLightBase64,
        logo_dark_base64: establishmentData.logoDarkBase64,
        logo_nps_base64: establishmentData.logoNpsBase64,
        email_config: establishmentData.emailConfig,
      };

      console.log('💾 Dados formatados para salvar:', dataToSave);

      if (editingEstablishment) {
        // For update, only set updated_by
        if (currentUserId) {
          dataToSave.updated_by = currentUserId;
        }

        console.log('✏️ Atualizando estabelecimento:', editingEstablishment.id);
        const updated = await establishmentsService.update(editingEstablishment.id, dataToSave);

        if (updated) {
          console.log('✅ Estabelecimento atualizado com sucesso!');
          await logUpdate(
            'establishment',
            editingEstablishment.id,
            editingEstablishment,
            updated,
            1,
            'Administrador'
          );

          setToast({ message: 'Estabelecimento atualizado com sucesso!', type: 'success' });
        } else {
          console.error('❌ Falha ao atualizar estabelecimento');
          setToast({ message: 'Erro ao atualizar estabelecimento.', type: 'error' });
          return;
        }
      } else {
        // For create, set both created_by and updated_by
        if (currentUserId) {
          dataToSave.created_by = currentUserId;
          dataToSave.updated_by = currentUserId;
        }

        console.log('➕ Criando novo estabelecimento...');
        const newEstablishment = await establishmentsService.create(dataToSave);

        if (newEstablishment) {
          console.log('✅ Estabelecimento criado com sucesso!');
          await logCreate(
            'establishment',
            newEstablishment.id,
            newEstablishment,
            1,
            'Administrador'
          );

          setToast({ message: 'Estabelecimento criado com sucesso!', type: 'success' });
        } else {
          console.error('❌ Falha ao criar estabelecimento');
          setToast({ message: 'Erro ao criar estabelecimento.', type: 'error' });
          return;
        }
      }

      setShowForm(false);
      setEditingEstablishment(null);
      forceRefresh();
    } catch (error: any) {
      console.error('❌ Erro ao salvar estabelecimento:', error);
      const errorMessage = error?.message || 'Erro ao salvar estabelecimento. Tente novamente.';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleBackToList = () => {
    setShowForm(false);
    setShowView(false);
    setEditingEstablishment(null);
    setViewingEstablishment(null);
  };

  const handleExport = () => {
    alert('Funcionalidade de exportação em desenvolvimento');
  };

  const uniqueStates = Array.from(new Set(establishments.map(e => e.estado))).sort();

  if (showForm) {
    return (
      <EstablishmentForm
        onBack={handleBackToList}
        onSave={handleSaveEstablishment}
        establishment={editingEstablishment}
      />
    );
  }

  if (showView && viewingEstablishment) {
    return (
      <EstablishmentView
        onBack={handleBackToList}
        onEdit={() => {
          setShowView(false);
          handleEditEstablishment(viewingEstablishment);
        }}
        establishment={viewingEstablishment}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estabelecimentos</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie o cadastro de estabelecimentos da empresa</p>
        </div>
        <button
          onClick={handleNewEstablishment}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Novo Estabelecimento</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por razão social, fantasia, CNPJ, código ou CEP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Filter size={20} className="text-gray-400" />
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Todos">Todos os Estados</option>
                  {uniqueStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download size={20} />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando estabelecimentos...</p>
          </div>
        ) : filteredEstablishments.length === 0 ? (
          <div className="p-12 text-center">
            <Building className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum estabelecimento encontrado</h3>
            <p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou cadastrar um novo estabelecimento.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {displayedEstablishments.map(establishment => (
                <EstablishmentCard
                  key={establishment.id}
                  establishment={establishment}
                  onView={handleViewEstablishment}
                  onEdit={handleEditEstablishment}
                  onDelete={handleDeleteEstablishment}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredEstablishments.length)} de {filteredEstablishments.length} estabelecimentos
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:bg-gray-900"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900">
                    {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:bg-gray-900"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {confirmDialog.isOpen && (
        <ConfirmDialog
          title={confirmDialog.canDelete ? "Confirmar Exclusão" : "Não é Possível Excluir"}
          message={
            confirmDialog.canDelete
              ? `Tem certeza que deseja excluir o estabelecimento ${confirmDialog.establishmentName}? Esta ação não pode ser desfeita.`
              : confirmDialog.reason || "Este estabelecimento não pode ser excluído."
          }
          type={confirmDialog.canDelete ? "danger" : "error"}
          errorMode={!confirmDialog.canDelete}
          confirmText="Excluir"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDialog({ isOpen: false })}
        />
      )}
    </div>
  );
};
