import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Search, Plus, Filter, Download, FileText, CheckCircle, XCircle, AlertCircle, Clock, Truck, MapPin, DollarSign, FileCheck, Printer, RefreshCw, Eye, Clock as ArrowClockwise, ThumbsUp, ThumbsDown, Calendar, User } from 'lucide-react';
import { BillsFilters } from './BillsFilters';
import { BillsTable } from './BillsTable';
import { BillsActions } from './BillsActions';
import { BillDetailsModal } from './BillDetailsModal';
import { BillCTesModal } from './BillCTesModal';
import { BillRejectionModal } from './BillRejectionModal';
import { supabase } from '../../lib/supabase';

export const Bills: React.FC = () => {
  const breadcrumbItems = [
    { label: 'Documentos Operacionais' },
    { label: 'Conhecimentos', current: true }
  ];

  const [bills, setBills] = useState<any[]>([]);
  const [filteredBills, setFilteredBills] = useState<any[]>([]);
  const [selectedBills, setSelectedBills] = useState<(string | number)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCTesModal, setShowCTesModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [filters, setFilters] = useState({
    transportador: '',
    periodoEmissao: { start: '', end: '' },
    periodoVencimento: { start: '', end: '' },
    status: [] as string[],
    numeroFatura: ''
  });

  // Load bills from Supabase
  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedBills = (data || []).map((bill: any) => ({
        id: bill.id,
        status: bill.status,
        numero: bill.bill_number,
        dataEmissao: bill.issue_date,
        dataVencimento: bill.due_date,
        dataEntrada: bill.created_at,
        dataAprovacao: bill.updated_at,
        transportador: bill.customer_name,
        valorCTes: parseFloat(bill.total_value || 0),
        valorDesconto: parseFloat(bill.discount_value || 0),
        valorCusto: parseFloat(bill.paid_value || 0),
        cteCount: 0
      }));

      setBills(formattedBills);
    } catch (error) {
      console.error('Erro ao carregar faturas:', error);
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

  const handleSelectBill = (billId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedBills(prev => [...prev, billId]);
    } else {
      setSelectedBills(prev => prev.filter(id => id !== billId));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedBills.length === 0) {
      alert('Por favor, selecione pelo menos uma fatura para realizar esta ação.');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      switch (action) {
        case 'print':
          alert(`Gerando DACTE para ${selectedBills.length} fatura(s) selecionada(s).`);
          break;
        case 'recalculate':
          alert(`Recalculando ${selectedBills.length} fatura(s) selecionada(s).`);
          // Update bills status in the mock data
          setBills(prev => prev.map(bill => 
            selectedBills.includes(bill.id) 
              ? { ...bill, valorCusto: Math.floor(Math.random() * 10000) + 500 }
              : bill
          ));
          break;
        case 'approve':
          alert(`Aprovando ${selectedBills.length} fatura(s) selecionada(s).`);
          // Update bills status in the mock data
          setBills(prev => prev.map(bill => 
            selectedBills.includes(bill.id) 
              ? { ...bill, status: 'auditada_aprovada', dataAprovacao: new Date().toISOString() }
              : bill
          ));
          break;
        case 'reject':
          alert(`Reprovando ${selectedBills.length} fatura(s) selecionada(s).`);
          // Update bills status in the mock data
          setBills(prev => prev.map(bill => 
            selectedBills.includes(bill.id) 
              ? { ...bill, status: 'auditada_reprovada', dataAprovacao: new Date().toISOString() }
              : bill
          ));
          break;
        case 'revert':
          alert(`Estornando ${selectedBills.length} fatura(s) selecionada(s).`);
          // Update bills status
          setBills(prev => prev.map(bill =>
            selectedBills.includes(bill.id)
              ? { ...bill, status: 'importado', dataAprovacao: null }
              : bill
          ));
          break;
        case 'download':
          alert(`Baixando XML de ${selectedBills.length} fatura(s) selecionada(s).`);
          break;
        default:
          break;
      }
      
      setIsLoading(false);
      // Clear selection after action
      setSelectedBills([]);
    }, 1000);
  };

  const handleSingleAction = (billId: number, action: string) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const bill = bills.find(b => b.id === billId);
      
      if (!bill) {
        setIsLoading(false);
        return;
      }
      
      switch (action) {
        case 'view-ctes':
          setSelectedBill(bill);
          setShowCTesModal(true);
          break;
        case 'view-details':
          setSelectedBill(bill);
          setShowDetailsModal(true);
          break;
        case 'print':
          alert(`Gerando DACTE para a fatura ${bill.numero}.`);
          break;
        case 'recalculate':
          alert(`Recalculando a fatura ${bill.numero}.`);
          // Update bill in the mock data
          setBills(prev => prev.map(b => 
            b.id === billId 
              ? { ...b, valorCusto: Math.floor(Math.random() * 10000) + 500 }
              : b
          ));
          break;
        case 'approve':
          alert(`Aprovando a fatura ${bill.numero}.`);
          // Update bill in the mock data
          setBills(prev => prev.map(b => 
            b.id === billId 
              ? { ...b, status: 'auditada_aprovada', dataAprovacao: new Date().toISOString() }
              : b
          ));
          break;
        case 'reject':
          // Show rejection modal
          setSelectedBill(bill);
          setShowRejectionModal(true);
          break;
        case 'revert':
          alert(`Estornando a fatura ${bill.numero}.`);
          // Update bill status
          setBills(prev => prev.map(b =>
            b.id === billId
              ? { ...b, status: 'importado', dataAprovacao: null }
              : b
          ));
          break;
        case 'download':
          alert(`Baixando XML da fatura ${bill.numero}.`);
          break;
        default:
          break;
      }
      
      setIsLoading(false);
    }, 500);
  };

  const handleRejectBill = (reasonId: number, observation: string) => {
    if (!selectedBill) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Update bill in the mock data
      setBills(prev => prev.map(b => 
        b.id === selectedBill.id 
          ? { ...b, status: 'auditada_reprovada', dataAprovacao: new Date().toISOString() }
          : b
      ));
      
      setIsLoading(false);
      setShowRejectionModal(false);
      alert(`Fatura ${selectedBill.numero} reprovada com sucesso. Motivo ID: ${reasonId}`);
    }, 1000);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Faturas</h1>
          <p className="text-gray-600 dark:text-gray-400">Visualize, audite e gerencie todas as Faturas importadas no sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
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
                {bills.filter(bill => bill.status === 'importado').length}
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
                {bills.filter(bill => bill.status === 'auditado_aprovado').length}
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
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {bills.filter(bill => bill.status === 'auditado_reprovado').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <XCircle size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Com NF-e Referenciada</p>
              <p className="text-2xl font-semibold text-yellow-600 mt-1">
                {bills.filter(bill => bill.status === 'com_nfe_referenciada').length}
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
                {bills.filter(bill => bill.status === 'cancelado').length}
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
    </div>
  );
};