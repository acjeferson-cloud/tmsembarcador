import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Trash2, DollarSign, Info, MapPin, User, Package, Edit, Settings, Map, Receipt, AlertTriangle, Copy } from 'lucide-react';
import { freightRatesService, FreightRateTable, FreightRate } from '../../services/freightRatesService';
import { carriersService, Carrier } from '../../services/carriersService';
import { FreightRateValuesForm } from './FreightRateValuesForm';
import { FreightRateCitiesModal } from './FreightRateCitiesModal';
import { AdditionalFeesModal } from './AdditionalFeesModal';
import RestrictedItemsModal from './RestrictedItemsModal';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface FreightRateTableFormProps {
  onBack: () => void;
  onSave: () => void;
  table?: FreightRateTable | null;
  carrierId?: string;
  carrierName?: string;
  readOnly?: boolean;
}

export const FreightRateTableForm: React.FC<FreightRateTableFormProps> = ({

  onBack,
  onSave,
  table,
  carrierId,
  readOnly = false
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nome: table?.nome || '',
    transportador_id: table?.transportador_id || carrierId || '',
    data_inicio: table?.data_inicio || new Date().toISOString().split('T')[0],
    data_fim: table?.data_fim || '',
    status: table?.status || 'ativo' as 'ativo' | 'inativo',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    table_type: (table as any)?.table_type || 'Saída' as 'Entrada' | 'Saída',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modal: (table as any)?.modal || ''
  });

  const [tarifas, setTarifas] = useState<FreightRate[]>([]);
  const [carriersList, setCarriersList] = useState<Carrier[]>([]);
  const [availableModals, setAvailableModals] = useState<string[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showValuesForm, setShowValuesForm] = useState(false);
  const [editingRateValues, setEditingRateValues] = useState<FreightRate | null>(null);
  const [showCitiesModal, setShowCitiesModal] = useState(false);
  const [selectedRateForCities, setSelectedRateForCities] = useState<FreightRate | null>(null);
  const [showFeesModal, setShowFeesModal] = useState(false);
  const [showRestrictedItemsModal, setShowRestrictedItemsModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const confirmAction = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  useEffect(() => {
    loadCarriers();
  }, []);

  useEffect(() => {
    if (table && table.tarifas) {
      setTarifas(table.tarifas);
    }
  }, [table]);

  useEffect(() => {
    if (formData.transportador_id) {
      updateAvailableModals(formData.transportador_id);
    }
  }, [formData.transportador_id, carriersList]);

  const loadCarriers = async () => {
    try {
      const data = await carriersService.getAll();
      setCarriersList(data);
    } catch (error) {

    }
  };

  const updateAvailableModals = (carrierId: string) => {
    const carrier = carriersList.find(c => c.id === carrierId);
    if (!carrier) return;

    const modals: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((carrier as any).modal_rodoviario) modals.push('rodoviario');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((carrier as any).modal_aereo) modals.push('aereo');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((carrier as any).modal_aquaviario) modals.push('aquaviario');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((carrier as any).modal_ferroviario) modals.push('ferroviario');

    setAvailableModals(modals);

    // Se o modal atual não está disponível, limpar
    if (formData.modal && !modals.includes(formData.modal)) {
      setFormData(prev => ({ ...prev, modal: '' }));
    }
  };

  // Form for new rate
  const [showRateForm, setShowRateForm] = useState(false);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [rateFormData, setRateFormData] = useState({
    descricao: '',
    tipo_aplicacao: 'cidade' as 'cidade' | 'cliente' | 'produto',
    prazo_entrega: 1,
    valor: 0,
    observacoes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific field errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRateFormData(prev => ({
      ...prev,
      [name]: name === 'prazo_entrega' || name === 'valor' ? parseFloat(value) || 0 : value
    }));
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleAddRate = async () => {
    if (!rateFormData.descricao) {
      setToast({ message: 'Por favor, informe a descrição da tarifa.', type: 'error' });
      return;
    }

    if (editingRateId !== null) {
      // Update existing rate
      setTarifas(prev => prev.map(tarifa =>
        tarifa.id === editingRateId ? { ...tarifa, ...rateFormData } : tarifa
      ));
    } else {
      // Add new rate
      const newCode = await freightRatesService.getNextRateCode(table?.id || '', tarifas);

      setTarifas(prev => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          freight_rate_table_id: table?.id || '',
          data_inicio: formData.data_inicio,
          codigo: newCode,
          ...rateFormData
        }
      ]);
    }

    // Reset form
    setRateFormData({
      descricao: '',
      tipo_aplicacao: 'cidade',
      prazo_entrega: 1,
      valor: 0,
      observacoes: ''
    });
    setShowRateForm(false);
    setEditingRateId(null);
  };

  const handleEditRate = (rate: FreightRate) => {
    setRateFormData({
      descricao: rate.descricao,
      tipo_aplicacao: rate.tipo_aplicacao,
      prazo_entrega: rate.prazo_entrega,
      valor: rate.valor,
      observacoes: rate.observacoes || ''
    });
    setEditingRateId(rate.id);
    setShowRateForm(true);
  };

  const handleDeleteRate = async (rateId: string) => {
    const confirmed = await confirmAction(
      'Excluir Tarifa',
      'Tem certeza que deseja excluir esta tarifa?'
    );
    if (confirmed) {
      setTarifas(prev => prev.filter(tarifa => tarifa.id !== rateId));
    }
  };

  const handleDuplicateRate = async (rate: FreightRate) => {
    const confirmed = await confirmAction(
      'Duplicar Tarifa',
      `${t('carriers.freightRates.form.duplicateConfirm')} "${rate.descricao}"?`
    );
    if (confirmed) {
      try {
        await freightRatesService.duplicateRate(rate.id);
        setToast({ message: t('carriers.freightRates.form.duplicateSuccess'), type: 'success' });

        // Recarregar as tarifas
        if (table?.id) {
          const updatedTable = await freightRatesService.getTableById(table.id);
          if (updatedTable && updatedTable.tarifas) {
            setTarifas(updatedTable.tarifas);
          }
        }
      } catch (error) {

        setToast({ message: t('carriers.freightRates.form.duplicateError'), type: 'error' });
      }
    }
  };

  const handleOpenRateValues = (rate: FreightRate) => {
    setEditingRateValues(rate);
    setShowValuesForm(true);
  };

  const handleSaveRateValues = async (updatedRate: FreightRate) => {
    try {

      // Se a tarifa tem ID real (não temporário), salvar no banco
      if (updatedRate.id && !updatedRate.id.startsWith('temp-')) {
        await freightRatesService.updateRate(updatedRate.id, updatedRate);

        // Recarregar os detalhes do banco para confirmar que foram salvos
        const detalhesRecarregados = await freightRatesService.getDetailsByRate(updatedRate.id);

        // Atualizar o rate com os detalhes recarregados
        updatedRate.detalhes = detalhesRecarregados;
      } else {
      }

      // Atualizar state local
      setTarifas(prev => prev.map(tarifa =>
        tarifa.id === updatedRate.id ? updatedRate : tarifa
      ));

      setShowValuesForm(false);
      setEditingRateValues(null);

      setToast({ message: 'Valores da tarifa salvos com sucesso!', type: 'success' });
    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      setToast({
        message: `Erro ao salvar valores: ${errorMessage}`,
        type: 'error'
      });
    }
  };

  const handleOpenCitiesModal = (rate: FreightRate) => {
    setSelectedRateForCities(rate);
    setShowCitiesModal(true);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.nome || formData.nome.trim() === '') {
      newErrors.nome = 'Nome da tabela é obrigatório';
    }

    if (!formData.transportador_id) {
      newErrors.transportador_id = 'Transportador é obrigatório';
    }

    if (!formData.modal) {
      newErrors.modal = 'Modal de transporte é obrigatório';
    } else if (availableModals.length > 0 && !availableModals.includes(formData.modal)) {
      newErrors.modal = 'Modal selecionado não está disponível para este transportador';
    }

    if (!formData.data_inicio) {
      newErrors.data_inicio = 'Data de início é obrigatória';
    }

    if (!formData.data_fim) {
      newErrors.data_fim = 'Data de fim é obrigatória';
    } else if (formData.data_fim < formData.data_inicio) {
      newErrors.data_fim = 'Data de fim deve ser posterior à data de início';
    }

    if (!formData.table_type) {
      newErrors.table_type = t('carriers.freightRates.validation.tableTypeRequired', 'Tipo de tabela é obrigatório');
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setToast({ message: t('carriers.freightRates.form.fillRequired'), type: 'error' });
      return;
    }

    if (tarifas.length === 0) {
      const confirmed = await confirmAction(
        'Salvar sem tarifas',
        t('carriers.freightRates.form.confirmNoRates') || 'Tem certeza?'
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      const tableData = {
        nome: formData.nome,
        transportador_id: formData.transportador_id,
        modal: formData.modal,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim,
        status: formData.status,
        table_type: formData.table_type,
        tarifas
      };


      if (table?.id) {
        await freightRatesService.updateTable(table.id, tableData);

        // Salvar novas tarifas (aquelas com IDs temporários)
        const novasTarifas = tarifas.filter(tarifa => tarifa.id.startsWith('temp-'));

        for (const tarifa of novasTarifas) {
          // Extrai campos para não duplicar no objeto passado para createRate
          // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
          const { id, detalhes, freight_rate_table_id, data_inicio, ...tarifaData } = tarifa as any;

          const novaTarifa = await freightRatesService.createRate({
            freight_rate_table_id: table.id,
            data_inicio: formData.data_inicio,
            ...tarifaData
          });

          // Salvar detalhes se existirem
          if (detalhes && detalhes.length > 0) {
            await freightRatesService.updateRate(novaTarifa.id, { detalhes });
          }
        }

        // Atualizar tarifas existentes (aquelas com IDs reais)
        const tarifasExistentes = tarifas.filter(tarifa => !tarifa.id.startsWith('temp-'));

        for (const tarifa of tarifasExistentes) {
          try {

            // Remover campos que não devem ser atualizados
            // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
            const { id, freight_rate_table_id, codigo, created_at, updated_at, ...tarifaData } = tarifa as any;

            // Incluir os detalhes no update
            await freightRatesService.updateRate(id, {
              ...tarifaData,
              detalhes: tarifa.detalhes
            });

          } catch (error) {

            throw new Error(`Erro ao atualizar tarifa ${tarifa.descricao}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
        }

        setToast({ message: t('carriers.freightRates.form.saveSuccess'), type: 'success' });
      } else {
        await freightRatesService.createTable(tableData);
        setToast({ message: t('carriers.freightRates.form.createSuccess'), type: 'success' });
      }

      setTimeout(() => {
        onSave();
      }, 1500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {

      const errorMessage = error?.message || 'Erro desconhecido';
      setToast({ message: `Erro ao salvar tabela de frete: ${errorMessage}`, type: 'error' });
    }
  };

  const getTipoAplicacaoLabel = (tipo: string) => {
    switch (tipo) {
      case 'cidade': return t('carriers.freightRates.form.byCity');
      case 'cliente': return t('carriers.freightRates.form.byClient');
      case 'produto': return t('carriers.freightRates.form.byProduct');
      default: return tipo;
    }
  };

  const getTipoAplicacaoIcon = (tipo: string) => {
    switch (tipo) {
      case 'cidade': return <MapPin size={14} className="text-blue-600" />;
      case 'cliente': return <User size={14} className="text-green-600" />;
      case 'produto': return <Package size={14} className="text-purple-600" />;
      default: return <DollarSign size={14} className="text-gray-600 dark:text-gray-400" />;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>{t('carriers.freightRates.form.backToTables')}</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {readOnly ? t('carriers.freightRates.form.titleView') : table ? t('carriers.freightRates.form.titleEdit') : t('carriers.freightRates.form.titleNew')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {readOnly ? t('carriers.freightRates.form.subtitleView') : t('carriers.freightRates.form.subtitleNew')}
            </p>
          </div>
          {table && (
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setShowFeesModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Receipt size={20} />
                <span>{t('carriers.freightRates.form.additionalFees')}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRestrictedItemsModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <AlertTriangle size={20} />
                <span>{t('carriers.freightRates.form.restrictedItems')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('carriers.freightRates.form.basicInfo')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('carriers.freightRates.form.tableName')}
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
                disabled={readOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nome ? 'border-red-300' : 'border-gray-300'
                } ${readOnly ? 'bg-gray-100' : ''}`}
                placeholder={t('carriers.freightRates.form.tableNamePlaceholder')}
              />
              {errors.nome && (
                <p className="mt-1 text-sm text-red-600">{errors.nome}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('carriers.freightRates.form.carrier')}
              </label>
              <select
                name="transportador_id"
                value={formData.transportador_id}
                onChange={handleInputChange}
                required
                disabled={!!carrierId || readOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.transportador_id ? 'border-red-300' : 'border-gray-300'
                } ${(carrierId || readOnly) ? 'bg-gray-100' : ''}`}
              >
                <option value="">{t('carriers.freightRates.form.selectCarrier')}</option>
                {carriersList.map(carrier => (
                  <option key={carrier.id} value={carrier.id}>
                    {carrier.codigo} - {carrier.razao_social}
                  </option>
                ))}
              </select>
              {errors.transportador_id && (
                <p className="mt-1 text-sm text-red-600">{errors.transportador_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('carriers.freightRates.form.startDate')}
              </label>
              <input
                type="date"
                name="data_inicio"
                value={formData.data_inicio}
                onChange={handleInputChange}
                required
                disabled={readOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.data_inicio ? 'border-red-300' : 'border-gray-300'
                } ${readOnly ? 'bg-gray-100' : ''}`}
              />
              {errors.data_inicio && (
                <p className="mt-1 text-sm text-red-600">{errors.data_inicio}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('carriers.freightRates.form.endDate')}
              </label>
              <input
                type="date"
                name="data_fim"
                value={formData.data_fim}
                onChange={handleInputChange}
                required
                disabled={readOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.data_fim ? 'border-red-300' : 'border-gray-300'
                } ${readOnly ? 'bg-gray-100' : ''}`}
              />
              {errors.data_fim && (
                <p className="mt-1 text-sm text-red-600">{errors.data_fim}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('carriers.freightRates.form.status')}
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                disabled={readOnly}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${readOnly ? 'bg-gray-100' : ''}`}
              >
                <option value="ativo">{t('carriers.freightRates.form.active')}</option>
                <option value="inativo">{t('carriers.freightRates.form.inactive')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('carriers.freightRates.form.tableType')}
              </label>
              <select
                name="table_type"
                value={formData.table_type}
                onChange={handleInputChange}
                required
                disabled={readOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.table_type ? 'border-red-300' : 'border-gray-300'
                } ${readOnly ? 'bg-gray-100' : ''}`}
              >
                <option value="Entrada">{t('carriers.freightRates.form.inbound')}</option>
                <option value="Saída">{t('carriers.freightRates.form.outbound')}</option>
              </select>
              {errors.table_type && (
                <p className="mt-1 text-sm text-red-600">{errors.table_type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('carriers.freightRates.form.transportModal')}
              </label>
              <select
                name="modal"
                value={formData.modal}
                onChange={handleInputChange}
                required
                disabled={readOnly || !formData.transportador_id || availableModals.length === 0}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.modal ? 'border-red-300' : 'border-gray-300'
                } ${(readOnly || !formData.transportador_id || availableModals.length === 0) ? 'bg-gray-100' : ''}`}
              >
                <option value="">
                  {!formData.transportador_id
                    ? t('carriers.freightRates.form.selectCarrierFirst')
                    : availableModals.length === 0
                      ? t('carriers.freightRates.form.noModalsConfigured')
                      : t('carriers.freightRates.form.selectModal')}
                </option>
                {availableModals.includes('rodoviario') && <option value="rodoviario">{t('carriers.freightRates.form.road')}</option>}
                {availableModals.includes('aereo') && <option value="aereo">{t('carriers.freightRates.form.air')}</option>}
                {availableModals.includes('aquaviario') && <option value="aquaviario">{t('carriers.freightRates.form.water')}</option>}
                {availableModals.includes('ferroviario') && <option value="ferroviario">{t('carriers.freightRates.form.rail')}</option>}
              </select>
              {errors.modal && (
                <p className="mt-1 text-sm text-red-600">{errors.modal}</p>
              )}
              {formData.transportador_id && availableModals.length === 0 && (
                <p className="mt-1 text-sm text-amber-600">
                  {t('carriers.freightRates.form.modalWarning')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Rates Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('carriers.freightRates.form.rates')}</h2>
            {!readOnly && (
              <button
                type="button"
                onClick={() => setShowRateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus size={16} />
                <span>{t('carriers.freightRates.form.addRate')}</span>
              </button>
            )}
          </div>

          {/* Rate Form */}
          {showRateForm && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">
                  {editingRateId !== null ? t('carriers.freightRates.form.editRate') : t('carriers.freightRates.form.newRate')}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowRateForm(false);
                    setEditingRateId(null);
                    setRateFormData({
                      descricao: '',
                      tipo_aplicacao: 'cidade',
                      prazo_entrega: 1,
                      valor: 0,
                      observacoes: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('carriers.freightRates.form.rateDescription')}
                  </label>
                  <input
                    type="text"
                    name="descricao"
                    value={rateFormData.descricao}
                    onChange={handleRateInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('carriers.freightRates.form.rateDescriptionPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('carriers.freightRates.form.applicationType')}
                  </label>
                  <select
                    name="tipo_aplicacao"
                    value={rateFormData.tipo_aplicacao}
                    onChange={handleRateInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cidade">{t('carriers.freightRates.form.byCity')}</option>
                    <option value="cidade">{t('carriers.freightRates.form.byClient')}</option>
                    <option value="cidade">{t('carriers.freightRates.form.byProduct')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('carriers.freightRates.form.deliveryTime')}
                  </label>
                  <input
                    type="number"
                    name="prazo_entrega"
                    value={rateFormData.prazo_entrega}
                    onChange={handleRateInputChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('carriers.freightRates.form.value')}
                  </label>
                  <input
                    type="number"
                    name="valor"
                    value={rateFormData.valor}
                    onChange={handleRateInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('carriers.freightRates.form.observations')}
                  </label>
                  <textarea
                    name="observacoes"
                    value={rateFormData.observacoes}
                    onChange={handleRateInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('carriers.freightRates.form.observationsPlaceholder')}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddRate}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {editingRateId !== null ? t('carriers.freightRates.form.updateRate') : t('carriers.freightRates.form.addRate')}
                </button>
              </div>
            </div>
          )}

          {/* Rates List */}
          {tarifas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('carriers.freightRates.form.code')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('carriers.freightRates.form.description')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('carriers.freightRates.form.type')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('carriers.freightRates.form.deadline')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Valor
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('carriers.freightRates.form.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                  {tarifas.map((rate) => (
                    <tr key={rate.id} className="hover:bg-gray-50 dark:bg-gray-900">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {rate.codigo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {rate.descricao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          {getTipoAplicacaoIcon(rate.tipo_aplicacao)}
                          <span>{getTipoAplicacaoLabel(rate.tipo_aplicacao)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {rate.prazo_entrega} {rate.prazo_entrega === 1 ? 'dia' : 'dias'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(rate.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenRateValues(rate)}
                            className="text-green-600 hover:text-green-900"
                            title={t('carriers.freightRates.form.values')}
                          >
                            <Settings size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCitiesModal(rate)}
                            className="text-purple-600 hover:text-purple-900"
                            title={t('carriers.freightRates.form.cities')}
                          >
                            <Map size={16} />
                          </button>
                          {!readOnly && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleEditRate(rate)}
                                className="text-blue-600 hover:text-blue-900"
                                title={t('carriers.freightRates.form.editRate')}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateRate(rate)}
                                className="text-orange-600 hover:text-orange-900"
                                title="Duplicar Tarifa"
                              >
                                <Copy size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRate(rate.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t('carriers.freightRates.form.noRates')}</p>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setShowRateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
                >
                  <Plus size={16} />
                  <span>{t('carriers.freightRates.form.addRate')}</span>
                </button>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info size={16} className="text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">{t('carriers.freightRates.form.aboutRatesTitle')}</p>
                <p className="text-xs text-blue-700 mt-1">
                  {t('carriers.freightRates.form.aboutRatesDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
          >
            {readOnly ? t('carriers.freightRates.form.back') : t('carriers.freightRates.form.cancel')}
          </button>
          {!readOnly && (
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {table ? t('carriers.freightRates.form.updateTable') : t('carriers.freightRates.form.saveTable')}
            </button>
          )}
        </div>
      </form>

      {/* Modal de Valores */}
      {showValuesForm && editingRateValues && (
        <FreightRateValuesForm
          rate={editingRateValues}
          onSave={handleSaveRateValues}
          onCancel={() => {
            setShowValuesForm(false);
            setEditingRateValues(null);
          }}
        />
      )}

      {/* Modal de Cidades */}
      {showCitiesModal && selectedRateForCities && table?.id && (
        <FreightRateCitiesModal
          rate={selectedRateForCities}
          tableId={table.id}
          onClose={() => {
            setShowCitiesModal(false);
            setSelectedRateForCities(null);
          }}
          onUpdate={() => {}}
        />
      )}

      {/* Modal de Taxas Adicionais */}
      {showFeesModal && table?.id && (
        <AdditionalFeesModal
          freightRateTableId={table.id}
          freightRateTableName={table.nome}
          onClose={() => setShowFeesModal(false)}
        />
      )}

      {/* Modal de Itens Restritos */}
      {showRestrictedItemsModal && table?.id && (
        <RestrictedItemsModal
          freightRateTableId={table.id.toString()}
          freightRateTableName={table.nome}
          onClose={() => setShowRestrictedItemsModal(false)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
      />
    </div>
  );
};