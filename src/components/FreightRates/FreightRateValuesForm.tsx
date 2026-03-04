import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
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
      taxa_minima: 0
    };

    setFormData(prev => ({
      ...prev,
      detalhes: [...(prev.detalhes || []), newDetail]
    }));
  };

  const handleDetailChange = (index: number, field: keyof FreightRateDetail, value: any) => {
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Valores da Tarifa</h2>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Valores</h3>

              <div className="grid grid-cols-4 gap-4">
                {/* Pedágio */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pedágio mínimo
                  </label>
                  <input
                    type="number"
                    name="pedagio_minimo"
                    value={formData.pedagio_minimo}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pedágio por KG
                  </label>
                  <input
                    type="number"
                    name="pedagio_por_kg"
                    value={formData.pedagio_por_kg}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pedágio a cada KG
                  </label>
                  <input
                    type="number"
                    name="pedagio_a_cada_kg"
                    value={formData.pedagio_a_cada_kg}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pedágio tipo KG
                  </label>
                  <select
                    name="pedagio_tipo_kg"
                    value={formData.pedagio_tipo_kg}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="peso_calculo">Peso cálculo</option>
                    <option value="peso_real">Peso real</option>
                  </select>
                </div>

                {/* ICMS */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ICMS embutido na tabela
                  </label>
                  <select
                    name="icms_embutido_tabela"
                    value={formData.icms_embutido_tabela}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="nao_embutido">Não embutido no valor</option>
                    <option value="embutido">Embutido no valor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Alíquota ICMS
                  </label>
                  <input
                    type="number"
                    name="aliquota_icms"
                    value={formData.aliquota_icms}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Fator m³ */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fator m³
                  </label>
                  <input
                    type="number"
                    name="fator_m3"
                    value={formData.fator_m3}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fator m³ apartir Kg
                  </label>
                  <input
                    type="number"
                    name="fator_m3_apartir_kg"
                    value={formData.fator_m3_apartir_kg}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fator m³ apartir M³
                  </label>
                  <input
                    type="number"
                    name="fator_m3_apartir_m3"
                    value={formData.fator_m3_apartir_m3}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fator m³ a partir do valor
                  </label>
                  <input
                    type="number"
                    name="fator_m3_apartir_valor"
                    value={formData.fator_m3_apartir_valor}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* GRIS */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    % GRIS (até 5 casas decimais)
                  </label>
                  <input
                    type="text"
                    name="percentual_gris"
                    value={grisInputValue}
                    onChange={(e) => {
                      let value = e.target.value;
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
                    GRIS mínimo
                  </label>
                  <input
                    type="number"
                    name="gris_minimo"
                    value={formData.gris_minimo}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SECCAT
                  </label>
                  <input
                    type="number"
                    name="seccat"
                    value={formData.seccat}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Despacho
                  </label>
                  <input
                    type="number"
                    name="despacho"
                    value={formData.despacho}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ITR
                  </label>
                  <input
                    type="number"
                    name="itr"
                    value={formData.itr}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Taxa adicional
                  </label>
                  <input
                    type="number"
                    name="taxa_adicional"
                    value={formData.taxa_adicional}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Coleta/Entrega
                  </label>
                  <input
                    type="number"
                    name="coleta_entrega"
                    value={formData.coleta_entrega}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    TDE/TRT
                  </label>
                  <input
                    type="number"
                    name="tde_trt"
                    value={formData.tde_trt}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    TAS
                  </label>
                  <input
                    type="number"
                    name="tas"
                    value={formData.tas}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Taxa SUFRAMA
                  </label>
                  <input
                    type="number"
                    name="taxa_suframa"
                    value={formData.taxa_suframa}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor outros %
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
                    Valor outros mínimo
                  </label>
                  <input
                    type="number"
                    name="valor_outros_minimo"
                    value={formData.valor_outros_minimo}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Taxa outros valor
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
                    Taxa outros tipo valor
                  </label>
                  <select
                    name="taxa_outros_tipo_valor"
                    value={formData.taxa_outros_tipo_valor}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="valor">Valor</option>
                    <option value="percentual">Percentual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Taxa a partir de
                  </label>
                  <input
                    type="number"
                    name="taxa_apartir_de"
                    value={formData.taxa_apartir_de}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Taxa a partir de tipo
                  </label>
                  <select
                    name="taxa_apartir_de_tipo"
                    value={formData.taxa_apartir_de_tipo}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="sem_apartir">Sem a partir</option>
                    <option value="com_apartir">Com a partir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Taxa outros a cada
                  </label>
                  <input
                    type="number"
                    name="taxa_outros_a_cada"
                    value={formData.taxa_outros_a_cada}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Taxa outros mínima
                  </label>
                  <input
                    type="number"
                    name="taxa_outros_minima"
                    value={formData.taxa_outros_minima}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Frete Mínimo */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Frete peso mínimo
                  </label>
                  <input
                    type="number"
                    name="frete_peso_minimo"
                    value={formData.frete_peso_minimo}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Frete valor mínimo
                  </label>
                  <input
                    type="number"
                    name="frete_valor_minimo"
                    value={formData.frete_valor_minimo}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Frete tonelada mínima
                  </label>
                  <input
                    type="number"
                    name="frete_tonelada_minima"
                    value={formData.frete_tonelada_minima}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Frete percentual mínimo
                  </label>
                  <input
                    type="number"
                    name="frete_percentual_minimo"
                    value={formData.frete_percentual_minimo}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Frete m³ mínimo
                  </label>
                  <input
                    type="number"
                    name="frete_m3_minimo"
                    value={formData.frete_m3_minimo}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor total mínimo
                  </label>
                  <input
                    type="number"
                    name="valor_total_minimo"
                    value={formData.valor_total_minimo}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Detalhes Section */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detalhes</h3>
                <button
                  type="button"
                  onClick={handleAddDetail}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  <Plus size={14} />
                  <span>Adicionar linha</span>
                </button>
              </div>

              {/* Info sobre tipo de cálculo Excedente e Tipo Taxa */}
              <div className="space-y-3 mb-4">
                {/* Info Tipo de Cálculo: Excedente */}
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-blue-800">Tipo de Cálculo: Excedente</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p className="mb-1"><strong>Como funciona:</strong></p>
                        <p className="mb-1">No tipo "Excedente", o valor final é calculado somando o valor da faixa anterior com o excedente multiplicado pelo valor por KG.</p>
                        <p className="mb-1"><strong>Exemplo:</strong> Peso da NF = 308 KG</p>
                        <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                          <li>Faixa anterior (até 200 KG): R$ 192,38</li>
                          <li>Peso excedente: 308 - 200 = 108 KG</li>
                          <li>Valor por KG excedente: R$ 0,84150</li>
                          <li>Cálculo: R$ 192,38 + (108 × R$ 0,84150) = R$ 283,26</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Tipo Taxa: Sem Taxas */}
                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-amber-800">Tipo Taxa: Sem Taxas</h3>
                      <div className="mt-2 text-sm text-amber-700">
                        <p className="mb-1"><strong>Atenção:</strong></p>
                        <p>Quando uma linha tiver <strong>Tipo taxa = "Sem taxas"</strong>, o sistema irá <strong>IGNORAR</strong> todas as taxas adicionais configuradas nos campos acima (GRIS, Pedágio, SECCAT, Despacho, ITR, TAS, Coleta/Entrega, Taxa SUFRAMA, etc.).</p>
                        <p className="mt-1">O cálculo considerará <strong>APENAS</strong> o valor da faixa (Frete Peso + Frete Valor).</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Ordem</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Peso até</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">M³ até</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Volume até</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Valor até</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Valor da faixa</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Tipo de cálculo</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Tipo frete</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Frete valor</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Frete mínimo</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Tipo taxa</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Taxa mínima</th>
                      <th className="px-2 py-2 text-center font-medium text-gray-700 dark:text-gray-300">Ações</th>
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
                              step="0.01"
                              className="w-24 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={detail.valor_faixa}
                              onChange={(e) => handleDetailChange(index, 'valor_faixa', parseFloat(e.target.value) || 0)}
                              step="0.01"
                              className="w-24 px-1 py-0.5 border border-gray-300 rounded text-xs"
                              title={detail.tipo_calculo === 'excedente' ? 'Valor por KG excedente' : 'Valor da faixa'}
                              placeholder={detail.tipo_calculo === 'excedente' ? 'R$/KG' : ''}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={detail.tipo_calculo}
                              onChange={(e) => handleDetailChange(index, 'tipo_calculo', e.target.value)}
                              className="w-32 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            >
                              <option value="valor_faixa">Valor faixa</option>
                              <option value="percentual">Percentual</option>
                              <option value="excedente">Excedente</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={detail.tipo_frete}
                              onChange={(e) => handleDetailChange(index, 'tipo_frete', e.target.value)}
                              className="w-28 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            >
                              <option value="normal">Normal</option>
                              <option value="expresso">Expresso</option>
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
                              step="0.01"
                              className="w-24 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={detail.tipo_taxa}
                              onChange={(e) => handleDetailChange(index, 'tipo_taxa', e.target.value)}
                              className="w-28 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            >
                              <option value="com_taxas">Com taxas</option>
                              <option value="sem_taxas">Sem taxas</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={detail.taxa_minima}
                              onChange={(e) => handleDetailChange(index, 'taxa_minima', parseFloat(e.target.value) || 0)}
                              step="0.01"
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
                          Nenhum detalhe cadastrado
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
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salvar Valores
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
