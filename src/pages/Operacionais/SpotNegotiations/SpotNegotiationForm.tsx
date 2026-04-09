import React, { useState, useEffect } from 'react';
import { spotNegotiationService, SpotNegotiation } from '../../../services/spotNegotiationService';
import { supabase } from '../../../lib/supabase';
import { TenantContextHelper } from '../../../utils/tenantContext';
import { ArrowLeft, Save, Upload, Info, Search, CheckSquare, Square } from 'lucide-react';

export const SpotNegotiationForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [carriers, setCarriers] = useState<any[]>([]);
  const [availableNfes, setAvailableNfes] = useState<any[]>([]);
  const [selectedNfeIds, setSelectedNfeIds] = useState<string[]>([]);
  
  const [carrierId, setCarrierId] = useState('');
  const [value, setValue] = useState('');
  const [validTo, setValidTo] = useState('');
  const [observations, setObservations] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const ctx = await TenantContextHelper.getCurrentContext();
      if(!ctx) return;
      
      // Fetch Carriers
      let cQuery = supabase.from('carriers').select('id, nome_fantasia, razao_social');
      if (ctx.organizationId) cQuery = cQuery.eq('organization_id', ctx.organizationId);
      const { data: cData } = await cQuery;
      setCarriers(cData || []);

      // Fetch Recent Invoices available to be linked
      let iQuery = supabase.from('invoices_nfe')
        .select('id, numero, chave_acesso, destinatario_nome, valor_nf')
        .order('created_at', { ascending: false })
        .limit(50);
      if (ctx.organizationId) iQuery = iQuery.eq('organization_id', ctx.organizationId);
      
      const { data: iData } = await iQuery;
      setAvailableNfes(iData || []);
    };
    fetchData();
  }, []);

  const toggleNfeSelection = (id: string) => {
    setSelectedNfeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!carrierId) return setErrorMsg('Selecione uma transportadora.');
    if (!value || isNaN(Number(value))) return setErrorMsg('Informe um valor acordado válido.');
    if (!validTo) return setErrorMsg('Informe a data limite (validade).');
    if (selectedNfeIds.length === 0) return setErrorMsg('Selecione ao menos 1 NF para o agrupamento Spot.');
    if (!file) return setErrorMsg('Upload de evidência é obrigatório em cotações Spot.');

    setSaving(true);
    setErrorMsg('');

    // 1. Upload File
    const attachment_url = await spotNegotiationService.uploadProof(file);
    if (!attachment_url) {
       setSaving(false);
       return setErrorMsg('Falha ao enviar a evidência. Verifique permissões do Supabase Storage.');
    }

    // 2. Save Capa and Links
    const negotiation: SpotNegotiation = {
      carrier_id: carrierId,
      agreed_value: Number(value),
      valid_to: new Date(validTo).toISOString(),
      attachment_url: attachment_url,
      observations: observations,
      status: 'pendente_faturamento'
    };

    const success = await spotNegotiationService.createNegotiation(negotiation, selectedNfeIds);
    if (success) {
      onBack();
    } else {
      setErrorMsg('Falha ao registrar a negociação no Banco de Dados.');
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft className="text-gray-600 dark:text-gray-300"/>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Registrar Frete Spot (Bypass de Tabela)</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Essa negociação avulsa ignorará tabelas padrão na hora de auditar as NFs selecionadas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl">

        {/* COLUNA ESQUERDA: Capa */}
        <div className="col-span-1 space-y-6">
           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">Informações Comerciais</h2>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transportadora</label>
                    <select 
                      value={carrierId} onChange={(e) => setCarrierId(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    >
                      <option value="">Selecione...</option>
                      {carriers.map(c => <option key={c.id} value={c.id}>{c.nome_fantasia || c.razao_social}</option>)}
                    </select>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Total Negociado (R$)</label>
                    <input 
                      type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)}
                      placeholder="Ex: 1500.00"
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Validade do Acordo</label>
                    <input 
                      type="date" value={validTo} onChange={e => setValidTo(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Evidência Obrigatória</label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 text-center rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                       <input 
                         type="file" 
                         onChange={(e) => setFile(e.target.files?.[0] || null)}
                         className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                         accept=".pdf,image/*"
                         title="Anexar email ou print comercial"
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações Operacionais</label>
                    <textarea 
                      value={observations} onChange={e => setObservations(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white min-h-[80px]"
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* COLUNA DIREITA: NFs Relacionadas */}
        <div className="col-span-2 space-y-6">
           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
              <div className="flex justify-between items-end mb-4 border-b pb-2 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notas Fiscais Relacionadas (1:N)</h2>
                <span className="text-sm px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full font-medium">
                  {selectedNfeIds.length} Selecionadas
                </span>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm p-3 rounded-lg flex items-start gap-2 mb-4">
                 <Info size={18} className="mt-0.5 flex-shrink-0" />
                 <p>As notas que você marcar no grid abaixo deixarão de pautar a tabela cadastrada e assumirão que R$ {Number(value || 0).toLocaleString('pt-BR')} cobrirão todas elas neste agrupamento Spot de transporte único.</p>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[500px]">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 z-10 text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="p-3 w-10">#</th>
                      <th className="p-3">NF</th>
                      <th className="p-3">Cliente Destino</th>
                      <th className="p-3">Valor da NF (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                     {availableNfes.map(nf => {
                       const isSelected = selectedNfeIds.includes(nf.id);
                       return (
                         <tr 
                           key={nf.id} 
                           onClick={() => toggleNfeSelection(nf.id)}
                           className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                         >
                           <td className="p-3 text-blue-600 dark:text-blue-400">
                             {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-400" />}
                           </td>
                           <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{nf.numero}</td>
                           <td className="p-3 text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{nf.destinatario_nome}</td>
                           <td className="p-3 text-gray-600 dark:text-gray-400">{Number(nf.valor_nf || 0).toLocaleString('pt-BR')}</td>
                         </tr>
                       )
                     })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                 <div className="text-red-500 font-medium text-sm">{errorMsg}</div>
                 <button 
                   onClick={handleSave}
                   disabled={saving}
                   className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium shadow flex items-center gap-2 transition-colors"
                 >
                   <Save size={18} />
                   {saving ? 'Gravando e Travando NFes...' : 'Concluir Cotação Spot'}
                 </button>
              </div>

           </div>
        </div>

      </div>
    </div>
  );
};
