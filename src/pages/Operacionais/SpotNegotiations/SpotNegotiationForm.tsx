import React, { useState, useEffect } from 'react';
import { spotNegotiationService, SpotNegotiation } from '../../../services/spotNegotiationService';
import { supabase } from '../../../lib/supabase';
import { TenantContextHelper } from '../../../utils/tenantContext';
import { ArrowLeft, Save, Upload, Info, CheckSquare, Square, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';

export const SpotNegotiationForm: React.FC<{ onBack: () => void; initialId?: string; isReadOnly?: boolean }> = ({ onBack, initialId, isReadOnly }) => {
  const [carriers, setCarriers] = useState<any[]>([]);
  const [availableNfes, setAvailableNfes] = useState<any[]>([]);
  const [selectedNfeIds, setSelectedNfeIds] = useState<string[]>([]);
  
  const [carrierId, setCarrierId] = useState('');
  const [value, setValue] = useState('');
  const [validTo, setValidTo] = useState('');
  const [observations, setObservations] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [saving, setSaving] = useState(false);
  const [loadingNfes, setLoadingNfes] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isInitializing, setIsInitializing] = useState(!!initialId);

  useEffect(() => {
    const fetchSelects = async () => {
      const ctx = await TenantContextHelper.getCurrentContext();
      if(!ctx) return;
      
      let cQuery = supabase.from('carriers')
        .select('id, codigo, nome_fantasia, razao_social')
        .order('codigo', { ascending: true });
      
      if (ctx.organizationId) cQuery = cQuery.eq('organization_id', ctx.organizationId);
      const { data: cData } = await cQuery;
      setCarriers(cData || []);
    };
    fetchSelects();
  }, []);

  useEffect(() => {
    if (initialId) {
      loadInitialData();
    } else {
      fetchNfes();
    }
  }, [startDate, endDate]);

  const loadInitialData = async () => {
    setIsInitializing(true);
    const data = await spotNegotiationService.getNegotiationById(initialId!);
    if (data) {
      setCarrierId(data.carrier_id);
      setValue(data.agreed_value.toString());
      setValidTo(data.valid_to ? data.valid_to.substring(0, 10) : '');
      setSelectedNfeIds(data.nfeIds);
      setExistingAttachmentUrl(data.attachment_url);

      // Force fetch the specific NFs regardless of Date Filter
      if (data.nfeIds && data.nfeIds.length > 0) {
         const { data: iData } = await supabase.from('invoices_nfe')
           .select('id, numero, serie, data_emissao, quantidade_volumes, peso_total, cubagem_total, valor_total, destinatario_nome, customer:invoices_nfe_customers(cidade, estado)')
           .in('id', data.nfeIds);
         if (iData) {
            setAvailableNfes(iData);
         }
      }
    }
    setIsInitializing(false);
  };

  const fetchNfes = async () => {
    setLoadingNfes(true);
    const ctx = await TenantContextHelper.getCurrentContext();
    if(!ctx) {
      setLoadingNfes(false);
      return;
    }

    let iQuery = supabase.from('invoices_nfe')
      .select(`
        id, numero, serie, data_emissao, quantidade_volumes, peso_total, cubagem_total, valor_total, destinatario_nome,
        customer:invoices_nfe_customers(cidade, estado)
      `)
      .order('created_at', { ascending: false })
      .limit(200);
      
    if (ctx.organizationId) iQuery = iQuery.eq('organization_id', ctx.organizationId);
    if (ctx.establishmentId) iQuery = iQuery.eq('establishment_id', ctx.establishmentId);
    
    if (startDate) {
      iQuery = iQuery.gte('data_emissao', `${startDate}T00:00:00`);
    }
    if (endDate) {
      iQuery = iQuery.lte('data_emissao', `${endDate}T23:59:59`);
    }
    
    const { data: iData, error: iErr } = await iQuery;
    if (iErr) console.error('Error fetching NFs:', iErr);
    setAvailableNfes(iData || []);
    setLoadingNfes(false);
  };

  const toggleNfeSelection = (id: string, selectAll = false, forceState = false) => {
    if (selectAll) {
      if (forceState) {
         setSelectedNfeIds(availableNfes.map(n => n.id));
      } else {
         setSelectedNfeIds([]);
      }
      return;
    }
    setSelectedNfeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!carrierId) return setErrorMsg('Selecione uma transportadora.');
    if (!value || isNaN(Number(value))) return setErrorMsg('Informe um valor acordado válido.');
    if (!validTo) return setErrorMsg('Informe a data limite (validade).');
    if (selectedNfeIds.length === 0) return setErrorMsg('Selecione ao menos 1 NF para o agrupamento Spot.');

    setSaving(true);
    setErrorMsg('');

    let attachment_url = existingAttachmentUrl;
    if (file) {
      attachment_url = await spotNegotiationService.uploadProof(file);
      if (!attachment_url) {
        setErrorMsg('Falha ao processar upload da evidência. Tente novamente.');
        setSaving(false);
        return;
      }
    } else if (!attachment_url) {
       setErrorMsg('Upload de evidência é obrigatório em cotações Spot.');
       setSaving(false);
       return;
    }

    if (initialId) {
       const ok = await spotNegotiationService.updateNegotiation(initialId, carrierId, Number(value), validTo, attachment_url);
       if (ok) {
           onBack();
       } else {
           setErrorMsg('Erro ao atualizar cotação.');
       }
    } else {
        const payload = {
          carrier_id: carrierId,
          agreed_value: Number(value),
          valid_to: validTo,
          attachment_url
        };
        const success = await spotNegotiationService.createNegotiation(payload as any, selectedNfeIds);
        if (success) {
          onBack();
        } else {
          setErrorMsg('Ocorreu um erro ao gerar a cotação Spot. Verifique os dados.');
        }
    }
    setSaving(false);
  };

  if (isInitializing) {
     return <div className="p-6 text-center text-gray-500">Carregando dados da cotação...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isReadOnly ? 'Consulta de Cotação Spot' : initialId ? 'Editar Cotação Spot' : 'Nova Cotação Spot'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
             {isReadOnly ? 'Visualização dos termos acordados.' : initialId ? 'Altere as informações comerciais da negociação.' : 'Agrupe notas fiscais sob um valor de frete pré-acordado com a transportadora.'}
          </p>
        </div>
      </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
         <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white pb-2 border-b dark:border-gray-700">Filtros Comerciais e Operacionais</h2>
         
         <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Inicial</label>
              <input 
                type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={isReadOnly}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Final</label>
              <input 
                type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={isReadOnly}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transportadora</label>
              <select 
                value={carrierId} onChange={(e) => setCarrierId(e.target.value)} disabled={isReadOnly}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Selecione...</option>
                {carriers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.codigo ? `${c.codigo} - ` : ''}{c.nome_fantasia || c.razao_social}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Global (R$)</label>
              <input 
                type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} disabled={isReadOnly}
                placeholder="Ex: 1500.00"
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Validade Comercial</label>
              <input 
                type="date" value={validTo} onChange={e => setValidTo(e.target.value)} disabled={isReadOnly}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Evidência Comercial OBRIGATÓRIA (Anexo)</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 p-3 text-center rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors bg-gray-50 dark:bg-gray-700/30">
                  <input 
                    type="file" 
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) {
                        const maxSize = 2 * 1024 * 1024; // 2MB
                        if (selectedFile.size > maxSize) {
                          setErrorMsg('O arquivo anexo não pode ser maior que 2MB para otimização de espaço. Escolha um arquivo menor.');
                          e.target.value = ''; // clears the input
                          setFile(null);
                          return;
                        }
                        setErrorMsg('');
                        setFile(selectedFile);
                      } else {
                        setFile(null);
                      }
                    }}
                    disabled={isReadOnly}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    accept=".pdf,image/*"
                    title="Anexar email ou print comercial"
                  />
                  {existingAttachmentUrl && (
                     <div className="mt-2 text-sm text-blue-600 font-medium">
                        <a href={existingAttachmentUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 hover:underline">
                          <CheckSquare size={16}/> Evidência já anexada (clique para ver)
                        </a>
                     </div>
                  )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações Internas (Visível só para Auditoria)</label>
              <textarea 
                value={observations} onChange={e => setObservations(e.target.value)} disabled={isReadOnly}
                placeholder="Detalhes acordados via telefone, restrição, nome da pessoa de contato..."
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white min-h-[60px] max-h-[80px] focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 border-b pb-4 dark:border-gray-700 gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filtragem de Notas Fiscais Disponíveis (1:N)</h2>
            <div className="flex gap-2 items-center text-sm text-gray-500 mt-1">
               <Info size={16}/> Modifique a data corrente acima para faturar lotes retroativos.
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <span className="text-sm font-medium text-gray-500">Desvincular das Tabelas Atuais:</span>
               <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full font-bold shadow-sm">
                 {selectedNfeIds.length} NFs Sel.
               </span>
            </div>
            
            {!isReadOnly && (
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold shadow flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Save size={18} />
                {saving ? 'Gravando e Travando NFes...' : 'Concluir Agrupamento Spot'}
              </button>
            )}
          </div>
        </div>
        
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-100 dark:border-red-900/50">
            {errorMsg}
          </div>
        )}

        {loadingNfes ? (
          <div className="p-12 text-center text-gray-500 font-medium flex flex-col items-center justify-center">
             <Filter className="animate-bounce mb-2 text-blue-400" size={32} />
             Buscando NF-es no Range Solicitado...
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <tr>
                  <th className="p-3 w-12 text-center">
                     <input 
                       type="checkbox" 
                       disabled={isReadOnly || !!initialId}
                       className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                       checked={availableNfes.length > 0 && selectedNfeIds.length === availableNfes.length}
                       onChange={(e) => toggleNfeSelection('', true, e.target.checked)}
                     />
                  </th>
                  <th className="p-3 whitespace-nowrap font-semibold">Série</th>
                  <th className="p-3 whitespace-nowrap font-semibold">Número</th>
                  <th className="p-3 whitespace-nowrap font-semibold">Emissão</th>
                  <th className="p-3 whitespace-nowrap font-semibold">Cliente Destino</th>
                  <th className="p-3 whitespace-nowrap font-semibold text-right">Vols</th>
                  <th className="p-3 whitespace-nowrap font-semibold text-right">Peso (Kg)</th>
                  <th className="p-3 whitespace-nowrap font-semibold text-right">M³</th>
                  <th className="p-3 whitespace-nowrap font-semibold text-right">Valor NF-e</th>
                  <th className="p-3 whitespace-nowrap font-semibold text-center">Cidade/UF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {availableNfes.length === 0 ? (
                   <tr>
                      <td colSpan={10} className="p-8 text-center text-gray-500">
                         Nenhuma Nota Fiscal encontrada para este período. Configure a busca nas parametrizações acima.
                      </td>
                   </tr>
                ) : (
                  availableNfes.map(nf => {
                    const isSelected = selectedNfeIds.includes(nf.id);
                    return (
                      <tr 
                        key={nf.id} 
                        onClick={() => toggleNfeSelection(nf.id)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/70 dark:bg-blue-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            disabled={isReadOnly || !!initialId}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            checked={isSelected}
                            onChange={() => toggleNfeSelection(nf.id)}
                          />
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">{nf.serie || '1'}</td>
                        <td className="p-3 font-medium text-gray-900 dark:text-gray-100">{nf.numero}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">
                           {nf.data_emissao ? format(new Date(nf.data_emissao), 'dd/MM/yyyy') : '-'}
                        </td>
                        <td className="p-3 text-gray-800 dark:text-gray-200" title={nf.destinatario_nome}>
                           <div className="truncate max-w-[200px]">{nf.destinatario_nome}</div>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400 text-right">{nf.quantidade_volumes || 1}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-400 text-right">{Number(nf.peso_total || 0).toLocaleString('pt-BR')}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-400 text-right">{Number(nf.cubagem_total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 4})}</td>
                        <td className="p-3 font-medium text-gray-800 dark:text-gray-200 text-right">{Number(nf.valor_total || 0).toLocaleString('pt-BR', {style: 'currency', currency:'BRL'})}</td>
                        <td className="p-3 text-gray-500 dark:text-gray-400 text-center text-xs font-semibold bg-gray-50/50 dark:bg-gray-700/20">
                          {nf.customer?.[0] ? `${nf.customer[0].cidade} / ${nf.customer[0].estado}` : 'N/A'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
