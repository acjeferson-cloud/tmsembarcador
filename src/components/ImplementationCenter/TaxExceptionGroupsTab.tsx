import React, { useState, useEffect, useRef } from 'react';
import { Plus, Upload, Trash2, FileSpreadsheet, AlertCircle, Download, CheckCircle, Info } from 'lucide-react';
import { taxExceptionService, TaxExceptionGroup, TaxExceptionMember } from '../../services/taxExceptionService';
import { useAuth } from '../../hooks/useAuth';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import * as XLSX from 'xlsx';

import { carriersService } from '../../services/carriersService';

interface TaxExceptionGroupsTabProps {
  carrierId?: string;
}

export const TaxExceptionGroupsTab: React.FC<TaxExceptionGroupsTabProps> = ({ carrierId }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<(TaxExceptionGroup & { memberCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'TDE'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState(carrierId || '');

  useEffect(() => {
    if (user?.organization_id) {
      loadGroups();
      if (!carrierId) {
        loadCarriers();
      }
    }
  }, [carrierId, user?.organization_id]);

  const loadCarriers = async () => {
    try {
      const data = await carriersService.getAll();
      setCarriers(data.filter((c: any) => c.status === 'ativo'));
    } catch (err) {}
  };

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = carrierId 
        ? await taxExceptionService.getGroupsByCarrier(carrierId)
        : await taxExceptionService.getAllGroups(user!.organization_id!);
      
      // Load counts
      const groupsWithCounts = await Promise.all(data.map(async (g) => {
        const count = await taxExceptionService.getMembersCount(g.id);
        return { ...g, memberCount: count };
      }));
      
      setGroups(groupsWithCounts as any);
    } catch (error) {
      setToast({ type: 'error', message: 'Erro ao carregar grupos de exceção.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCarrierId = carrierId || selectedCarrier;

    if (!selectedFile || !user?.organization_id || !finalCarrierId) {
      setToast({ type: 'error', message: 'Preencha todos os campos, selecione a transportadora e a planilha.' });
      return;
    }

    try {
      setUploading(true);
      
      // 1. Read Excel
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(firstSheet);

      if (rows.length === 0) {
        throw new Error('A planilha está vazia.');
      }

      // 2. Validate columns (CNPJ/CPF and Nome)
      const members: Partial<TaxExceptionMember>[] = [];
      let invalidCount = 0;

      rows.forEach(row => {
        // Look for CNPJ/CPF column (can be named different ways)
        const docKey = Object.keys(row).find(k => k.toUpperCase().includes('CNPJ') || k.toUpperCase().includes('CPF') || k.toUpperCase().includes('DOC'));
        const nameKey = Object.keys(row).find(k => k.toUpperCase().includes('NOME') || k.toUpperCase().includes('RAZAO') || k.toUpperCase().includes('CLIENTE'));

        if (docKey) {
          const rawDoc = String(row[docKey] || '');
          const cleanDoc = rawDoc.replace(/\D/g, '');
          
          if (cleanDoc.length === 11 || cleanDoc.length === 14) {
            members.push({
              document: cleanDoc,
              name: nameKey ? String(row[nameKey] || '').substring(0, 100) : 'Importado via Planilha'
            });
          } else {
            invalidCount++;
          }
        }
      });

      if (members.length === 0) {
        throw new Error('Nenhum documento válido (CNPJ/CPF) encontrado na planilha.');
      }

      // 3. Create Group
      const group = await taxExceptionService.createGroup({
        organization_id: user.organization_id,
        carrier_id: finalCarrierId,
        name: formData.name,
        type: formData.type
      });

      // 4. Attach Group ID and Insert Batch
      const membersWithGroupId = members.map(m => ({ ...m, group_id: group.id }));
      await taxExceptionService.bulkInsertMembers(membersWithGroupId);

      setToast({ type: 'success', message: 'Grupo criado com sucesso! ' + members.length + ' parceiros importados.' + (invalidCount > 0 ? ' (' + invalidCount + ' inválidos ignorados)' : '') });
      setShowModal(false);
      setFormData({ name: '', type: 'TDE' });
      setSelectedFile(null);
      loadGroups();

    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Erro ao processar planilha.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDialog.id) return;
    try {
      await taxExceptionService.deleteGroup(confirmDialog.id);
      setToast({ type: 'success', message: 'Grupo excluído com sucesso.' });
      loadGroups();
    } catch (error) {
      setToast({ type: 'error', message: 'Erro ao excluir grupo.' });
    } finally {
      setConfirmDialog({ isOpen: false, id: null });
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { CNPJ_CPF: '12345678901234', Nome_Cliente: 'Empresa Exemplo LTDA' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Template_Excecoes.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Grupos de Exceção de Taxas (TDE/TDA)</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Crie listas de CNPJs isentos ou com taxas diferenciadas via importação de planilhas.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Novo Grupo (Upload)</span>
        </button>
      </div>

      <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-start space-x-3">
        <Info className="text-orange-600 mt-0.5" size={20} />
        <div className="text-sm text-orange-800">
          <p className="font-semibold">Como usar as listas de exceção?</p>
          <p className="mt-1">Após fazer o upload da planilha (por exemplo, 10.000 CNPJs), vá em <strong>Tabelas de Frete &gt; Editar Tabela &gt; Taxas Adicionais</strong> e crie uma nova taxa. No campo "Grupo de Exceção", selecione a lista que você criou aqui. A taxa será aplicada instantaneamente para todos os CNPJs da lista durante o cálculo de frete, sem pesar a tela e sem poluir o cadastro do parceiro.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300">
          <FileSpreadsheet size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum grupo criado</h3>
          <p className="text-gray-500">Importe uma planilha do transportador para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <div key={group.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{group.name}</h3>
                  {!carrierId && (group as any).carriers && (
                    <p className="text-xs text-gray-500 mb-1">
                      Transportadora: {(group as any).carriers.nome_fantasia || (group as any).carriers.razao_social}
                    </p>
                  )}
                  <div className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Tipo: {group.type}
                  </div>
                </div>
                <button
                  onClick={() => setConfirmDialog({ isOpen: true, id: group.id })}
                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-gray-900 dark:text-white">{group.memberCount}</span> CNPJs vinculados
                </div>
                <CheckCircle size={18} className="text-green-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Novo Grupo de Exceção</h2>
            
            <form onSubmit={handleCreateGroup} className="space-y-4">
              {!carrierId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transportadora Vinculada</label>
                  <select
                    required
                    value={selectedCarrier}
                    onChange={e => setSelectedCarrier(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione a transportadora...</option>
                    {carriers.map(c => (
                      <option key={c.id} value={c.id}>{c.codigo} - {c.nome_fantasia || c.razao_social}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Grupo / Planilha</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Planilha Isenções TDE - Correios"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Principal da Exceção</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="TDE">TDE (Taxa de Dificuldade de Entrega)</option>
                  <option value="TDA">TDA (Taxa de Dif. de Acesso)</option>
                  <option value="TRT">TRT (Restrição de Trânsito)</option>
                  <option value="GERAL">Geral (Múltiplas)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Arquivo Excel (.xlsx)</label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                  />
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {selectedFile ? selectedFile.name : 'Clique para selecionar a planilha'}
                  </p>
                </div>
                <div className="mt-2 flex justify-end">
                  <button type="button" onClick={downloadTemplate} className="text-xs text-blue-600 hover:text-blue-800 flex items-center">
                    <Download size={12} className="mr-1"/> Baixar Template
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={uploading}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {uploading ? (
                    <>Processando Planilha...</>
                  ) : (
                    <>
                      <Upload size={18} className="mr-2" />
                      Importar Lote
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={true}
          title="Excluir Grupo"
          message="Tem certeza que deseja excluir este grupo? Todas as taxas vinculadas a ele deixarão de funcionar para estes CNPJs."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDialog({ isOpen: false, id: null })}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
