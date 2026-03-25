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
import { useTranslation } from 'react-i18next';

export const Establishments: React.FC = () => {
  const { t } = useTranslation();
  const breadcrumbItems = [
    { label: t('establishments.title') },
    { label: t('establishments.title'), current: true }
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
      setIsLoading(true);

      // Buscar email do localStorage (autenticação customizada)
      const savedUser = localStorage.getItem('tms-user');
      if (!savedUser) {
        setEstablishments([]);
        return;
      }

      let userEmail: string;
      try {
        const userData = JSON.parse(savedUser);
        userEmail = userData.email;
      } catch (parseError) {
        setEstablishments([]);
        return;
      }      // Buscar todos os estabelecimentos via service (o RLS e o backend governam a visibilidade)
      let data = await establishmentsService.getAll();
      
      console.log('👀 [Establishments.tsx] setEstablishments chamado com', data.length, 'itens');
      setEstablishments(data);
    } catch (error) {
      setToast({ message: t('establishments.messages.loadError'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const forceRefresh = () => {
    loadEstablishments();
  };

  const filteredEstablishments = establishments.filter(establishment => {
    const searchLow = searchTerm.toLowerCase();
    const razao = (establishment.razao_social || '').toLowerCase();
    const fantasia = (establishment.fantasia || establishment.nome_fantasia || '').toLowerCase();
    const cnpj = establishment.cnpj || '';
    const codigo = (establishment.codigo || '').toString();
    const cep = establishment.cep || '';
    
    const matchesSearch = razao.includes(searchLow) ||
                         fantasia.includes(searchLow) ||
                         cnpj.includes(searchTerm) ||
                         codigo.includes(searchTerm) ||
                         cep.includes(searchTerm);
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
      setToast({ message: t('establishments.messages.notFound'), type: 'error' });
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

          setToast({ message: t('establishments.messages.deleteSuccess'), type: 'success' });
          forceRefresh();
        } else {
          setToast({ message: t('establishments.messages.deleteError'), type: 'error' });
        }
      } catch (error) {
        setToast({ message: t('establishments.messages.deleteError'), type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleSaveEstablishment = async (establishmentData: any) => {
    try {
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
        email_config: establishmentData.email_config,
      };
      if (editingEstablishment) {
        // For update, only set updated_by
        if (currentUserId) {
          dataToSave.updated_by = currentUserId;
        }
        const updated = await establishmentsService.update(editingEstablishment.id, dataToSave);

        if (updated) {
          await logUpdate(
            'establishment',
            editingEstablishment.id,
            editingEstablishment,
            updated,
            1,
            'Administrador'
          );

          setToast({ message: t('establishments.messages.updateSuccess'), type: 'success' });
        } else {
          setToast({ message: t('establishments.messages.updateError'), type: 'error' });
          return;
        }
      } else {
        // For create, set both created_by and updated_by
        if (currentUserId) {
          dataToSave.created_by = currentUserId;
          dataToSave.updated_by = currentUserId;
        }
        const newEstablishment = await establishmentsService.create(dataToSave);

        if (newEstablishment) {
          await logCreate(
            'establishment',
            newEstablishment.id,
            newEstablishment,
            1,
            'Administrador'
          );

          setToast({ message: t('establishments.messages.createSuccess'), type: 'success' });
        } else {
          setToast({ message: t('establishments.messages.createError'), type: 'error' });
          return;
        }
      }

      setShowForm(false);
      setEditingEstablishment(null);
      forceRefresh();
    } catch (error: any) {
      const errorMessage = error?.message || t('establishments.messages.saveError');
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
    alert(t('establishments.messages.exportWarning'));
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('establishments.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('establishments.subtitle')}</p>
        </div>
        <button
          onClick={handleNewEstablishment}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size="1.25rem" />
          <span>{t('establishments.buttons.new')}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size="1.25rem" />
                <input
                  type="text"
                  placeholder={t('establishments.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Filter size="1.25rem" className="text-gray-400" />
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Todos">{t('establishments.stateFilter')}</option>
                  {uniqueStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download size="1.25rem" />
                <span>{t('establishments.buttons.export')}</span>
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">{t('establishments.emptyState.loading')}</p>
          </div>
        ) : filteredEstablishments.length === 0 ? (
          <div className="p-12 text-center">
            <Building className="mx-auto text-gray-400 mb-4" size="3rem" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('establishments.emptyState.title')}</h3>
            <p className="text-gray-600 dark:text-gray-400">{t('establishments.emptyState.desc')}</p>
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
                  {t('establishments.pagination.showing')} {startIndex + 1} {t('establishments.pagination.to')} {Math.min(startIndex + itemsPerPage, filteredEstablishments.length)} {t('establishments.pagination.of')} {filteredEstablishments.length} {t('establishments.pagination.establishments')}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:bg-gray-900"
                  >
                    {t('establishments.pagination.previous')}
                  </button>
                  <span className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900">
                    {currentPage} {t('establishments.pagination.of')} {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:bg-gray-900"
                  >
                    {t('establishments.pagination.next')}
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
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.canDelete ? t('establishments.confirmDialog.deleteTitle') : t('establishments.confirmDialog.cantDeleteTitle')}
          message={
            confirmDialog.canDelete
              ? t('establishments.confirmDialog.deleteMessage', { name: confirmDialog.establishmentName })
              : confirmDialog.reason || t('establishments.confirmDialog.cantDeleteMessage')
          }
          type={confirmDialog.canDelete ? "danger" : "error"}
          errorMode={!confirmDialog.canDelete}
          confirmText={t('establishments.confirmDialog.confirmText')}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDialog({ isOpen: false })}
        />
      )}
    </div>
  );
};
