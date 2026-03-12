import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Download, FileText, CheckCircle, XCircle, AlertCircle, Clock, Truck, MapPin, DollarSign, FileCheck, Printer, RefreshCw, Eye, Clock as ArrowClockwise, ThumbsUp, ThumbsDown, Calendar, User, Upload, Bug } from 'lucide-react';
import { InvoicesFilters } from './InvoicesFilters';
import { InvoicesTable } from './InvoicesTable';
import { InvoicesActions } from './InvoicesActions';
import { InvoiceDetailsModal } from './InvoiceDetailsModal';
import { InvoiceCTesModal } from './InvoiceCTesModal';
import { InvoiceForm } from './InvoiceForm';
import { SchedulePickupModal } from './SchedulePickupModal';
import { BulkXmlUploadModal } from './BulkXmlUploadModal';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { AutoDownloadStatus } from '../common/AutoDownloadStatus';
import { AutoImportDebugModal } from '../common/AutoImportDebugModal';
import { establishmentsService } from '../../services/establishmentsService';
import { nfeService, NFeWithCustomer } from '../../services/nfeService';
import { pickupsService } from '../../services/pickupsService';
import { invoicesService } from '../../services/invoicesService';
import { useAuth } from '../../hooks/useAuth';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';

const convertNFeToInvoiceFormat = (nfe: NFeWithCustomer) => ({
  id: nfe.id,
  status: nfe.status || 'nfe_emitida',
  baseCusto: 'tabela',
  serie: nfe.series,
  numero: nfe.number,
  dataEmissao: nfe.issue_date,
  dataEntrada: nfe.created_at,
  transportador: nfe.carrier
    ? `${nfe.carrier.codigo} - ${nfe.carrier.fantasia || nfe.carrier.razao_social}`
    : '',
  cliente: nfe.customer?.name || 'Cliente não especificado',
  cidadeDestino: nfe.customer?.city || '',
  ufDestino: nfe.customer?.state || '',
  valorNFe: parseFloat(nfe.total_value.toString()),
  chaveAcesso: nfe.access_key,
  cteCount: 0
});

