import React, { useState } from 'react';
import { X, Plus, Trash2, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FreightRate, FreightRateDetail } from '../../services/freightRatesService';

interface FreightRateValuesFormProps {
  rate: FreightRate;
  onSave: (rate: FreightRate) => void;
  onCancel: () => void;
}

export const FreightRateValuesForm: React.FC<FreightRateValuesFormProps> = ({
  rate,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation();

  const [showHelpModal, setShowHelpModal] = useState(false);


  const [grisInputValue, setGrisInputValue] = useState<string>(
    rate.percentual_gris
      ? Number(rate.percentual_gris).toFixed(5).replace('.', ',')
      : ''
  );

  const [formData, setFormData] = useState<FreightRate>({
    ...rate,
    pedagio_minimo: rate.pedagio_minimo || 0,
    pedagio_por_kg: rate.pedagio_por_kg || 0,
    pedagio_a_cada_kg: rate.pedagio_a_cada_kg || 0,
    pedagio_tipo_kg: rate.pedagio_tipo_kg || 'peso_calculo',
    icms_embutido_tabela: rate.icms_embutido_tabela || 'nao_embutido',
    aliquota_icms: rate.aliquota_icms || 0,
    fator_m3: rate.fator_m3 || 0,
    fator_m3_apartir_kg: rate.fator_m3_apartir_kg || 0,
    fator_m3_apartir_m3: rate.fator_m3_apartir_m3 || 0,
    fator_m3_apartir_valor: rate.fator_m3_apartir_valor || 0,
    percentual_gris: rate.percentual_gris || 0,
    gris_minimo: rate.gris_minimo || 0,
    seccat: rate.seccat || 0,
    despacho: rate.despacho || 0,
    itr: rate.itr || 0,
    taxa_adicional: rate.taxa_adicional || 0,
    coleta_entrega: rate.coleta_entrega || 0,
    tde_trt: rate.tde_trt || 0,
    tas: rate.tas || 0,
    taxa_suframa: rate.taxa_suframa || 0,
    valor_outros_percent: rate.valor_outros_percent || 0,
    valor_outros_minimo: rate.valor_outros_minimo || 0,
    taxa_outros_valor: rate.taxa_outros_valor || 0,
    taxa_outros_tipo_valor: rate.taxa_outros_tipo_valor || 'valor',
    taxa_apartir_de: rate.taxa_apartir_de || 0,
    taxa_apartir_de_tipo: rate.taxa_apartir_de_tipo || 'sem_apartir',
    taxa_outros_a_cada: rate.taxa_outros_a_cada || 0,
    taxa_outros_minima: rate.taxa_outros_minima || 0,
    frete_peso_minimo: rate.frete_peso_minimo || 0,
    frete_valor_minimo: rate.frete_valor_minimo || 0,
    frete_tonelada_minima: rate.frete_tonelada_minima || 0,
    frete_percentual_minimo: rate.frete_percentual_minimo || 0,
    frete_m3_minimo: rate.frete_m3_minimo || 0,
    valor_total_minimo: rate.valor_total_minimo || 0,
    detalhes: rate.detalhes || []
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = [
      'pedagio_minimo', 'pedagio_por_kg', 'pedagio_a_cada_kg', 'aliquota_icms',
      'fator_m3', 'fator_m3_apartir_kg', 'fator_m3_apartir_m3', 'fator_m3_apartir_valor',
      'percentual_gris', 'gris_minimo', 'seccat', 'despacho', 'itr', 'taxa_adicional',
      'coleta_entrega', 'tde_trt', 'tas', 'taxa_suframa', 'valor_outros_percent',
      'valor_outros_minimo', 'taxa_outros_valor', 'taxa_apartir_de', 'taxa_outros_a_cada',
      'taxa_outros_minima', 'frete_peso_minimo', 'frete_valor_minimo', 'frete_tonelada_minima',
      'frete_percentual_minimo', 'frete_m3_minimo', 'valor_total_minimo'
    ];

    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddDetail = () => {
    const newDetail: FreightRateDetail = {
      freight_rate_id: rate.id,
      ordem: (formData.detalhes?.length || 0) + 1,
      peso_ate: 0,
      m3_ate: 0,
      volume_ate: 0,
      valor_ate: 0,
      valor_faixa: 0,
      tipo_calculo: 'valor_faixa',
      tipo_frete: 'normal',
      frete_valor: 0,
      frete_minimo: 0,
      tipo_taxa: 'com_taxas',
      taxa_minima: 0,
      fracao_base: null
    };

    setFormData(prev => ({
      ...prev,
      detalhes: [...(prev.detalhes || []), newDetail]
    }));
  };

  const handleDetailChange = (index: number, field: keyof FreightRateDetail, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      detalhes: prev.detalhes?.map((detail, i) =>
        i === index ? { ...detail, [field]: value } : detail
      )
    }));
  };

  const handleDeleteDetail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      detalhes: prev.detalhes?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-7xl w-full my-8">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('carriers.freightRates.values.title')}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rate.codigo} - {rate.descricao}</p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Valores Section */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('carriers.freightRates.values.sectionValues')}</h3>

              <div className="grid grid-cols-4 gap-4">
                {/* Pedágio */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.pedagioMinimo')}
                  </label>
                  <input
                    type="number"
                    name="pedagio_minimo"
                    value={formData.pedagio_minimo}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.pedagioPorKg')}
                  </label>
                  <input
                    type="number"
                    name="pedagio_por_kg"
                    value={formData.pedagio_por_kg}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.pedagioCadaKg')}
                  </label>
                  <input
                    type="number"
                    name="pedagio_a_cada_kg"
                    value={formData.pedagio_a_cada_kg}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.pedagioTipoKg')}
                  </label>
                  <select
                    name="pedagio_tipo_kg"
                    value={formData.pedagio_tipo_kg}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="peso_calculo">{t('carriers.freightRates.values.pesoCalculo')}</option>
                    <option value="peso_real">{t('carriers.freightRates.values.pesoReal')}</option>
                  </select>
                </div>

                {/* ICMS */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.icmsEmbutido')}
                  </label>
                  <select
                    name="icms_embutido_tabela"
                    value={formData.icms_embutido_tabela}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="nao_embutido">{t('carriers.freightRates.values.naoEmbutido')}</option>
                    <option value="embutido">{t('carriers.freightRates.values.embutido')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.aliquotaIcms')}
                  </label>
                  <input
                    type="number"
                    name="aliquota_icms"
                    value={formData.aliquota_icms}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Fator m³ */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.fatorM3')}
                  </label>
                  <input
                    type="number"
                    name="fator_m3"
                    value={formData.fator_m3}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.fatorM3ApartirKg')}
                  </label>
                  <input
                    type="number"
                    name="fator_m3_apartir_kg"
                    value={formData.fator_m3_apartir_kg}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.fatorM3ApartirM3')}
                  </label>
                  <input
                    type="number"
                    name="fator_m3_apartir_m3"
                    value={formData.fator_m3_apartir_m3}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.fatorM3ApartirValor')}
                  </label>
                  <input
                    type="number"
                    name="fator_m3_apartir_valor"
                    value={formData.fator_m3_apartir_valor}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* GRIS */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.percentualGris')}
                  </label>
                  <input
                    type="text"
                    name="percentual_gris"
                    value={grisInputValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Substituir vírgula por ponto para validação
                      const normalizedValue = value.replace(',', '.');

                      // Validar formato: permite números com até 5 casas decimais
                      // Aceita: "", "0", "0.", "0.1", "0.15", "0.150", "0.15000", etc.
                      if (/^\d*[,.]?\d{0,5}$/.test(value) || value === '') {
                        setGrisInputValue(value);

                        // Atualizar o formData com o valor numérico
                        const numValue = normalizedValue === '' || normalizedValue === '.' || normalizedValue === ','
                          ? 0
                          : parseFloat(normalizedValue);

                        if (!isNaN(numValue)) {
                          setFormData(prev => ({
                            ...prev,
                            percentual_gris: numValue
                          }));
                        }
                      }
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0,15000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.grisMinimo')}
                  </label>
                  <input
                    type="number"
                    name="gris_minimo"
                    value={formData.gris_minimo}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.seccat')}
                  </label>
                  <input
                    type="number"
                    name="seccat"
                    value={formData.seccat}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.despacho')}
                  </label>
                  <input
                    type="number"
                    name="despacho"
                    value={formData.despacho}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.itr')}
                  </label>
                  <input
                    type="number"
                    name="itr"
                    value={formData.itr}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.taxaAdicional')}
                  </label>
                  <input
                    type="number"
                    name="taxa_adicional"
                    value={formData.taxa_adicional}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.coletaEntrega')}
                  </label>
                  <input
                    type="number"
                    name="coleta_entrega"
                    value={formData.coleta_entrega}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.tdeTrt')}
                  </label>
                  <input
                    type="number"
                    name="tde_trt"
                    value={formData.tde_trt}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.tas')}
                  </label>
                  <input
                    type="number"
                    name="tas"
                    value={formData.tas}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.taxaSuframa')}
                  </label>
                  <input
                    type="number"
                    name="taxa_suframa"
                    value={formData.taxa_suframa}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.valorOutrosPercent')}
                  </label>
                  <input
                    type="number"
                    name="valor_outros_percent"
                    value={formData.valor_outros_percent}
                    onChange={handleInputChange}
                    step="0.0001"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.valorOutrosMinimo')}
                  </label>
                  <input
                    type="number"
                    name="valor_outros_minimo"
                    value={formData.valor_outros_minimo}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.taxaOutrosValor')}
                  </label>
                  <input
                    type="number"
                    name="taxa_outros_valor"
                    value={formData.taxa_outros_valor}
                    onChange={handleInputChange}
                    step="0.0001"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.taxaOutrosTipoValor')}
                  </label>
                  <select
                    name="taxa_outros_tipo_valor"
                    value={formData.taxa_outros_tipo_valor}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="valor">{t('carriers.freightRates.values.valor')}</option>
                    <option value="percentual">{t('carriers.freightRates.values.percentual')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.taxaApartirDe')}
                  </label>
                  <input
                    type="number"
                    name="taxa_apartir_de"
                    value={formData.taxa_apartir_de}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.taxaApartirDeTipo')}
                  </label>
                  <select
                    name="taxa_apartir_de_tipo"
                    value={formData.taxa_apartir_de_tipo}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="sem_apartir">{t('carriers.freightRates.values.semApartir')}</option>
                    <option value="com_apartir">{t('carriers.freightRates.values.comApartir')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.taxaOutrosACada')}
                  </label>
                  <input
                    type="number"
                    name="taxa_outros_a_cada"
                    value={formData.taxa_outros_a_cada}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.taxaOutrosMinima')}
                  </label>
                  <input
                    type="number"
                    name="taxa_outros_minima"
                    value={formData.taxa_outros_minima}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Frete Mínimo */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.fretePesoMinimo')}
                  </label>
                  <input
                    type="number"
                    name="frete_peso_minimo"
                    value={formData.frete_peso_minimo}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.freteValorMinimo')}
                  </label>
                  <input
                    type="number"
                    name="frete_valor_minimo"
                    value={formData.frete_valor_minimo}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.freteToneladaMinima')}
                  </label>
                  <input
                    type="number"
                    name="frete_tonelada_minima"
                    value={formData.frete_tonelada_minima}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.fretePercentualMinimo')}
                  </label>
                  <input
                    type="number"
                    name="frete_percentual_minimo"
                    value={formData.frete_percentual_minimo}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.freteM3Minimo')}
                  </label>
                  <input
                    type="number"
                    name="frete_m3_minimo"
                    value={formData.frete_m3_minimo}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('carriers.freightRates.values.valorTotalMinimo')}
                  </label>
                  <input
                    type="number"
                    name="valor_total_minimo"
                    value={formData.valor_total_minimo}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Detalhes Section */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('carriers.freightRates.values.sectionDetails')}</h3>
              <div className="flex items-center">
              <button 
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-white border border-gray-300 px-3 py-1 rounded text-sm shadow-sm hover:bg-gray-50 transition-colors mr-2"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="font-medium">Como é calculado?</span>
              </button>

                <button
                  type="button"
                  onClick={handleAddDetail}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  <Plus size={14} />
                  <span>{t('carriers.freightRates.values.addDetailRow')}</span>
                </button>
              </div>
              </div>

              {/* Info sobre tipo de cálculo Excedente e Tipo Taxa */}
              

              

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.values.detailsTable.ordem')}</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.values.detailsTable.pesoAte')}</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.values.detailsTable.m3Ate')}</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.values.detailsTable.volumeAte')}</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.values.detailsTable.valorAte')}</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.values.detailsTable.valorFaixaCol')}</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.values.detailsTable.fracaoBaseCol')}</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.values.detailsTable.tipoCalculo')}</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.values.detailsTable.tipoFrete')}</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.values.detailsTable.freteValor')}</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.values.detailsTable.freteMinimo')}</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.values.detailsTable.tipoTaxa')}</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.values.detailsTable.taxaMinima')}</th>
                      <th className="px-2 py-2 text-center font-medium text-gray-700 dark:text-gray-300">{t('carriers.freightRates.values.detailsTable.acoes')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                    {formData.detalhes && formData.detalhes.length > 0 ? (
                      formData.detalhes.map((detail, index) => (
                        <tr key={index}>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={detail.ordem}
                              onChange={(e) => handleDetailChange(index, 'ordem', parseInt(e.target.value) || 0)}
                              className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={detail.peso_ate}
                              onChange={(e) => handleDetailChange(index, 'peso_ate', parseFloat(e.target.value) || 0)}
                              step="0.001"
                              className="w-20 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={detail.m3_ate}
                              onChange={(e) => handleDetailChange(index, 'm3_ate', parseFloat(e.target.value) || 0)}
                              step="0.001"
                              className="w-20 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={detail.volume_ate}
                              onChange={(e) => handleDetailChange(index, 'volume_ate', parseFloat(e.target.value) || 0)}
                              step="0.001"
                              className="w-20 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={detail.valor_ate}
                              onChange={(e) => handleDetailChange(index, 'valor_ate', parseFloat(e.target.value) || 0)}
                              step="any"
                              className="w-24 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={detail.valor_faixa}
                              onChange={(e) => handleDetailChange(index, 'valor_faixa', parseFloat(e.target.value) || 0)}
                              step="any"
                              className="w-24 px-1 py-0.5 border border-gray-300 rounded text-xs"
                              title={detail.tipo_calculo === 'excedente' ? t('carriers.freightRates.values.infoExcedente.li3').split(':')[0] : t('carriers.freightRates.values.valorFaixa')}
                              placeholder={detail.tipo_calculo === 'excedente' ? 'R$/KG' : ''}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={detail.fracao_base || ''}
                              onChange={(e) => handleDetailChange(index, 'fracao_base', parseFloat(e.target.value) || 0)}
                              step="0.001"
                              disabled={detail.tipo_calculo !== 'multiplicador'}
                              className={`w-20 px-1 py-0.5 border border-gray-300 rounded text-xs ${detail.tipo_calculo !== 'multiplicador' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                              placeholder={detail.tipo_calculo === 'multiplicador' ? 'Ex: 1000' : ''}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={detail.tipo_calculo}
                              onChange={(e) => handleDetailChange(index, 'tipo_calculo', e.target.value)}
                              className="w-32 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            >
                              <option value="valor_faixa">{t('carriers.freightRates.values.valorFaixa')}</option>
                              <option value="percentual">{t('carriers.freightRates.values.percentual')}</option>
                              <option value="excedente">{t('carriers.freightRates.values.excedente')}</option>
                              <option value="multiplicador">{t('carriers.freightRates.values.multiplicador')}</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={detail.tipo_frete}
                              onChange={(e) => handleDetailChange(index, 'tipo_frete', e.target.value)}
                              className="w-28 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            >
                              <option value="normal">{t('carriers.freightRates.values.normal')}</option>
                              <option value="expresso">{t('carriers.freightRates.values.expresso')}</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={detail.frete_valor}
                              onChange={(e) => handleDetailChange(index, 'frete_valor', parseFloat(e.target.value) || 0)}
                              step="0.0001"
                              className="w-24 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={detail.frete_minimo}
                              onChange={(e) => handleDetailChange(index, 'frete_minimo', parseFloat(e.target.value) || 0)}
                              step="any"
                              className="w-24 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={detail.tipo_taxa}
                              onChange={(e) => handleDetailChange(index, 'tipo_taxa', e.target.value)}
                              className="w-28 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            >
                              <option value="com_taxas">{t('carriers.freightRates.values.comTaxas')}</option>
                              <option value="sem_taxas">{t('carriers.freightRates.values.semTaxas')}</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={detail.taxa_minima}
                              onChange={(e) => handleDetailChange(index, 'taxa_minima', parseFloat(e.target.value) || 0)}
                              step="any"
                              className="w-24 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteDetail(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={13} className="px-2 py-4 text-center text-gray-500 dark:text-gray-400">
                          {t('carriers.freightRates.values.detailsNoData')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            >
              {t('carriers.freightRates.values.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('carriers.freightRates.values.saveValues')}
            </button>
          </div>
        </form>
      </div>

      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Como é calculado?
              </h3>
              <button onClick={() => setShowHelpModal(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 max-h-[60vh] overflow-y-auto pr-2">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Tipos de Cálculo</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Valor Faixa (Fixo):</strong> Cobra exatamente o valor estipulado na coluna "Valor Faixa" se o peso da nota estiver dentro dessa faixa.</li>
                  <li><strong>Percentual:</strong> O "Valor Faixa" funciona como percentual. O frete será X% do valor da mercadoria transportada.</li>
                  <li><strong>Excedente:</strong> Você informa o valor base e quanto cobrar por KG adicional. Exemplo: Para até 50kg R$ 50,00 e o KG excedente R$ 1,50. Configure uma faixa até 50kg (Valor Fixo) e a linha seguinte (Ex: 9999kg) configure Tipo Excedente, informando 1,50 no campo "Valor Faixa".</li>
                  <li><strong>Multiplicador:</strong> O "Valor Faixa" é multiplicado pela quantidade informada. Se o multiplicador for o Peso, o frete será igual ao Peso da NFe vezes o "Valor Faixa" (Você usa a coluna Fração Base para definir se é cobrado a cada 100kg, por exemplo).</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Dica de Configuração (Faixas)</h4>
                <p>O campo <strong>Peso até</strong> define o limite superior da faixa de peso. Para a última faixa de peso de uma tabela (ex: frete de todos acima de 100kg), insira um número grande como <code>99999</code>.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
