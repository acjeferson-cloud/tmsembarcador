import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { FileText, CheckCircle, XCircle, AlertCircle, RefreshCw, Plus, Bug } from 'lucide-react';
import { Toast, ToastType } from '../common/Toast';
import { AutoDownloadStatus } from '../common/AutoDownloadStatus';
import { AutoImportDebugModal } from '../common/AutoImportDebugModal';
import { BillsFilters } from './BillsFilters';
import { BillsTable } from './BillsTable';
import { BillsActions } from './BillsActions';
import { BillDetailsModal } from './BillDetailsModal';
import { BillCTesModal } from './BillCTesModal';
import { BillRejectionModal } from './BillRejectionModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { billsService } from '../../services/billsService';
import { establishmentsService } from '../../services/establishmentsService';
import { RelationshipMapModal } from '../RelationshipMap/RelationshipMapModal';
import { useActivityLogger } from '../../hooks/useActivityLogger';

const normalizeBillStatus = (status: string | undefined | null) => {
  if (!status) return 'Importada';
  const s = status.toLowerCase().trim();
  if (s === 'aprovada' || s.includes('auditada e aprovada') || s.includes('auditada_aprovada')) return 'Auditada e aprovada';
  if (s === 'reprovada' || s.includes('auditada e reprov') || s.includes('auditada_reprovada')) return 'Auditada e reprovada';
  if (s === 'cancelada') return 'Cancelada';
  if (s.includes('referenciada') || s.includes('com_nfe_referenciada') || s.includes('com nf-e')) return 'Com NF-e Referenciada';
  return 'Importada'; 
};

