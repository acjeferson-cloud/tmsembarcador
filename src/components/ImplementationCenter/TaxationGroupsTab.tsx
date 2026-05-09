import React, { useState, useEffect, useRef } from 'react';
import { Plus, Upload, Trash2, FileSpreadsheet, AlertCircle, Download, CheckCircle, Info } from 'lucide-react';
import { taxationService, TaxationGroup, TaxationMember } from '../../services/taxationService';
import { useAuth } from '../../hooks/useAuth';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import * as XLSX from 'xlsx';

import { carriersService } from '../../services/carriersService';

interface TaxationGroupsTabProps {
  carrierId?: string;
}

export const TaxationGroupsTab: React.FC<TaxationGroupsTabProps> = ({ carrierId }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<(TaxationGroup & { memberCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);
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


  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);

  // Auto-generate name when carrier or type changes
  useEffect(() => {
    if (isNameManuallyEdited) return;

    const finalCarrierId = carrierId || selectedCarrier;
    if (!finalCarrierId) {
      if (!isNameManuallyEdited) setFormData(prev => ({ ...prev, name: '' }));
      return;
    }

    const carrier = carriers.find(c => c.id === finalCarrierId);
    if (carrier) {
      const carrierName = carrier.nome_fantasia || carrier.razao_social;
      const carrierCode = carrier.codigo ? `${carrier.codigo} - ` : '';
      setFormData(prev => ({ ...prev, name: `${carrierCode}${carrierName} - ${formData.type}` }));
    }
  }, [carrierId, selectedCarrier, formData.type, carriers, isNameManuallyEdited]);
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
        ? await taxationService.getGroupsByCarrier(carrierId)
        : await taxationService.getAllGroups(user!.organization_id!);
      
      // Load counts
      const groupsWithCounts = await Promise.all(data.map(async (g) => {
        const count = await taxationService.getMembersCount(g.id);
        return { ...g, memberCount: count };
      }));
      
      setGroups(groupsWithCounts as any);
    } catch (error) {
      setToast({ type: 'error', message: 'Erro ao carregar grupos de taxação.' });
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
      const members: Partial<TaxationMember>[] = [];
      let invalidCount = 0;

      rows.forEach(row => {
        // Look for CNPJ/CPF column (can be named different ways)
        const docKey = Object.keys(row).find(k => k.toUpperCase().includes('CNPJ') || k.toUpperCase().includes('CPF') || k.toUpperCase().includes('DOC'));
        const nameKey = Object.keys(row).find(k => k.toUpperCase().includes('NOME') || k.toUpperCase().includes('RAZAO') || k.toUpperCase().includes('CLIENTE'));
        const cepKey = Object.keys(row).find(k => k.toUpperCase().includes('CEP'));

        if (docKey) {
          const rawDoc = String(row[docKey] || '');
          let cleanDoc = rawDoc.replace(/\D/g, '');
          
          // Fix for Excel dropping leading zeros when treating CNPJ/CPF as numbers
          if (cleanDoc.length > 11 && cleanDoc.length < 14) {
            cleanDoc = cleanDoc.padStart(14, '0');
          } else if (cleanDoc.length > 0 && cleanDoc.length < 11) {
            cleanDoc = cleanDoc.padStart(11, '0');
          }
          
          if (cleanDoc.length === 11 || cleanDoc.length === 14) {
            let cleanCep = undefined;
            if (cepKey && row[cepKey]) {
              const rawCep = String(row[cepKey]).replace(/\D/g, '');
              if (rawCep.length > 0) {
                cleanCep = rawCep.padStart(8, '0').substring(0, 8);
              }
            }

            members.push({
              document: cleanDoc,
              name: nameKey ? String(row[nameKey] || '').substring(0, 100) : 'Importado via Planilha',
              cep: cleanCep
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
      const group = await taxationService.createGroup({
        organization_id: user.organization_id,
        carrier_id: finalCarrierId,
        name: formData.name,
        type: formData.type,
        created_by_user_name: user?.name || user?.email || 'Sistema'
      });

      // 4. Attach Group ID and Insert Batch
      const membersWithGroupId = members.map(m => ({ ...m, group_id: group.id }));
      await taxationService.bulkInsertMembers(membersWithGroupId);

      setToast({ type: 'success', message: 'Grupo criado com sucesso! ' + members.length + ' parceiros importados.' + (invalidCount > 0 ? ' (' + invalidCount + ' inválidos ignorados)' : '') });
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
      await taxationService.deleteGroup(confirmDialog.id);
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
      { CNPJ_CPF: '12345678901234', Nome_Cliente: 'Empresa Exemplo LTDA', CEP: '01000-000' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Template_Excecoes.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Importar Grupo de Taxação (TDE/TDA)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Crie grupos de CNPJs que terão taxas específicas aplicadas via importação de planilhas.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                onChange={e => {
                    setIsNameManuallyEdited(true);
                    setFormData({...formData, name: e.target.value});
                  }}
                placeholder="Ex: Planilha TDE - Correios"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Taxação</label>
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
          </div>

          <div className="space-y-4 pt-2">
            {/* Download Template */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Formatação Excel</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">template_excecoes.xlsx</p>
                </div>
              </div>
              <button
                type="button"
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download Planilha Base
              </button>
            </div>

            {/* Upload Area */}
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${selectedFile ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 hover:border-blue-400'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setSelectedFile(e.dataTransfer.files[0]);
                }
              }}
            >
              <Upload className={`w-8 h-8 mx-auto mb-3 ${selectedFile ? 'text-blue-500' : 'text-gray-400'}`} />
              {selectedFile ? (
                <>
                  <p className="text-blue-700 dark:text-blue-400 font-medium mb-1">{selectedFile.name}</p>
                  <p className="text-sm text-blue-500 dark:text-blue-300 mb-4">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Arraste e solte o arquivo aqui...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Formatos Aceitos: .xlsx, .xls, .csv</p>
                </>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-exception"
              />
              <label
                htmlFor="file-exception"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors text-sm font-medium"
              >
                <Upload className="w-4 h-4" />
                {selectedFile ? 'Trocar Arquivo' : 'Selecionar Arquivo'}
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Upload size={18} className="mr-2" />
                  Importar Lista
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-start space-x-3">
        <Info className="text-orange-600 mt-0.5" size={20} />
        <div className="text-sm text-orange-800">
          <p className="font-semibold">Como usar os grupos de taxação?</p>
          <p className="mt-1">Após fazer o upload da planilha (por exemplo, 10.000 CNPJs), vá em <strong>Tabelas de Frete &gt; Editar Tabela &gt; Taxas Adicionais</strong> e crie uma nova taxa. No campo "Grupo de Taxação", selecione o grupo que você criou aqui. A taxa será aplicada instantaneamente apenas para os CNPJs desta lista durante o cálculo de frete, de forma eficiente.</p>
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
                  <div className="text-xs mt-1 opacity-70">
                    Importado por {group.created_by_user_name || 'Sistema'} em {new Date(group.created_at || new Date()).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric'})}
                  </div>
                </div>
                <CheckCircle size={18} className="text-green-500" />
              </div>
            </div>
          ))}
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
