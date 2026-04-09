import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { spotNegotiationService, SpotNegotiation } from '../../../services/spotNegotiationService';
import { Plus, FileText, CheckCircle, Clock, MoreHorizontal, Eye, Share2, Edit2, Trash2, XCircle, FilePlus2, Receipt } from 'lucide-react';
import Breadcrumbs from '../../../components/Layout/Breadcrumbs';
import { RelationshipMapModal } from '../../../components/RelationshipMap';
import { Toast, ToastType } from '../../../components/common/Toast';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';

export const SpotNegotiationList: React.FC<{ onNew: () => void; onEdit?: (id: string) => void }> = ({ onNew, onEdit }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<SpotNegotiation[]>([]);
  const [loading, setLoading] = useState(true);

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
      // Abre o form em modo readonly - futuramente suportado via prop id
      setToast({ message: 'Funcionalidade de visualização em desenvolvimento.', type: 'info' });
    } else if (action === 'edit') {
      if (onEdit) {
        onEdit(id);
      } else {
        setToast({ message: 'Funcionalidade de edição indisponível.', type: 'info' });
      }
    } else if (action === 'map') {
      const invoiceDoc = await spotNegotiationService.getFirstLinkedInvoice(id);
      if (invoiceDoc) {
        setSelectedInvoiceForMap(invoiceDoc);
        setShowRelationshipMap(true);
      } else {
        setToast({ message: 'Nenhuma Nota Fiscal atrelada a esta cotação para formar relacionamento.', type: 'warning' });
      }
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
        <button 
           onClick={onNew}
           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20}/>
          <span>Nova Negociação Spot</span>
        </button>
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

      {/* Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-visible" ref={menuRef}>
        {loading ? (
           <div className="p-8 text-center text-gray-500">Carregando negociações...</div>
        ) : data.length === 0 ? (
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
                  <th className="px-6 py-3 w-16 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Transportador</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Valor Prometido</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Validade</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Evidência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="px-3 py-4 whitespace-nowrap">
                       <div className="flex items-center space-x-2">
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
                                    onClick={() => handleAction(item.id!, 'view')}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                                  >
                                    <Eye size={14} />
                                    <span>Consulta</span>
                                  </button>
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
                    <td className="px-6 py-4">
                       <span className="font-medium text-gray-900 dark:text-white">{item.carrier_name}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                       {Number(item.agreed_value).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                       {item.valid_to ? new Date(item.valid_to).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                       {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4">
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
