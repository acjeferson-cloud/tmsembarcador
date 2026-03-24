import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info, DollarSign, Users, FileText, TrendingUp, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { ctesCompleteService, CTe, CTeInvoice } from '../../services/ctesCompleteService';
import { carriersService } from '../../services/carriersService';
import { establishmentsService } from '../../services/establishmentsService';
import { cteXmlService } from '../../services/cteXmlService';
import { freightCostCalculator } from '../../services/freightCostCalculator';
import { nfeService } from '../../services/nfeService';

interface CTeFormProps {
  onBack: () => void;
  onSave: (cte: any) => void;
  cte?: any;
  isEdit?: boolean;
  establishmentId?: string;
  establishmentName?: string;
}

export const CTeForm: React.FC<CTeFormProps> = ({
  onBack,
  onSave,
  cte,
  isEdit = false,
  establishmentId,
  establishmentName
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'values' | 'sender' | 'recipient' | 'shipper' | 'receiver' | 'payer' | 'costs' | 'invoices'>('basic');
  const [carriers, setCarriers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    establishment_id: establishmentId || cte?.establishment_id || '',
    carrier_id: cte?.carrier_id || '',
    freight_type: cte?.freight_type || 'CIF',
    number: cte?.number || '',
    series: cte?.series || '',
    access_key: cte?.access_key || '',
    issue_date: cte?.issue_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    entry_date: cte?.entry_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    origin: cte?.origin || 'XML',
    integration_date: cte?.integration_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    status: cte?.status || 'Validado',
    freight_weight_value: cte?.freight_weight_value || 0,
    freight_value_value: cte?.freight_value_value || 0,
    seccat_value: cte?.seccat_value || 0,
    dispatch_value: cte?.dispatch_value || 0,
    ademe_gris_value: cte?.ademe_gris_value || 0,
    itr_value: cte?.itr_value || 0,
    tas_value: cte?.tas_value || 0,
    collection_delivery_value: cte?.collection_delivery_value || 0,
    other_tax_value: cte?.other_tax_value || 0,
    toll_value: cte?.toll_value || 0,
    icms_rate: cte?.icms_rate || 0,
    icms_base: cte?.icms_base || 0,
    icms_value: cte?.icms_value || 0,
    pis_value: cte?.pis_value || 0,
    cofins_value: cte?.cofins_value || 0,
    other_value: cte?.other_value || 0,
    total_value: cte?.total_value || 0,
    sender_name: cte?.sender_name || '',
    sender_document: cte?.sender_document || '',
    sender_city: cte?.sender_city || '',
    sender_state: cte?.sender_state || '',
    recipient_name: cte?.recipient_name || '',
    recipient_document: cte?.recipient_document || '',
    recipient_city: cte?.recipient_city || '',
    recipient_state: cte?.recipient_state || '',
    shipper_name: cte?.shipper_name || '',
    shipper_document: cte?.shipper_document || '',
    receiver_name: cte?.receiver_name || '',
    receiver_document: cte?.receiver_document || '',
    payer_name: cte?.payer_name || '',
    payer_document: cte?.payer_document || '',
    cargo_weight: cte?.cargo_weight || 0,
    cargo_value: cte?.cargo_value || 0,
    cargo_volume: cte?.cargo_volume || 0,
    cargo_m3: cte?.cargo_m3 || 0,
    observations: cte?.observations || ''
  });

  const [invoices, setInvoices] = useState<CTeInvoice[]>(cte?.invoices || []);
  const [newInvoice, setNewInvoice] = useState<CTeInvoice>({
    cte_id: cte?.id || '',
    establishment_code: '',
    invoice_type: 'Saída',
    series: '',
    number: '',
    cost_value: 0,
    observations: ''
  });
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [xmlData, setXmlData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCarriers();
  }, []);

  const loadCarriers = async () => {
    try {
      const data = await carriersService.getAll();
      setCarriers(data);
    } catch (error) {
      console.error('Erro ao carregar transportadores:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [name]: numericValue
    }));
  };

  // Não recalcular o total automaticamente
  // O valor total vem do XML (vRec) e já inclui o ICMS

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.number) {
      setUploadStatus({
        type: 'error',
        message: 'Número do CT-e é obrigatório'
      });
      setTimeout(() => setUploadStatus({ type: null, message: '' }), 3000);
      return;
    }

    if (!formData.carrier_id) {
      setUploadStatus({
        type: 'error',
        message: 'Transportador é obrigatório'
      });
      setTimeout(() => setUploadStatus({ type: null, message: '' }), 3000);
      return;
    }

    setIsSaving(true);
    setUploadStatus({
      type: 'success',
      message: 'Salvando CT-e...'
    });

    try {
      // Garantir que campos de data nunca sejam vazios
      const currentDate = new Date().toISOString().split('T')[0];

      const dataToSave = {
        ...formData,
        establishment_id: establishmentId || null,
        carrier_id: formData.carrier_id || null,
        issue_date: formData.issue_date || currentDate,
        entry_date: formData.entry_date || currentDate,
        integration_date: formData.integration_date || currentDate,
        xml_data: xmlData
      };

      const result = await ctesCompleteService.create(dataToSave);

      if (result.success && result.id) {
        if (invoices.length > 0) {
          for (const invoice of invoices) {
            await ctesCompleteService.addInvoice({
              ...invoice,
              cte_id: result.id
            });
          }
        }

        try {
          const cteComplete = await ctesCompleteService.getById(result.id);
          if (cteComplete) {
            const calculation = await freightCostCalculator.calculateCTeCost(cteComplete);
            await freightCostCalculator.saveCostsToCTe(result.id, calculation);
          }
        } catch (calcError) {
          console.error('⚠️ Erro ao calcular custos:', calcError);
        }

        setUploadStatus({
          type: 'success',
          message: 'CT-e salvo com sucesso!'
        });

        setTimeout(() => {
          onSave(dataToSave);
          onBack();
        }, 2000);
      } else {
        setUploadStatus({
          type: 'error',
          message: result.error || 'Erro ao salvar CT-e'
        });

        // Se for erro de duplicata, atualizar a lista para mostrar o CT-e existente
        if (result.error?.includes('DUPLICADO') || result.error?.includes('duplicado')) {
          setTimeout(() => {
            setUploadStatus({ type: null, message: '' });
            onSave(dataToSave); // Atualiza a lista de CT-es
          }, 8000); // Dar tempo para o usuário ler a mensagem
        } else {
          setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar CT-e:', error);
      setUploadStatus({
        type: 'error',
        message: `Erro ao salvar CT-e: ${error.message}`
      });
      setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInvoice = () => {
    if (!newInvoice.number) {
      alert('Número da nota fiscal é obrigatório');
      return;
    }
    setInvoices([...invoices, { ...newInvoice }]);
    setNewInvoice({
      cte_id: cte?.id || '',
      establishment_code: '',
      invoice_type: 'Saída',
      series: '',
      number: '',
      cost_value: 0,
      observations: ''
    });
  };

  const handleRemoveInvoice = (index: number) => {
    setInvoices(invoices.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xml')) {
      setUploadStatus({
        type: 'error',
        message: 'Por favor, selecione um arquivo XML válido'
      });
      setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const xmlContent = event.target?.result as string;

        // Validar XML
        if (!cteXmlService.validateXml(xmlContent)) {
          setUploadStatus({
            type: 'error',
            message: 'XML inválido ou não é um CT-e'
          });
          setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
          return;
        }

        // Fazer parse do XML
        const parsedData = cteXmlService.parseXml(xmlContent);

        // Armazenar XML para salvamento posterior
        setXmlData({
          original: xmlContent,
          parsed: new Date().toISOString()
        });

        // Verificar se já existe CT-e com esta chave de acesso
        if (parsedData.access_key) {
          const existingCTe = await ctesCompleteService.findByAccessKey(parsedData.access_key);
          if (existingCTe) {
            const carrierName = existingCTe.carrier?.razao_social || 'N/A';
            const establishmentCode = existingCTe.establishment?.codigo || 'N/A';
            const establishmentName = existingCTe.establishment?.razao_social || 'N/A';
            const issueDate = existingCTe.issue_date
              ? new Date(existingCTe.issue_date).toLocaleDateString('pt-BR')
              : 'N/A';
            const cteNumber = existingCTe.number || 'N/A';
            const series = existingCTe.series || '0';

            setUploadStatus({
              type: 'error',
              message: `CT-e DUPLICADO! Este CT-e já foi importado anteriormente.\n\nDados do CT-e existente:\n• Número: ${cteNumber} / Série: ${series}\n• Transportador: ${carrierName}\n• Estabelecimento: ${establishmentCode} - ${establishmentName}\n• Data Emissão: ${issueDate}\n\nA lista de CT-es será atualizada em alguns segundos para você visualizar o registro existente.\n\nChave: ${parsedData.access_key.substring(0, 10)}...${parsedData.access_key.substring(parsedData.access_key.length - 10)}`
            });

            // Atualizar a lista após alguns segundos para mostrar o CT-e existente
            setTimeout(() => {
              setUploadStatus({ type: null, message: '' });
              onSave(formData); // Força refresh da lista
            }, 8000);
            return;
          }
        }

        // Buscar transportador pelo CNPJ do emitente
        let carrierId = formData.carrier_id;

        if (parsedData.emitter_cnpj) {
          const carrier = await carriersService.getByCnpj(parsedData.emitter_cnpj);

          if (carrier) {
            carrierId = carrier.id;
          } else {
          }
        } else {
        }


        // Preencher o formulário com os dados do XML
        setFormData(prev => ({
          ...prev,
          carrier_id: carrierId,
          number: parsedData.number,
          series: parsedData.series,
          access_key: parsedData.access_key,
          issue_date: parsedData.issue_date.split('T')[0],
          entry_date: new Date().toISOString().split('T')[0],
          freight_type: parsedData.freight_type,
          status: parsedData.status,
          freight_weight_value: parsedData.freight_weight_value,
          freight_value_value: parsedData.freight_value_value,
          seccat_value: parsedData.seccat_value,
          dispatch_value: parsedData.dispatch_value,
          ademe_gris_value: parsedData.ademe_gris_value,
          itr_value: parsedData.itr_value,
          tas_value: parsedData.tas_value,
          collection_delivery_value: parsedData.collection_delivery_value,
          other_tax_value: parsedData.other_tax_value,
          toll_value: parsedData.toll_value,
          icms_rate: parsedData.icms_rate,
          icms_base: parsedData.icms_base,
          icms_value: parsedData.icms_value,
          pis_value: parsedData.pis_value,
          cofins_value: parsedData.cofins_value,
          other_value: parsedData.other_value,
          total_value: parsedData.total_value,
          sender_name: parsedData.sender_name || '',
          sender_document: parsedData.sender_document || '',
          sender_city: parsedData.sender_city || '',
          sender_state: parsedData.sender_state || '',
          recipient_name: parsedData.recipient_name || '',
          recipient_document: parsedData.recipient_document || '',
          recipient_city: parsedData.recipient_city || '',
          recipient_state: parsedData.recipient_state || '',
          shipper_name: parsedData.shipper_name || '',
          shipper_document: parsedData.shipper_document || '',
          receiver_name: parsedData.receiver_name || '',
          receiver_document: parsedData.receiver_document || '',
          payer_name: parsedData.payer_name || '',
          payer_document: parsedData.payer_document || '',
          cargo_weight: parsedData.cargo_weight || 0,
          cargo_value: parsedData.cargo_value || 0,
          cargo_volume: parsedData.cargo_volume || 0,
          cargo_m3: parsedData.cargo_m3 || 0
        }));

        // Buscar e vincular notas fiscais do banco
        if (parsedData.invoices && parsedData.invoices.length > 0) {
          const accessKeys = parsedData.invoices
            .map(inv => inv.number)
            .filter((key): key is string => typeof key === 'string' && key.length === 44);

          if (accessKeys.length > 0) {
            try {
              const nfesFromDB = await nfeService.getByAccessKeys(accessKeys);

              const establishmentIds = [...new Set(
                nfesFromDB
                  .filter((nfe: any) => nfe.establishment_id)
                  .map((nfe: any) => nfe.establishment_id)
              )];

              const establishments = establishmentIds.length > 0
                ? await establishmentsService.getAll()
                : [];

              const linkedInvoices = await Promise.all(parsedData.invoices.map(async inv => {
                const nfeMatch = nfesFromDB.find((nfe: any) => nfe.access_key === inv.number);

                if (nfeMatch) {
                  const establishment = establishments.find(
                    est => est.id === nfeMatch.establishment_id
                  );

                  const establishmentCode = establishment
                    ? `${establishment.codigo} - ${establishment.razao_social}`
                    : nfeMatch.establishment_id || '';

                  return {
                    cte_id: cte?.id || '',
                    establishment_code: establishmentCode,
                    invoice_type: nfeMatch.invoice_type || 'Saída',
                    series: nfeMatch.series || inv.series || '',
                    number: nfeMatch.number || '',
                    cost_value: nfeMatch.total_value || 0,
                    observations: `Vinculada automaticamente - Chave: ${inv.number}`
                  };
                } else {
                  return {
                    cte_id: cte?.id || '',
                    establishment_code: inv.establishment_code || '',
                    invoice_type: inv.invoice_type || 'Saída',
                    series: inv.series || '',
                    number: inv.number?.substring(25, 34).replace(/^0+/, '') || '',
                    cost_value: inv.cost_value || 0,
                    observations: `NF-e não encontrada no banco - Chave: ${inv.number}`
                  };
                }
              }));

              setInvoices(linkedInvoices);

              const foundCount = linkedInvoices.filter(inv =>
                inv.observations?.includes('Vinculada automaticamente')
              ).length;

              const carrierInfo = carrierId && parsedData.emitter_cnpj
                ? ' Transportador vinculado.'
                : '';

              setUploadStatus({
                type: 'success',
                message: `XML importado com sucesso! CT-e ${parsedData.number} carregado. ${foundCount} de ${parsedData.invoices.length} NF-e(s) vinculada(s).${carrierInfo}`
              });
              setTimeout(() => setUploadStatus({ type: null, message: '' }), 7000);
            } catch (error) {
              console.error('Erro ao buscar NF-es:', error);
              const invoicesList = parsedData.invoices.map(inv => ({
                ...inv,
                cte_id: cte?.id || ''
              }));
              setInvoices(invoicesList);

              const carrierInfo = carrierId && parsedData.emitter_cnpj
                ? ' Transportador vinculado.'
                : '';

              setUploadStatus({
                type: 'success',
                message: `XML importado com sucesso! CT-e ${parsedData.number} carregado. Erro ao vincular NF-es.${carrierInfo}`
              });
              setTimeout(() => setUploadStatus({ type: null, message: '' }), 7000);
            }
          } else {
            const invoicesList = parsedData.invoices.map(inv => ({
              ...inv,
              cte_id: cte?.id || ''
            }));
            setInvoices(invoicesList);

            const carrierInfo = carrierId && parsedData.emitter_cnpj
              ? ' Transportador vinculado.'
              : '';

            setUploadStatus({
              type: 'success',
              message: `XML importado com sucesso! CT-e ${parsedData.number} carregado.${carrierInfo}`
            });
            setTimeout(() => setUploadStatus({ type: null, message: '' }), 7000);
          }
        } else {
          const carrierInfo = carrierId && parsedData.emitter_cnpj
            ? ' Transportador vinculado.'
            : '';

          setUploadStatus({
            type: 'success',
            message: `XML importado com sucesso! CT-e ${parsedData.number} carregado.${carrierInfo}`
          });
          setTimeout(() => setUploadStatus({ type: null, message: '' }), 7000);
        }

      } catch (error: any) {
        console.error('Erro ao processar XML:', error);
        setUploadStatus({
          type: 'error',
          message: error.message || 'Erro ao processar XML do CT-e'
        });
        setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
      }
    };

    reader.onerror = () => {
      setUploadStatus({
        type: 'error',
        message: 'Erro ao ler o arquivo'
      });
      setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
    };

    reader.readAsText(file);

    // Limpar o input para permitir upload do mesmo arquivo novamente
    e.target.value = '';
  };

  const tabs = [
    { id: 'basic', label: 'Dados Básicos', icon: Info },
    { id: 'values', label: 'Valores', icon: DollarSign },
    { id: 'sender', label: 'Remetente', icon: Users },
    { id: 'recipient', label: 'Destinatário', icon: Users },
    { id: 'shipper', label: 'Expedidor', icon: Users },
    { id: 'receiver', label: 'Recebedor', icon: Users },
    { id: 'payer', label: 'Tomador', icon: Users },
    { id: 'invoices', label: 'Notas Fiscais', icon: FileText }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Voltar para CT-es</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Editar CT-e' : 'Inserir CT-e'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Preencha os dados do conhecimento de transporte</p>
      </div>

      {/* Upload XML */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <Upload className="text-blue-600" size={24} />
          <div className="flex-1">
            <label htmlFor="xml-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-800 font-medium">
                Importar XML do CT-e
              </span>
              <input
                type="file"
                id="xml-upload"
                accept=".xml"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Selecione um arquivo XML para importar automaticamente</p>
          </div>
        </div>

        {/* Status do Upload */}
        {uploadStatus.type && (
          <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
            uploadStatus.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {uploadStatus.type === 'success' ? (
              <CheckCircle size={20} className="text-green-600" />
            ) : (
              <AlertCircle size={20} className="text-red-600" />
            )}
            <span className="text-sm font-medium">{uploadStatus.message}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex overflow-x-auto px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Básicos */}
        {activeTab === 'basic' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dados Básicos</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estabelecimento *
                </label>
                <input
                  type="text"
                  value={establishmentName || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transportador *
                </label>
                <select
                  name="carrier_id"
                  value={formData.carrier_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o transportador</option>
                  {carriers.map(carrier => (
                    <option key={carrier.id} value={carrier.id}>
                      {carrier.codigo} - {carrier.razao_social}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Frete *
                </label>
                <select
                  name="freight_type"
                  value={formData.freight_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CIF">CIF (Pago)</option>
                  <option value="FOB">FOB (A pagar)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número *
                </label>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Série
                </label>
                <input
                  type="text"
                  name="series"
                  value={formData.series}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chave de Acesso
                </label>
                <input
                  type="text"
                  name="access_key"
                  value={formData.access_key}
                  onChange={handleInputChange}
                  maxLength={44}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="44 dígitos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Emissão
                </label>
                <input
                  type="date"
                  name="issue_date"
                  value={formData.issue_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Entrada
                </label>
                <input
                  type="date"
                  name="entry_date"
                  value={formData.entry_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Origem
                </label>
                <select
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="XML">XML</option>
                  <option value="EDI">EDI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Integração ao ERP
                </label>
                <input
                  type="date"
                  name="integration_date"
                  value={formData.integration_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status do CT-e
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Validado">Validado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Valores */}
        {activeTab === 'values' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Valores</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frete Peso
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="freight_weight_value"
                  value={formData.freight_weight_value}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frete Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="freight_value_value"
                  value={formData.freight_value_value}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SECCAT
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="seccat_value"
                  value={formData.seccat_value}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Despacho
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="dispatch_value"
                  value={formData.dispatch_value}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ADEME/GRIS
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="ademe_gris_value"
                  value={formData.ademe_gris_value}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ITR
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="itr_value"
                  value={formData.itr_value}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  TAS
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="tas_value"
                  value={formData.tas_value}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coleta/Entrega
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="collection_delivery_value"
                  value={formData.collection_delivery_value}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Taxa Outros
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="other_tax_value"
                  value={formData.other_tax_value}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pedágio
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="toll_value"
                  value={formData.toll_value}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alíquota ICMS (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="icms_rate"
                  value={formData.icms_rate}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Base ICMS
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="icms_base"
                  value={formData.icms_base}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor ICMS
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="icms_value"
                  value={formData.icms_value}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PIS
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="pis_value"
                  value={formData.pis_value}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  COFINS
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="cofins_value"
                  value={formData.cofins_value}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Outros
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="other_value"
                  value={formData.other_value}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Valor Total do CT-e:</span>
                <span className="text-2xl font-bold text-blue-600">
                  R$ {formData.total_value.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Remetente */}
        {activeTab === 'sender' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Remetente</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome/Razão Social
                </label>
                <input
                  type="text"
                  name="sender_name"
                  value={formData.sender_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  name="sender_document"
                  value={formData.sender_document}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  name="sender_city"
                  value={formData.sender_city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <input
                  type="text"
                  name="sender_state"
                  value={formData.sender_state}
                  onChange={handleInputChange}
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="UF"
                />
              </div>
            </div>
          </div>
        )}

        {/* Destinatário */}
        {activeTab === 'recipient' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Destinatário</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome/Razão Social
                </label>
                <input
                  type="text"
                  name="recipient_name"
                  value={formData.recipient_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  name="recipient_document"
                  value={formData.recipient_document}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  name="recipient_city"
                  value={formData.recipient_city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <input
                  type="text"
                  name="recipient_state"
                  value={formData.recipient_state}
                  onChange={handleInputChange}
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="UF"
                />
              </div>
            </div>
          </div>
        )}

        {/* Expedidor */}
        {activeTab === 'shipper' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expedidor</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome/Razão Social
                </label>
                <input
                  type="text"
                  name="shipper_name"
                  value={formData.shipper_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  name="shipper_document"
                  value={formData.shipper_document}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Recebedor */}
        {activeTab === 'receiver' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recebedor</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome/Razão Social
                </label>
                <input
                  type="text"
                  name="receiver_name"
                  value={formData.receiver_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  name="receiver_document"
                  value={formData.receiver_document}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tomador */}
        {activeTab === 'payer' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tomador</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome/Razão Social
                </label>
                <input
                  type="text"
                  name="payer_name"
                  value={formData.payer_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  name="payer_document"
                  value={formData.payer_document}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Notas Fiscais */}
        {activeTab === 'invoices' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notas Fiscais</h2>

            <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Adicionar Nota Fiscal</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estabelecimento
                  </label>
                  <input
                    type="text"
                    value={newInvoice.establishment_code}
                    onChange={(e) => setNewInvoice({ ...newInvoice, establishment_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo
                  </label>
                  <select
                    value={newInvoice.invoice_type}
                    onChange={(e) => setNewInvoice({ ...newInvoice, invoice_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Saída">Saída</option>
                    <option value="Entrada">Entrada</option>
                    <option value="Devolução">Devolução</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Série
                  </label>
                  <input
                    type="text"
                    value={newInvoice.series}
                    onChange={(e) => setNewInvoice({ ...newInvoice, series: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número *
                  </label>
                  <input
                    type="text"
                    value={newInvoice.number}
                    onChange={(e) => setNewInvoice({ ...newInvoice, number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor de Custos
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newInvoice.cost_value}
                    onChange={(e) => setNewInvoice({ ...newInvoice, cost_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddInvoice}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Notas Fiscais */}
            {invoices.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Estabelecimento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Série</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Número</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((invoice, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{invoice.establishment_code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{invoice.invoice_type}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{invoice.series}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{invoice.number}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">R$ {invoice.cost_value.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            type="button"
                            onClick={() => handleRemoveInvoice(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Observações */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Observações
          </label>
          <textarea
            name="observations"
            value={formData.observations}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Observações adicionais sobre o CT-e"
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors ${
              isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {isSaving ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Salvar')} CT-e
          </button>
        </div>
      </form>
    </div>
  );
};
