import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Package, RefreshCw, Send } from 'lucide-react';
import { PickupsFilters } from './PickupsFilters';
import { PickupsTable } from './PickupsTable';
import { PickupsActions } from './PickupsActions';
import { PickupDetailsModal } from './PickupDetailsModal';
import { RelationshipMapModal } from '../RelationshipMap/RelationshipMapModal';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { pickupsService } from '../../services/pickupsService';
import { pickupPdfService } from '../../services/pickupPdfService';
import { pickupRequestService } from '../../services/pickupRequestService';
import { useAuth } from '../../hooks/useAuth';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useActivityLogger } from '../../hooks/useActivityLogger';

export const Pickups: React.FC<{ initialId?: string }> = ({ initialId }) => {
  const { t } = useTranslation();

  const { user } = useAuth();
  
  useActivityLogger('Coletas', 'Acesso', 'Acessou a Gestão de Coletas');

  const [pickups, setPickups] = useState<any[]>([]);
  const [filteredPickups, setFilteredPickups] = useState<any[]>([]);
  const [selectedPickups, setSelectedPickups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRelationshipMap, setShowRelationshipMap] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; action: 'cancelar' | 'realizar' | 'delete' | null; message: string; title: string; targetIds: string[] }>({ 
    isOpen: false, action: null, message: '', title: '', targetIds: [] 
  });
  const [filters, setFilters] = useState({
    transportador: '',
    numeroColeta: '',
    dataCriacao: { start: '', end: '' },
    status: [] as string[],
    usuarioResponsavel: '',
    enderecoColeta: ''
  });

  const breadcrumbItems = [
    { label: t('pickups.breadcrumb.operationalDocs') },
    { label: t('pickups.breadcrumb.pickups'), current: true }
  ];

  // Load pickups from Supabase
  useEffect(() => {
    refreshData();
  }, []);

  // Handle initial pickup from navigation
  const [lastOpenedInitialId, setLastOpenedInitialId] = useState<string | null>(null);
  useEffect(() => {
    if (initialId && pickups.length > 0 && initialId !== lastOpenedInitialId) {
      setLastOpenedInitialId(initialId);
      handleSingleAction(initialId, 'view-details');
    }
  }, [initialId, pickups, lastOpenedInitialId]);

  // Apply filters to pickups
  useEffect(() => {
    const applyFilters = () => {
      let result = [...pickups];

      // Filter by transportador
      if (filters.transportador) {
        result = result.filter(pickup =>
          pickup.transportador.toLowerCase().includes(filters.transportador.toLowerCase())
        );
      }

      // Filter by número da coleta
      if (filters.numeroColeta) {
        result = result.filter(pickup =>
          pickup.numeroColeta.includes(filters.numeroColeta)
        );
      }

      // Filter by data de criação
      if (filters.dataCriacao.start && filters.dataCriacao.end) {
        const startDate = new Date(filters.dataCriacao.start);
        const endDate = new Date(filters.dataCriacao.end);
        endDate.setHours(23, 59, 59, 999);

        result = result.filter(pickup => {
          const criacaoDate = new Date(pickup.dataCriacao);
          return criacaoDate >= startDate && criacaoDate <= endDate;
        });
      }

      // Filter by status
      if (filters.status.length > 0) {
        result = result.filter(pickup => filters.status.includes(pickup.status));
      }

      // Filter by usuário responsável
      if (filters.usuarioResponsavel) {
        result = result.filter(pickup =>
          pickup.usuarioResponsavel.toLowerCase().includes(filters.usuarioResponsavel.toLowerCase())
        );
      }

      // Filter by endereço de coleta
      if (filters.enderecoColeta) {
        result = result.filter(pickup =>
          pickup.enderecoColeta.toLowerCase().includes(filters.enderecoColeta.toLowerCase())
        );
      }

      setFilteredPickups(result);
    };

    applyFilters();
  }, [pickups, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedPickups(filteredPickups.map(pickup => String(pickup.id)));
    } else {
      setSelectedPickups([]);
    }
  };

  const handleSelectPickup = (pickupId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedPickups(prev => [...prev, pickupId]);
    } else {
      setSelectedPickups(prev => prev.filter(id => id !== pickupId));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedPickups.length === 0) {
      setToast({ message: t('pickups.messages.selectAtLeastOneAction'), type: 'warning' });
      return;
    }

    setIsLoading(true);

    try {
      if (action === 'solicitar-coleta') {
        let successGroupsCount = 0;
        let errorMessages: string[] = [];
        
        const groups: Record<string, any[]> = {};
        
        for (const pickupId of selectedPickups) {
          const data = await pickupsService.getById(pickupId);
          if (data) {
            const carrierKey = data.carrier_id || 'manual';
            if (!groups[carrierKey]) groups[carrierKey] = [];
            groups[carrierKey].push(data);
          }
        }

        for (const carrierKey in groups) {
          const groupData = groups[carrierKey];
          const hasEmail = groupData[0].carrier_email;
          
          if (hasEmail) {
             const fullPickups = groupData.map(data => ({
               ...data,
               numeroColeta: data.pickup_number || data.id,
               dataCriacao: data.created_at,
               transportador: data.carrier_name,
               usuarioResponsavel: data.contact_name,
               logradouro: data.pickup_address,
               cidade: data.pickup_city,
               estado: data.pickup_state,
               cep: data.pickup_zip,
               quantidadeNotas: data.packages_quantity || 0,
               total_weight: data.total_weight || 0,
               total_volume: data.total_volume || 0
             }));

             const pdfBase64 = pickupPdfService.generatePickupPDF(fullPickups, 'base64' as any);
             
             const res = await pickupRequestService.requestPickup({
               pickupIds: groupData.map(p => p.id),
               notificationMethod: 'email',
               carrierEmail: groupData[0].carrier_email || '',
               carrierPhone: '',
               userId: user?.id || null,
               userName: user?.name || 'Sistema',
               pdfBase64: pdfBase64,
               establishmentId: groupData[0].establishment_id || ''
             });

             if (res.success) {
               successGroupsCount += groupData.length;
             } else {
               errorMessages.push(`Erro na transportadora ${groupData[0].carrier_name}: ${res.error}`);
             }
          } else {
             // If no email, just update status
             for (const p of groupData) {
               const res = await pickupsService.updateStatus(p.id, 'solicitada');
               if (res.success) successGroupsCount++;
             }
          }
        }
        
        if (successGroupsCount > 0) {
          setToast({ 
            message: `${successGroupsCount} coleta(s) solicitada(s) / agrupada(s) com sucesso ao transportador!${errorMessages.length > 0 ? '\n\nAlguns erros ocorreram:\n' + errorMessages.join('\n') : ''}`, 
            type: errorMessages.length > 0 ? 'warning' : 'success' 
          });
          await refreshData();
        } else {
          setToast({ message: `Falha ao processar solicitação de coleta(s).\n\n${errorMessages.join('\n')}`, type: 'error' });
        }
      } else if (action === 'cancelar') {
        setConfirmDialog({
          isOpen: true,
          action: 'cancelar',
          title: t('pickups.dialogs.cancelBulkTitle'),
          message: t('pickups.dialogs.cancelBulkMessage', { count: selectedPickups.length }),
          targetIds: selectedPickups
        });
      } else if (action === 'realizar') {
        setConfirmDialog({
          isOpen: true,
          action: 'realizar',
          title: t('pickups.dialogs.doneBulkTitle'),
          message: t('pickups.dialogs.doneBulkMessage', { count: selectedPickups.length }),
          targetIds: selectedPickups
        });
      } else if (action === 'print' || action === 'download') {
        const fullPickupsToPrint = await Promise.all(
          selectedPickups.map(async (id) => {
            const data = await pickupsService.getById(id);
            if (data) {
                return {
                   ...data,
                   numeroColeta: data.pickup_number || data.id,
                   dataCriacao: data.created_at,
                   transportador: data.carrier_name,
                   usuarioResponsavel: data.contact_name,
                   logradouro: data.pickup_address,
                   cidade: data.pickup_city,
                   estado: data.pickup_state,
                   cep: data.pickup_zip,
                   quantidadeNotas: data.packages_quantity || 0,
                   total_weight: data.total_weight || 0,
                   total_volume: data.total_volume || 0
                };
            }
            return data;
          })
        );
        
        const validPickups = fullPickupsToPrint.filter(p => !!(p && p.id));
        
        if (validPickups.length === 0) {
           setToast({ message: t('pickups.messages.errorFetchData'), type: 'error' });
           setIsLoading(false);
           return;
        }

        if (action === 'download') {
          pickupPdfService.generatePickupPDF(validPickups, 'download');
        } else {
          const pdfUrl = pickupPdfService.generatePickupPDF(validPickups, 'print');
          const printWindow = window.open(pdfUrl, '_blank');
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.print();
            };
          }
        }
      }
    } catch (error) {
// null
      setToast({ message: t('pickups.messages.errorProcessAction'), type: 'error' });
    } finally {
      setIsLoading(false);
      setSelectedPickups([]);
    }
  };

  const handleSingleAction = (pickupId: string | number, action: string) => {
    setIsLoading(true);

    setTimeout(() => {
      const pickup = pickups.find(p => p.id.toString() === pickupId.toString());

      if (!pickup) {
        setIsLoading(false);
        return;
      }

      switch (action) {
        case 'view-details':
          setSelectedPickup(pickup);
          setShowDetailsModal(true);
          break;
        case 'view-relationship-map':
          setSelectedPickup(pickup);
          setShowRelationshipMap(true);
          break;
        case 'realizar':
          setConfirmDialog({
            isOpen: true,
            action: 'realizar',
            title: t('pickups.dialogs.doneSingleTitle'),
            message: t('pickups.dialogs.doneSingleMessage', { numero: pickup.numeroColeta }),
            targetIds: [pickupId.toString()]
          });
          break;
        case 'cancelar':
          setConfirmDialog({
            isOpen: true,
            action: 'cancelar',
            title: t('pickups.dialogs.cancelSingleTitle'),
            message: t('pickups.dialogs.cancelSingleMessage', { numero: pickup.numeroColeta }),
            targetIds: [pickupId.toString()]
          });
          break;
        case 'delete':
          setConfirmDialog({
            isOpen: true,
            action: 'delete',
            title: t('pickups.dialogs.deleteSingleTitle'),
            message: t('pickups.dialogs.deleteSingleMessage', { numero: pickup.numeroColeta }),
            targetIds: [pickupId.toString()]
          });
          break;
        default:
          break;
      }

      setIsLoading(false);
    }, 500);
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const data = await pickupsService.getAll();
      const formattedPickups = data.map((pickup: any) => ({
        id: pickup.id,
        numeroColeta: pickup.pickup_number || `COL-${pickup.id}`,
        status: pickup.status,
        transportador: pickup.carrier_name || 'N/A',
        quantidadeNotas: pickup.packages_quantity || 0,
        dataCriacao: pickup.created_at,
        usuarioResponsavel: pickup.usuarioResponsavel || pickup.customer_name || pickup.contact_name || 'N/A',
        enderecoColeta: `${pickup.pickup_city} - ${pickup.pickup_state}`,
        valorTotal: pickup.total_volume || 0,
        dataSolicitacao: pickup.requested_at || pickup.scheduled_date,
        dataRealizacao: pickup.actual_pickup_date || pickup.completed_at,
        observacoes: pickup.observations || ''
      }));
      setPickups(formattedPickups);
    } catch (error) {
// null
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.action) return;
    
    setIsLoading(true);
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));

    try {
      if (confirmDialog.action === 'delete') {
         let successCount = 0;
         let errors = 0;
         for (const pickupId of confirmDialog.targetIds) {
           const res = await pickupsService.delete(pickupId);
           if (res.success) successCount++;
           else errors++;
         }
         if (successCount > 0) {
            setToast({ message: `${successCount} coleta(s) excluída(s) com sucesso.`, type: 'success' });
            await refreshData();
         } else if (errors > 0) {
            setToast({ message: `Erro ao excluir coleta(s).`, type: 'error' });
         }
      } else {
        let successCount = 0;
        const newStatus = confirmDialog.action === 'realizar' ? 'realizada' : 'cancelada';
        
        for (const pickupId of confirmDialog.targetIds) {
          const res = await pickupsService.updateStatus(pickupId, newStatus);
          if (res.success) successCount++;
        }
        
        if (successCount > 0) {
          const actionMsg = confirmDialog.action === 'realizar' ? t('pickups.messages.markedAsDone') : t('pickups.messages.markedAsCanceled');
          setToast({ message: `${successCount} coleta(s) ${actionMsg}.`, type: 'success' });
          setPickups(prev => prev.map(pickup => {
            if (confirmDialog.targetIds.includes(pickup.id)) {
              return { ...pickup, status: newStatus };
            }
            return pickup;
          }));
        }
      }
      setSelectedPickups([]); // Limpar seleção após a ação
    } catch (error) {
// null
      setToast({ message: `Erro ao processar as coletas selecionadas.`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('pickups.header.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('pickups.header.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? t('pickups.actions.loading') : t('pickups.actions.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Status Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('pickups.kpis.total')}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{pickups.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Package size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('pickups.status.emitida')}</p>
              <p className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mt-1">
                {pickups.filter(pickup => pickup.status === 'emitida').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Package size={20} className="text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('pickups.status.solicitada')}</p>
              <p className="text-2xl font-semibold text-blue-400 dark:text-blue-400 mt-1">
                {pickups.filter(pickup => pickup.status === 'solicitada').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Send size={20} className="text-blue-400 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('pickups.status.realizada')}</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400 mt-1">
                {pickups.filter(pickup => pickup.status === 'realizada').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('pickups.status.cancelada')}</p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1">
                {pickups.filter(pickup => pickup.status === 'cancelada').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <XCircle size={20} className="text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      <PickupsFilters onFilterChange={handleFilterChange} filters={filters} />

      <PickupsActions
        selectedCount={selectedPickups.length}
        onAction={handleBulkAction}
        isLoading={isLoading}
      />

      <PickupsTable
        pickups={filteredPickups}
        selectedPickups={selectedPickups}
        onSelectAll={handleSelectAll}
        onSelectPickup={handleSelectPickup}
        onAction={handleSingleAction}
        isLoading={isLoading}
      />

      {showDetailsModal && selectedPickup && (
        <PickupDetailsModal
          pickup={selectedPickup}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPickup(null);
          }}
        />
      )}

      {showRelationshipMap && selectedPickup && (
        <RelationshipMapModal
          isOpen={showRelationshipMap}
          onClose={() => {
            setShowRelationshipMap(false);
            setSelectedPickup(null);
          }}
          sourceDocument={{
            id: `pickup-${selectedPickup.id}`,
            type: 'pickup',
            number: selectedPickup.numeroColeta,
            date: selectedPickup.dataCriacao,
            status: selectedPickup.status,
            value: selectedPickup.valorTotal
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.action === 'cancelar' ? t('pickups.dialogs.yesCancel') : confirmDialog.action === 'delete' ? t('pickups.dialogs.yesDelete') : t('pickups.dialogs.yesDone')}
        cancelText={t('pickups.dialogs.back')}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