export const Bills: React.FC<{ initialId?: string }> = ({ initialId }) => {
  const breadcrumbItems = [
    { label: 'Documentos Operacionais' },
    { label: 'Conhecimentos', current: true }
  ];

  const [bills, setBills] = useState<any[]>([]);
  const [filteredBills, setFilteredBills] = useState<any[]>([]);
  const [selectedBills, setSelectedBills] = useState<(string | number)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [currentEstablishment, setCurrentEstablishment] = useState<{id: string, name: string} | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCTesModal, setShowCTesModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    billId: '',
    billNumber: '',
    action: ''
  });
  const [showRelationshipMap, setShowRelationshipMap] = useState(false);
  const [filters, setFilters] = useState({
    transportador: '',
    periodoEmissao: { start: '', end: '' },
    periodoVencimento: { start: '', end: '' },
    status: [] as string[],
    numeroFatura: ''
  });

  useActivityLogger(
    'Faturas',
    'Acesso',
    'Acessou a listagem de Faturas e Relatórios'
  );

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
// console.error('Erro ao carregar estabelecimento:', error);
      }
    };

    loadData();
    loadBills();
  }, []);

  // Handle initial Bill navigation from Spotlight
  const [lastOpenedInitialId, setLastOpenedInitialId] = useState<string | null>(null);
  useEffect(() => {
    if (initialId && bills.length > 0 && initialId !== lastOpenedInitialId) {
      setLastOpenedInitialId(initialId);
      handleSingleAction(initialId, 'view-details');
    }
  }, [initialId, bills, lastOpenedInitialId]);

  const loadBills = async () => {
    try {
      setIsLoading(true);
      const data = await billsService.getAll();

      const formattedBills = data.map((bill: any) => ({
        id: bill.id,
        status: normalizeBillStatus(bill.status),
        numero: bill.bill_number,
        dataEmissao: bill.issue_date,
        dataVencimento: bill.due_date,
        dataEntrada: bill.created_at,
        dataAprovacao: null, // NÃO VIRÁ DO ARQUIVO, mantenha a data em branco por enquanto
        transportador: bill.customer_name,
        valorCTes: parseFloat(bill.total_value?.toString() || '0'),
        valorDesconto: parseFloat(bill.discount_value?.toString() || '0'),
        valorCusto: bill.calculated_cost || parseFloat(bill.paid_value?.toString() || '0'),
        cteCount: bill.cteCount || 0,
        tolerancia_valor_fatura: bill.tolerancia_valor_fatura || 0,
        tolerancia_percentual_fatura: bill.tolerancia_percentual_fatura || 0
      }));

      setBills(formattedBills);
    } catch (error) {
// console.error('Erro ao carregar faturas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters to bills
  useEffect(() => {
    const applyFilters = () => {
      let result = [...bills];
      
      // Filter by transportador
      if (filters.transportador) {
        result = result.filter(bill => 
          bill.transportador.toLowerCase().includes(filters.transportador.toLowerCase())
        );
      }
      
      // Filter by período de emissão
      if (filters.periodoEmissao.start && filters.periodoEmissao.end) {
        const startDate = new Date(filters.periodoEmissao.start);
        const endDate = new Date(filters.periodoEmissao.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        result = result.filter(bill => {
          const emissaoDate = new Date(bill.dataEmissao);
          return emissaoDate >= startDate && emissaoDate <= endDate;
        });
      }
      
      // Filter by período de vencimento
      if (filters.periodoVencimento.start && filters.periodoVencimento.end) {
        const startDate = new Date(filters.periodoVencimento.start);
        const endDate = new Date(filters.periodoVencimento.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        result = result.filter(bill => {
          const vencimentoDate = new Date(bill.dataVencimento);
          return vencimentoDate >= startDate && vencimentoDate <= endDate;
        });
      }
      
      // Filter by status
      if (filters.status.length > 0) {
        result = result.filter(bill => filters.status.includes(bill.status));
      }
      
      // Filter by número da fatura
      if (filters.numeroFatura) {
        result = result.filter(bill => 
          bill.numero.toLowerCase().includes(filters.numeroFatura.toLowerCase())
        );
      }
      
      setFilteredBills(result);
    };
    
    applyFilters();
  }, [bills, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedBills(filteredBills.map(bill => bill.id));
    } else {
      setSelectedBills([]);
    }
  };

  const handleSelectBill = (billId: string | number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedBills(prev => [...prev, billId]);
    } else {
      setSelectedBills(prev => prev.filter(id => id !== billId));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedBills.length === 0) {
      setToast({ message: 'Por favor, selecione pelo menos uma fatura para realizar esta ação.', type: 'warning' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let newStatus = '';
      
      switch (action) {
        case 'approve':
          newStatus = 'auditada_aprovada';
          break;
        case 'reject':
          newStatus = 'auditada_reprovada';
          break;
        case 'revert':
          newStatus = 'importada';
          break;
        // others doesn't change state directly
      }

      if (newStatus) {
        // Update bills sequentially
        for (const billId of selectedBills) {
          await billsService.updateStatus(billId.toString(), newStatus);
        }
        setToast({ message: `Ação '${action}' executada em ${selectedBills.length} fatura(s).`, type: 'success' });
        loadBills();
      } else {
         setToast({ message: `Ação suportável apenas visualmente nesta versão simulada.`, type: 'info' });
      }
    } catch (err: any) {
        setToast({ message: `Falha ao processar ações em lote: ${err.message}`, type: 'error' });
    } finally {
        setIsLoading(false);
        setSelectedBills([]);
    }
  };

  const handleSingleAction = async (billId: string | number, action: string) => {
    setIsLoading(true);
    
    const bill = bills.find(b => b.id.toString() === billId.toString());
    
    if (!bill) {
      setIsLoading(false);
      return;
    }
    
    try {
      switch (action) {
        case 'view-map':
          setSelectedBill(bill);
          setShowRelationshipMap(true);
          break;
        case 'view-ctes':
          setSelectedBill(bill);
          setShowCTesModal(true);
          break;
        case 'view-details':
          setSelectedBill(bill);
          setShowDetailsModal(true);
          break;
        case 'approve':
          await billsService.updateStatus(billId.toString(), 'Auditada e aprovada');
          setToast({ message: `Aprovando a fatura ${bill.numero}.`, type: 'success' });
          loadBills();
          break;
        case 'reject':
          setSelectedBill(bill);
          setShowRejectionModal(true);
          break;
        case 'revert':
          await billsService.updateStatus(billId.toString(), 'Importada');
          setToast({ message: `Estornando a fatura ${bill.numero}.`, type: 'info' });
          loadBills();
          break;
        case 'cancel':
          await billsService.updateStatus(billId.toString(), 'Cancelada');
          setToast({ message: `Fatura ${bill.numero} cancelada com sucesso.`, type: 'success' });
          loadBills();
          break;
        case 'delete':
          setConfirmDialog({
            isOpen: true,
            billId: billId.toString(),
            billNumber: bill.numero,
            action: 'delete'
          });
          break;
        default:
          break;
      }
    } catch(err) {
        setToast({ message: 'Erro ao executar ação na fatura.', type: 'error' });
    }
    
    setIsLoading(false);
  };

  const handleRejectBill = async (reasonId: number, _: string) => {
    if (!selectedBill) return;
    setIsLoading(true);
    
    try {
      await billsService.updateStatus(selectedBill.id.toString(), 'Auditada e reprovada');
      setToast({ message: `Fatura ${selectedBill.numero} reprovada com sucesso. Motivo ID: ${reasonId}`, type: 'success' });
      loadBills();
    } catch(err) {
      setToast({ message: 'Erro ao reprovar a fatura.', type: 'error' });
    } finally {
      setIsLoading(false);
      setShowRejectionModal(false);
    }
  };

  const confirmDelete = async () => {
    if (confirmDialog.billId && confirmDialog.billNumber) {
      setIsLoading(true);
      try {
        const { success, error } = await billsService.delete(confirmDialog.billId);

        if (success) {
          setToast({ message: `Fatura ${confirmDialog.billNumber} excluída com sucesso!`, type: 'success' });
          loadBills();
        } else {
          setToast({ message: `Erro ao excluir Fatura: ${error}`, type: 'error' });
        }
      } catch (error: any) {
// console.error('Erro ao excluir fatura:', error);
        setToast({ message: 'Erro ao excluir fatura.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, billId: '', billNumber: '', action: '' });
  };

  const refreshData = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Randomize some data to simulate refresh
      setBills(prev => prev.map(bill => ({
        ...bill,
        valorCTes: Math.floor(Math.random() * 10000) + 500,
        valorCusto: Math.floor(Math.random() * 10000) + 500
      })));
      
      setIsLoading(false);
    }, 1000);
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Faturas</h1>
          <p className="text-gray-600 dark:text-gray-400">Visualize, audite e gerencie todas as Faturas importadas no sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              localStorage.setItem('edi-preselected-layout', 'DOCCOB');
              window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'edi-input' }));
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Inserir Fatura</span>
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Faturas</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{bills.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Importadas</p>
              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mt-1">
                {bills.filter(bill => bill.status === 'Importada').length}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Auditadas e Aprovadas</p>
              <p className="text-2xl font-semibold text-green-600 mt-1">
                {bills.filter(bill => bill.status === 'Auditada e aprovada').length}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Auditadas e Reprovadas</p>
              <p className="text-2xl font-semibold text-orange-600 dark:text-orange-500 mt-1">
                {bills.filter(bill => bill.status === 'Auditada e reprovada').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <XCircle size={20} className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Com NF-e Referenciada</p>
              <p className="text-2xl font-semibold text-yellow-600 mt-1">
                {bills.filter(bill => bill.status === 'Com NF-e Referenciada').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Canceladas</p>
              <p className="text-2xl font-semibold text-red-600 mt-1">
                {bills.filter(bill => bill.status === 'Cancelada').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle size={20} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <BillsFilters 
        onFilterChange={handleFilterChange} 
        filters={filters}
      />

      {/* Bulk Actions */}
      <BillsActions 
        selectedCount={selectedBills.length}
        onAction={handleBulkAction}
        isLoading={isLoading}
      />

      {/* Bills Table */}
      <BillsTable 
        bills={filteredBills}
        selectedBills={selectedBills}
        onSelectAll={handleSelectAll}
        onSelectBill={handleSelectBill}
        onAction={handleSingleAction}
        isLoading={isLoading}
      />

      {/* No Results */}
      {filteredBills.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma fatura encontrada</h3>
          <p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou importar novas faturas.</p>
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

      {/* Bill Details Modal */}
      {showDetailsModal && selectedBill && (
        <BillDetailsModal 
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          bill={selectedBill}
        />
      )}

      {/* Bill CTes Modal */}
      {showCTesModal && selectedBill && (
        <BillCTesModal 
          isOpen={showCTesModal}
          onClose={() => setShowCTesModal(false)}
          billId={selectedBill.id}
          billNumber={selectedBill.numero}
        />
      )}

      {/* Relationship Map Modal */}
      {showRelationshipMap && selectedBill && (
        <RelationshipMapModal
          isOpen={showRelationshipMap}
          onClose={() => setShowRelationshipMap(false)}
          sourceDocument={{
             id: `bill-${selectedBill.id}`,
             type: 'bill',
             number: selectedBill.numero,
             date: selectedBill.dataEmissao,
             status: selectedBill.status,
             value: selectedBill.valorCTes || selectedBill.valorCusto
          }}
        />
      )}

      {/* Bill Rejection Modal */}
      {showRejectionModal && selectedBill && (
        <BillRejectionModal 
          isOpen={showRejectionModal}
          onClose={() => setShowRejectionModal(false)}
          onConfirm={handleRejectBill}
          billId={selectedBill.id}
          billNumber={selectedBill.numero}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && confirmDialog.billNumber && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title="Confirmar Exclusão"
          message={`Tem certeza que deseja excluir a fatura ${confirmDialog.billNumber}? Esta ação não pode ser desfeita.`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDialog({ isOpen: false, billId: '', billNumber: '', action: '' })}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Auto Import Debug Modal */}
      {showDebugModal && currentEstablishment && (
        <AutoImportDebugModal
          isOpen={showDebugModal}
          onClose={() => setShowDebugModal(false)}
        />
      )}
    </div>
  );
};