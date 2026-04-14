import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { spotNegotiationService, SpotNegotiation } from '../../../services/spotNegotiationService';
import { Plus, FileText, CheckCircle, Clock, MoreHorizontal, Eye, Share2, Edit2, Trash2, XCircle, FilePlus2, Receipt, Search, Filter, Printer, Download } from 'lucide-react';
import Breadcrumbs from '../../../components/Layout/Breadcrumbs';
import { RelationshipMapModal } from '../../../components/RelationshipMap';
import { Toast, ToastType } from '../../../components/common/Toast';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { useAuth } from '../../../hooks/useAuth';
import { spotPdfService } from '../../../services/spotPdfService';

export const SpotNegotiationList: React.FC<{ onNew: () => void; onEdit?: (id: string) => void; onView?: (id: string) => void }> = ({ onNew, onEdit, onView }) => {
  const { t } = useTranslation();
  const { user, currentEstablishment } = useAuth();
  const [data, setData] = useState<SpotNegotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpots, setSelectedSpots] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  // States para Menu de Contexto
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  
  // States para Mapas de Relacionamento
  const [showRelationshipMap, setShowRelationshipMap] = useState(false);
  const [selectedInvoiceForMap, setSelectedInvoiceForMap] = useState<any>(null);

  // States para UI Feedback
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await spotNegotiationService.getActiveNegotiations();
    setData(res);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente_faturamento':
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-max"><Clock size={12}/> Pendente CTe</span>;
      case 'aguardando_fatura':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-max"><Receipt size={12}/> Aguardando Fatura</span>;
      case 'liquidado':
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-max"><CheckCircle size={12}/> Faturado</span>;
      case 'cancelado':
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-max"><XCircle size={12}/> Cancelado</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const handleAction = async (id: string, action: string) => {
    setOpenActionMenu(null);
    const item = data.find(n => n.id === id);
    if (!item) return;

    if (action === 'view') {
      if (onView) {
        onView(id);
      } else {
        setToast({ message: 'Funcionalidade de visualização indisponível.', type: 'info' });
      }
    } else if (action === 'edit') {
      if (onEdit) {
        onEdit(id);
      } else {
        setToast({ message: 'Funcionalidade de edição indisponível.', type: 'info' });
      }
    } else if (action === 'map') {
      // The Spot itself becomes the Root Node
      const spotDoc = {
        id: `spot-${id}`,
        type: 'spot' as const,
        number: item.carrier_name, // Carrier shows as the "number" or title
        date: item.valid_to || new Date().toISOString(),
        status: item.status,
        value: Number(item.agreed_value)
      };
      setSelectedInvoiceForMap(spotDoc);
      setShowRelationshipMap(true);
    } else if (action === 'cancel') {
      setConfirmDialog({
        isOpen: true,
        title: 'Cancelar Cotação Spot',
        message: 'Tem certeza que deseja cancelar esta cotação? Os CT-es originários desta cotação perderão  o Bypass.',
        onConfirm: async () => {
          setConfirmDialog(p => ({ ...p, isOpen: false }));
          const success = await spotNegotiationService.cancelNegotiation(id);
          if (success) {
             setToast({ message: 'Cotação cancelada com sucesso.', type: 'success' });
             fetchData();
          } else {
             setToast({ message: 'Falha ao cancelar a cotação.', type: 'error' });
          }
        }
      });
    }
  };

  // Dashboard Metrics
  const total = data.length;
  const pendentesCTe = data.filter(d => d.status === 'pendente_faturamento').length;
  const aguardandoFatura = data.filter(d => d.status === 'aguardando_fatura').length;
  const liquidados = data.filter(d => d.status === 'liquidado').length;
  const cancelados = data.filter(d => d.status === 'cancelado').length;

  // Filtered Data
  const filteredData = data.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.carrier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSpots(filteredData.map(q => q.id!));
    } else {
      setSelectedSpots([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedSpots(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: 'print' | 'download') => {
    if (selectedSpots.length === 0) return;
    setIsProcessing(true);
    try {
      const selectedData = data.filter(q => selectedSpots.includes(q.id!));
      if (action === 'download') {
        await spotPdfService.generateSpotPDF(selectedData, 'download', { user, establishment: currentEstablishment });
      } else {
        const pdfUrl = await spotPdfService.generateSpotPDF(selectedData, 'print', { user, establishment: currentEstablishment });
        const printWindow = window.open(pdfUrl, '_blank');
        if (printWindow) {
          let fileName = 'Cotações Manuais (Spot)';
          if (selectedData.length === 1 && selectedData[0].code) {
              fileName = `Cotação Manual (SPOT) - ${selectedData[0].code}`;
          }
          // Força o título da janela para o navegador sugerir no "Salvar como PDF"
          printWindow.document.title = fileName;
          
          printWindow.onload = () => {
            // Tenta reatribuir o título após a quebra de contexto do PDF Viewer
            setTimeout(() => { if(printWindow.document) printWindow.document.title = fileName; }, 100);
            printWindow.print();
          };
        }
      }
    } catch (error) {
      console.error("Error generating spot PDF", error);
      setToast({ message: 'Erro ao gerar documento de cotação.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Breadcrumbs items={[{ label: 'Cotações Spot', current: true }]} />
      
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
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cotações Manuais (Spot)</h1>
           <p className="text-sm text-gray-600 dark:text-gray-400">Hub de negociações avulsas para auditoria de CT-es e Faturas fora da tabela.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
             onClick={onNew}
             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20}/>
            <span>Nova Negociação Spot</span>
          </button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total de Cotações</h3>
            <FilePlus2 className="text-blue-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '-' : total}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pendentes de CTe</h3>
            <Clock className="text-yellow-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '-' : pendentesCTe}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Aguardando Fatura</h3>
            <Receipt className="text-blue-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '-' : aguardandoFatura}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Faturados</h3>
            <CheckCircle className="text-green-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '-' : liquidados}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Cancelados</h3>
            <XCircle className="text-red-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '-' : cancelados}</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por transportadora..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <button 
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors dark:border-gray-600 dark:text-gray-300"
          >
            <Filter size={18} />
            <span>Filtros Avançados</span>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {statusFilter ? 1 : 0}
            </span>
          </button>
        </div>

        {isFiltersExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status da Cotação</label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                     <option value="">Todos os Status</option>
                     <option value="pendente_faturamento">Pendente de CT-e</option>
                     <option value="aguardando_fatura">Aguardando Fatura / Auditar</option>
                     <option value="liquidado">Liquidado</option>
                     <option value="cancelado">Cancelado</option>
                  </select>
                </div>
             </div>
             
             <div className="flex justify-end mt-4">
               <button 
                 onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
                 className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
               >
                 Limpar Filtros
               </button>
             </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedSpots.length} {selectedSpots.length === 1 ? 'selecionado' : 'selecionados'}
          </span>
          
          <div className="flex-1"></div>
          
          <button
            onClick={() => handleBulkAction('print')}
            disabled={selectedSpots.length === 0 || isProcessing}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm shadow-sm"
          >
            <Printer size={16} />
            <span>{isProcessing ? 'Processando...' : 'Imprimir'}</span>
          </button>
          
          <button
            onClick={() => handleBulkAction('download')}
            disabled={selectedSpots.length === 0 || isProcessing}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm shadow-sm"
          >
            <Download size={16} />
            <span>{isProcessing ? 'Processando...' : 'Download'}</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-visible" ref={menuRef}>
        {loading ? (
           <div className="p-8 text-center text-gray-500">Carregando negociações...</div>
        ) : filteredData.length === 0 ? (
           <div className="p-12 text-center flex flex-col items-center">
             <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
               <FileText className="text-gray-400" size={32}/>
             </div>
             <p className="text-gray-600 dark:text-gray-300 font-medium">Nenhuma negociação avulsa registrada.</p>
             <p className="text-sm text-gray-500 mt-1">Registre os valores acordados para que o motor de auditoria considere estas negociações avulsas.</p>
           </div>
        ) : (
          <div className="overflow-x-auto min-h-[300px]">
             <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 w-10 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={filteredData.length > 0 && selectedSpots.length === filteredData.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 w-16 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nº Cotação</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Transportador</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Valor Prometido</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Validade</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Evidência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedSpots.includes(item.id!)}
                        onChange={() => handleSelectRow(item.id!)}
                      />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                       <div className="flex items-center space-x-2">
                          {/* Consulta */}
                          <button
                            onClick={() => handleAction(item.id!, 'view')}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Consulta"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Mapa de Relações */}
                          <button
                            onClick={() => handleAction(item.id!, 'map')}
                            className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 p-1 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            title="Mapa de Relações"
                          >
                            <Share2 size={16} />
                          </button>

                          {/* More actions button */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenActionMenu(openActionMenu === item.id ? null : item.id!)}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <MoreHorizontal size={16} />
                            </button>

                            {openActionMenu === item.id && (
                              <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                                <div className="py-1">
                                  <button
                                    onClick={() => handleAction(item.id!, 'edit')}
                                    disabled={item.status === 'liquidado'}
                                    className="w-full text-left px-4 py-2 text-sm text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Edit2 size={14} />
                                    <span>Editar Cotação</span>
                                  </button>
                                  <button
                                    onClick={() => handleAction(item.id!, 'cancel')}
                                    disabled={item.status === 'cancelado'}
                                    className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2 border-t border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Trash2 size={14} />
                                    <span>Cancelar</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'pendente_faturamento' ? 'bg-yellow-600 text-white dark:bg-yellow-700' :
                        item.status === 'aguardando_fatura' ? 'bg-blue-600 text-white dark:bg-blue-700' :
                        item.status === 'liquidado' ? 'bg-green-600 text-white dark:bg-green-700' :
                        'bg-red-600 text-white dark:bg-red-700'
                      }`}>
                        {item.status === 'pendente_faturamento' ? 'Pendente de CT-e' :
                         item.status === 'aguardando_fatura' ? 'Aguardando Fatura' :
                         item.status === 'liquidado' ? 'Liquidado' :
                         'Cancelado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.code ? item.code : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.carrier_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900 dark:text-white">
                         {Number(item.agreed_value).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                       {item.valid_to ? new Date(item.valid_to).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {item.attachment_url ? (
                         <a href={item.attachment_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                           <FileText size={16}/> Abrir Anexo
                         </a>
                       ) : (
                         <span className="text-xs text-gray-400">Sem evidência</span>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRelationshipMap && selectedInvoiceForMap && (
        <RelationshipMapModal
          isOpen={showRelationshipMap}
          onClose={() => {
            setShowRelationshipMap(false);
            setSelectedInvoiceForMap(null);
          }}
          sourceDocument={selectedInvoiceForMap}
        />
      )}
    </div>
  );
};