export const Invoices: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCTesModal, setShowCTesModal] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showSchedulePickupModal, setShowSchedulePickupModal] = useState(false);
  const [showBulkXmlUploadModal, setShowBulkXmlUploadModal] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [currentEstablishment, setCurrentEstablishment] = useState<{id: string, name: string} | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    invoiceId?: string;
    invoiceNumber?: string;
    action?: string;
  }>({ isOpen: false });
  const [filters, setFilters] = useState({
    transportador: '',
    cliente: '',
    periodoEmissao: { start: '', end: '' },
    periodoEntrada: { start: '', end: '' },
    ufDestino: '',
    cidadeDestino: '',
    status: [] as string[],
    baseCusto: '',
    numeroOuChave: ''
  });

  const breadcrumbItems = [
    { label: 'Documentos Operacionais' },
    { label: 'Notas Fiscais', current: true }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const establishments = await establishmentsService.getAll();
        if (establishments.length > 0) {
          const first = establishments[0];
          setCurrentEstablishment({
            id: first.id,
            name: `${first.codigo} - ${first.razao_social}`
          });
        }
      } catch (error) {
        console.error('Erro ao carregar estabelecimento:', error);
      }
    };

    loadData();
    refreshData();
  }, []);

  // Apply filters to invoices
  useEffect(() => {
    const applyFilters = () => {
      let result = [...invoices];
      
      // Filter by transportador
      if (filters.transportador) {
        result = result.filter(invoice => 
          invoice.transportador.toLowerCase().includes(filters.transportador.toLowerCase())
        );
      }
      
      // Filter by cliente
      if (filters.cliente) {
        result = result.filter(invoice => 
          invoice.cliente.toLowerCase().includes(filters.cliente.toLowerCase())
        );
      }
      
      // Filter by período de emissão
      if (filters.periodoEmissao.start && filters.periodoEmissao.end) {
        const startDate = new Date(filters.periodoEmissao.start);
        const endDate = new Date(filters.periodoEmissao.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        result = result.filter(invoice => {
          const emissaoDate = new Date(invoice.dataEmissao);
          return emissaoDate >= startDate && emissaoDate <= endDate;
        });
      }
      
      // Filter by período de entrada
      if (filters.periodoEntrada.start && filters.periodoEntrada.end) {
        const startDate = new Date(filters.periodoEntrada.start);
        const endDate = new Date(filters.periodoEntrada.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        result = result.filter(invoice => {
          const entradaDate = new Date(invoice.dataEntrada);
          return entradaDate >= startDate && entradaDate <= endDate;
        });
      }
      
      // Filter by UF destino
      if (filters.ufDestino) {
        result = result.filter(invoice => invoice.ufDestino === filters.ufDestino);
      }
      
      // Filter by cidade destino
      if (filters.cidadeDestino) {
        result = result.filter(invoice => 
          invoice.cidadeDestino.toLowerCase().includes(filters.cidadeDestino.toLowerCase())
        );
      }
      
      // Filter by status
      if (filters.status.length > 0) {
        result = result.filter(invoice => filters.status.includes(invoice.status));
      }

      // Filter by base de custo
      if (filters.baseCusto) {
        result = result.filter(invoice => invoice.baseCusto === filters.baseCusto);
      }
      
      // Filter by número ou chave
      if (filters.numeroOuChave) {
        result = result.filter(invoice => 
          invoice.numero.includes(filters.numeroOuChave) || 
          invoice.chaveAcesso.includes(filters.numeroOuChave)
        );
      }
      
      setFilteredInvoices(result);
    };
    
    applyFilters();
  }, [invoices, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedInvoices(filteredInvoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedInvoices.length === 0) {
      setToast({ message: 'Por favor, selecione pelo menos uma nota fiscal para realizar esta ação.', type: 'warning' });
      return;
    }

    if (action === 'create-pickup') {
      handleCreatePickups();
      return;
    }

    if (action === 'schedule-pickup') {
      setShowSchedulePickupModal(true);
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      switch (action) {
        case 'print':
          setToast({ message: `DANFE gerado para ${selectedInvoices.length} nota(s) fiscal(is).`, type: 'success' });
          break;
        case 'download':
          setToast({ message: `XML de ${selectedInvoices.length} nota(s) fiscal(is) baixado(s) com sucesso!`, type: 'success' });
          break;
        default:
          break;
      }

      setIsLoading(false);
      // Clear selection after action
      setSelectedInvoices([]);
    }, 1000);
  };

  const handleCreatePickups = async () => {
    if (!currentEstablishment || !user) {
      setToast({ message: 'Estabelecimento ou usuário não identificado', type: 'error' });
      return;
    }

    const selectedInvoicesData = await nfeService.getByIds(selectedInvoices);

    if (selectedInvoicesData.length === 0) {
      setToast({ message: 'Nenhuma nota fiscal encontrada', type: 'error' });
      return;
    }

    const invoicesByCarrier = selectedInvoicesData.reduce((acc: any, invoice: any) => {
      const carrierName = invoice.carrier?.razao_social || 'Sem Transportador';
      if (!acc[carrierName]) {
        acc[carrierName] = [];
      }
      acc[carrierName].push(invoice);
      return acc;
    }, {});

    const carriers = Object.keys(invoicesByCarrier);
    const pickupsToCreate = carriers.length;

    if (pickupsToCreate > 1) {
      let message = `As notas selecionadas possuem ${pickupsToCreate} transportadores diferentes:\n\n`;
      carriers.forEach((carrier, index) => {
        const invoiceCount = invoicesByCarrier[carrier].length;
        message += `${index + 1}. ${carrier}: ${invoiceCount} nota${invoiceCount > 1 ? 's' : ''}\n`;
      });
      message += `\nSerão criadas ${pickupsToCreate} coletas separadas. Deseja continuar?`;

      if (!confirm(message)) {
        return;
      }
    }

    setConfirmDialog({
      isOpen: true,
      action: 'create-pickups',
      invoiceNumber: `${pickupsToCreate} coleta(s)`
    });

    (window as any).__pendingPickupCreation = async () => {
      setIsLoading(true);
      try {
        const result = await pickupsService.createFromNfes({
          invoiceIds: selectedInvoices,
          establishmentId: currentEstablishment.id,
          userId: user.id
        });

        if (result.success && result.pickups) {
          let message = `${result.pickups.length} coleta(s) criada(s) com sucesso!\n\n`;
          result.pickups.forEach((pickup, index) => {
            message += `${index + 1}. ${pickup.pickupNumber} - ${pickup.carrierName} (${pickup.invoiceCount} nota${pickup.invoiceCount > 1 ? 's' : ''})\n`;
          });

          if (result.warning) {
            setToast({ message: result.warning + '\n\n' + message, type: 'success' });
          } else {
            setToast({ message, type: 'success' });
          }

          setSelectedInvoices([]);
          refreshData();
        } else {
          setToast({ message: result.error || 'Erro ao criar coletas', type: 'error' });
        }
      } catch (error) {
        console.error('Erro ao criar coletas:', error);
        setToast({ message: 'Erro ao criar coletas', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
  };

  const handleSingleAction = (invoiceId: number, action: string) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const invoice = invoices.find(i => i.id === invoiceId);
      
      if (!invoice) {
        setIsLoading(false);
        return;
      }
      
      switch (action) {
        case 'view-ctes':
          setSelectedInvoice(invoice);
          setShowCTesModal(true);
          break;
        case 'view-details':
          setSelectedInvoice(invoice);
          setShowDetailsModal(true);
          break;
        case 'print':
          setToast({ message: `DANFE gerado para a nota fiscal ${invoice.numero}.`, type: 'success' });
          break;
        case 'download':
          setToast({ message: `XML da nota fiscal ${invoice.numero} baixado com sucesso!`, type: 'success' });
          break;
        case 'delete':
          setConfirmDialog({
            isOpen: true,
            invoiceId: invoiceId.toString(),
            invoiceNumber: invoice.numero,
            action: 'delete'
          });
          setIsLoading(false);
          return;
        default:
          break;
      }

      setIsLoading(false);
    }, 500);
  };

  const refreshData = async () => {
    setIsLoading(true);

    try {
      const nfes = await nfeService.getAll();
      const formattedInvoices = nfes.map(convertNFeToInvoiceFormat);
      setInvoices(formattedInvoices);
    } catch (error) {
      console.error('Erro ao carregar notas fiscais:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (confirmDialog.action === 'create-pickups') {
      if ((window as any).__pendingPickupCreation) {
        (window as any).__pendingPickupCreation();
        delete (window as any).__pendingPickupCreation;
      }
    } else if (confirmDialog.invoiceId && confirmDialog.invoiceNumber) {
      try {
        const result = await nfeService.delete(confirmDialog.invoiceId);
        if (result.success) {
          setToast({ message: `Nota Fiscal ${confirmDialog.invoiceNumber} excluída com sucesso!`, type: 'success' });
          refreshData();
        } else {
          setToast({ message: `Erro ao excluir Nota Fiscal: ${result.error}`, type: 'error' });
        }
      } catch (error) {
        console.error('Erro ao excluir nota fiscal:', error);
        setToast({ message: 'Erro ao excluir nota fiscal.', type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  if (showInvoiceForm) {
    if (!currentEstablishment) {
      return (
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg text-gray-700 dark:text-gray-300">Carregando estabelecimento...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <InvoiceForm
          onBack={() => setShowInvoiceForm(false)}
          onSave={() => {
            setShowInvoiceForm(false);
            refreshData();
          }}
          establishmentId={currentEstablishment.id}
          establishmentName={currentEstablishment.name}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center gap-3">
        {currentEstablishment && (
          <div className="flex-1">
            <AutoDownloadStatus establishmentId={currentEstablishment.id} />
          </div>
        )}
        <button
          onClick={() => setShowDebugModal(true)}
          className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors border border-gray-300"
          title="Debug - Importação Automática"
        >
          <Bug size={18} />
          <span className="font-medium">Debug Auto-Import</span>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notas Fiscais</h1>
          <p className="text-gray-600 dark:text-gray-400">Visualize, audite e gerencie todas as Notas Fiscais importadas no sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowInvoiceForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Inserir Nota Fiscal</span>
          </button>
          <button
            onClick={() => setShowBulkXmlUploadModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Upload size={20} />
            <span>Inserir XML em Lote</span>
          </button>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Carregando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de NF-es</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{invoices.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Emitidas</p>
              <p className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mt-1">
                {invoices.filter(invoice => invoice.status === 'nfe_emitida' || invoice.status === 'emitida').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Coletadas</p>
              <p className="text-2xl font-semibold text-blue-400 mt-1">
                {invoices.filter(invoice => invoice.status === 'coletado_transportadora').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck size={20} className="text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Em Trânsito</p>
              <p className="text-2xl font-semibold text-blue-600 mt-1">
                {invoices.filter(invoice => invoice.status === 'em_transito').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saiu p/ Entrega</p>
              <p className="text-2xl font-semibold text-orange-600 mt-1">
                {invoices.filter(invoice => invoice.status === 'saiu_entrega').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Truck size={20} className="text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entregues</p>
              <p className="text-2xl font-semibold text-green-600 mt-1">
                {invoices.filter(invoice => invoice.status === 'entregue').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Canceladas</p>
              <p className="text-2xl font-semibold text-red-600 mt-1">
                {invoices.filter(invoice => invoice.status === 'cancelada').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle size={20} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <InvoicesFilters 
        onFilterChange={handleFilterChange} 
        filters={filters}
      />

      {/* Bulk Actions */}
      <InvoicesActions 
        selectedCount={selectedInvoices.length}
        onAction={handleBulkAction}
        isLoading={isLoading}
      />

      {/* Invoices Table */}
      <InvoicesTable
        invoices={filteredInvoices}
        selectedInvoices={selectedInvoices}
        onSelectAll={handleSelectAll}
        onSelectInvoice={handleSelectInvoice}
        onAction={handleSingleAction}
        isLoading={isLoading}
        userProfile={user?.perfil}
      />

      {/* No Results */}
      {filteredInvoices.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma nota fiscal encontrada</h3>
          <p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou importar novas notas fiscais.</p>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl flex items-center space-x-4">
            <RefreshCw size={24} className="text-blue-600 animate-spin" />
            <p className="text-gray-800 dark:text-gray-200 font-medium">Processando...</p>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showDetailsModal && selectedInvoice && (
        <InvoiceDetailsModal 
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          invoice={selectedInvoice}
        />
      )}

      {/* Invoice CTes Modal */}
      {showCTesModal && selectedInvoice && (
        <InvoiceCTesModal
          isOpen={showCTesModal}
          onClose={() => setShowCTesModal(false)}
          invoiceId={selectedInvoice.id}
          invoiceNumber={selectedInvoice.numero}
        />
      )}

      {/* Schedule Pickup Modal */}
      {showSchedulePickupModal && (
        <SchedulePickupModal
          isOpen={showSchedulePickupModal}
          onClose={() => setShowSchedulePickupModal(false)}
          selectedInvoices={invoices.filter(inv => selectedInvoices.includes(inv.id))}
          establishmentId={currentEstablishment?.id}
          onSuccess={() => {
            setToast({ message: 'Agendamento de coleta criado com sucesso!', type: 'success' });
            setSelectedInvoices([]);
            refreshData();
          }}
        />
      )}

      {/* Bulk XML Upload Modal */}
      {showBulkXmlUploadModal && currentEstablishment && (
        <BulkXmlUploadModal
          isOpen={showBulkXmlUploadModal}
          onClose={() => setShowBulkXmlUploadModal(false)}
          establishmentId={currentEstablishment.id}
          onSuccess={() => {
            setToast({ message: 'XMLs importados com sucesso!', type: 'success' });
            refreshData();
          }}
        />
      )}

      {/* Auto Import Debug Modal */}
      <AutoImportDebugModal
        isOpen={showDebugModal}
        onClose={() => setShowDebugModal(false)}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && confirmDialog.invoiceNumber && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.action === 'create-pickups' ? 'Confirmar Criação de Coletas' : 'Confirmar Exclusão'}
          message={
            confirmDialog.action === 'create-pickups'
              ? `Deseja confirmar a criação de ${confirmDialog.invoiceNumber}?`
              : `Tem certeza que deseja excluir a Nota Fiscal ${confirmDialog.invoiceNumber}? Esta ação não pode ser desfeita.`
          }
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDialog({ isOpen: false })}
        />
      )}
    </div>
  );
};