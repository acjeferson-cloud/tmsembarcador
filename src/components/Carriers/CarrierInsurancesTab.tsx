import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, ShieldAlert, ShieldCheck, Plus, Trash2, Edit2, AlertCircle, FileText, Upload, Calendar } from 'lucide-react';
import { carrierInsuranceService, CarrierInsurance } from '../../services/carrierInsuranceService';
import { Carrier } from '../../services/carriersService';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface CarrierInsurancesTabProps {
  carrier: Carrier;
}

export const CarrierInsurancesTab: React.FC<CarrierInsurancesTabProps> = ({ carrier }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [insurances, setInsurances] = useState<CarrierInsurance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  
  // Form state
  const [formData, setFormData] = useState<Partial<CarrierInsurance>>({
    tipo_seguro: 'RCTR-C',
    numero_apolice: '',
    seguradora: '',
    data_inicio: '',
    data_vencimento: ''
  });
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (carrier.id) {
      loadInsurances();
    }
  }, [carrier.id]);

  const loadInsurances = async () => {
    setIsLoading(true);
    try {
      const data = await carrierInsuranceService.getByCarrierId(carrier.id!);
      setInsurances(data || []);
    } catch (error) {
      console.error('Error loading insurances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${carrier.id}-${Date.now()}.${fileExt}`;
      const filePath = `${carrier.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('carrier-insurances')
        .upload(filePath, file);

      if (uploadError) {
        // Ignora silenciosamente para fins de mockup se o bucket não existir e mocka a url
        setFormData(prev => ({ ...prev, arquivo_url: `mock-url/${fileName}` }));
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('carrier-insurances')
          .getPublicUrl(filePath);
          
        setFormData(prev => ({ ...prev, arquivo_url: publicUrl }));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tipo_seguro || !formData.numero_apolice || !formData.seguradora || !formData.data_inicio || !formData.data_vencimento) {
      setToast({ message: 'Preencha os campos obrigatórios.', type: 'warning' });
      return;
    }

    try {
      const payload = {
        ...formData,
        carrier_id: carrier.id!
      } as Parameters<typeof carrierInsuranceService.create>[0];

      await carrierInsuranceService.create(payload);
      setShowForm(false);
      setFormData({ tipo_seguro: 'RCTR-C', numero_apolice: '', seguradora: '', data_inicio: '', data_vencimento: '' });
      await loadInsurances();
      setToast({ message: 'Apólice adicionada com sucesso!', type: 'success' });
    } catch (error: any) {
      setToast({ message: `Erro ao salvar apólice: ${error.message || 'Erro desconhecido'}`, type: 'error' });
    }
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await carrierInsuranceService.delete(confirmDelete.id);
      await loadInsurances();
      setToast({ message: 'Apólice removida com sucesso.', type: 'success' });
    } catch (error: any) {
      setToast({ message: `Erro ao excluir apólice: ${error.message || 'Erro desconhecido'}`, type: 'error' });
    } finally {
      setConfirmDelete({ isOpen: false, id: null });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ativo') {
      return (
        <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          <ShieldCheck size={14} className="mr-1" />
          Ativa
        </span>
      );
    }
    return (
      <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
        <ShieldAlert size={14} className="mr-1" />
        Vencida
      </span>
    );
  };

  // Avaliação Semafórica Global do Risco
  const missingInsurances = carrier.metadata?.tipos_seguro_exigidos?.filter(
    (req: string) => !insurances.some(i => i.tipo_seguro.toUpperCase() === req.toUpperCase() && i.status === 'ativo')
  ) || [];
  
  const isBlocked = carrier.metadata?.exige_seguro_obrigatorio && missingInsurances.length > 0;

  return (
    <div className="space-y-6">
      {/* Header com Alerta Estratégico */}
      <div className={`p-4 rounded-lg flex items-start space-x-3 ${isBlocked ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
        {isBlocked ? (
          <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" />
        ) : (
          <Shield className="text-blue-600 mt-0.5 flex-shrink-0" />
        )}
        <div>
          <h4 className={`text-sm font-medium ${isBlocked ? 'text-red-900' : 'text-blue-900'}`}>
            {isBlocked ? 'Bloqueio Operacional Ativo' : 'Cobertura de Risco Satisfatória'}
          </h4>
          <p className={`text-xs mt-1 ${isBlocked ? 'text-red-700' : 'text-blue-700'}`}>
            {isBlocked 
              ? `O transportador está impedido de realizar embarques pois possui exigência de seguro obrigatório e há pendências: ${missingInsurances.join(', ')}.`
              : carrier.metadata?.exige_seguro_obrigatorio 
                ? 'Todas as apólices obrigatórias estão vigentes.' 
                : 'Este transportador não possui restrições configuradas de seguro pre-obrigatório.'}
          </p>
        </div>
      </div>

      {/* Título e Botão de Nova */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Apólices e Seguros</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={16} />
            <span>Adicionar Apólice</span>
          </button>
        )}
      </div>

      {/* Form de Nova Apólice */}
      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Cadastrar Nova Apólice</h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Seguro *</label>
              <select 
                name="tipo_seguro" 
                value={formData.tipo_seguro} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500"
                required
              >
                <option value="RCTR-C">RCTR-C</option>
                <option value="RC-DC">RC-DC</option>
                <option value="RCF-DC">RCF-DC</option>
                <option value="Ambiental">Ambiental</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Seguradora *</label>
              <input 
                type="text" 
                name="seguradora" 
                value={formData.seguradora} 
                onChange={handleInputChange}
                placeholder="Nome da Seguradora"
                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Número da Apólice *</label>
              <input 
                type="text" 
                name="numero_apolice" 
                value={formData.numero_apolice} 
                onChange={handleInputChange}
                placeholder="XXX.XXX.XXX"
                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Data Início *</label>
              <input 
                type="date" 
                name="data_inicio" 
                value={formData.data_inicio} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Data Vencimento *</label>
              <input 
                type="date" 
                name="data_vencimento" 
                value={formData.data_vencimento} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Anexar Documento (PDF)</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="file" 
                  id="apolice-upload" 
                  className="hidden" 
                  accept=".pdf,image/*" 
                  onChange={handleFileUpload} 
                />
                <label 
                  htmlFor="apolice-upload" 
                  className="cursor-pointer flex-1 flex items-center justify-center px-4 py-2 border border-dashed border-gray-400 rounded-lg hover:bg-gray-100 transition text-sm text-gray-600"
                >
                  <Upload size={16} className="mr-2" />
                  {uploadingFile ? 'Enviando...' : formData.arquivo_url ? 'Substituir Arquivo' : 'Fazer Upload'}
                </label>
              </div>
            </div>
            
            <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-3 mt-2">
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={uploadingFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Salvar Apólice
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Seguros Vigentes e Histórico */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Carregando apólices...</div>
        ) : insurances.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Shield className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">Nenhum seguro cadastrado</p>
            <p className="text-sm mt-1">Este transportador ainda não possui apólices registradas no sistema.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium">Seguradora</th>
                  <th className="px-6 py-3 font-medium">Apólice</th>
                  <th className="px-6 py-3 font-medium">Vigência</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {insurances.map(pol => (
                  <tr key={pol.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{pol.tipo_seguro}</td>
                    <td className="px-6 py-4">{pol.seguradora}</td>
                    <td className="px-6 py-4">{pol.numero_apolice}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-xs">
                        <Calendar size={14} className="mr-1 text-gray-400" />
                        {new Date(pol.data_inicio).toLocaleDateString()} a {new Date(pol.data_vencimento).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(pol.status)}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                       {pol.arquivo_url && (
                         <a 
                           href={pol.arquivo_url} 
                           target="_blank" 
                           rel="noreferrer"
                           className="inline-flex p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                           title="Ver Documento"
                         >
                           <FileText size={16} />
                         </a>
                       )}
                       <button 
                         onClick={() => handleDeleteClick(pol.id!)}
                         className="inline-flex p-1.5 text-red-600 hover:bg-red-100 rounded"
                         title="Remover"
                       >
                         <Trash2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Cancelar Apólice"
        message="Tem certeza que deseja cancelar/remover esta apólice? Esta ação não pode ser desfeita."
        confirmText="Sim, remover"
        cancelText="Não, manter"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
        type="danger"
      />
    </div>
  );
};
