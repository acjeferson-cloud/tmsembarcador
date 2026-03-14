import React, { useState } from 'react';
import { ArrowLeft, Map, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FreightRate } from '../../data/freightRatesData';
import { FreightRateCitiesModal } from './FreightRateCitiesModal';
import { AdditionalFeesModal } from './AdditionalFeesModal';

interface FreightRateFormProps {
  onBack: () => void;
  onSave: (rate: Partial<FreightRate>) => void;
  rate?: FreightRate;
  tableId: number;
}

interface RangeValue {
  id: number;
  order: number;
  pesoAte: number;
  m3Ate: number;
  volumeAte: number;
  valorAte: number;
  valorDaFaixa: number;
  tipoCalculo: string;
  tipoFrete: string;
  freteValor: number;
  freteMinimo: number;
  tipoTaxa: string;
  taxaMinima: number;
}

export const FreightRateForm: React.FC<FreightRateFormProps> = ({ 
  onBack, 
  onSave, 
  rate,
  tableId
}) => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    descricao: rate?.descricao || '',
    tipoAplicacao: rate?.tipoAplicacao || 'cidade',
    prazoEntrega: rate?.prazoEntrega || 1,
    valor: rate?.valor || 0,
    observacoes: rate?.observacoes || '',
    
    // Valores adicionais da tarifa
    pedagioMinimo: 0,
    pedagioPorKg: 0,
    pedagioACadaKg: 0,
    pedagioTipoKg: 'Peso cálculo',
    icmsEmbutido: 'Não embutido no valor',
    aliquotaIcms: 0,
    gris: 0,
    grisMinimo: 0,
    seccat: 0,
    despacho: 0,
    itr: 0,
    taxaAdicional: 0,
    coletaEntrega: 0,
    tde: 0,
    taxaSuframa: 0,
    valorOutros: 0,
    valorOutrosMinimo: 0,
    taxaOutrosValor: 0,
    taxaOutrosTipo: 'Valor',
    taxaAPartirDe: 0,
    taxaAPartirTipo: 'Sem a partir',
    taxaOutrosACada: '',
    taxaOutrosMinima: 0,
    fretePesoMinimo: 0,
    freteValorMinimo: 0,
    freteToneladaMinima: 0,
    fretePercentualMinimo: 0,
    freteTotalMinimo: 0,
    fatorParaMt: 0,
    fatorParaMt3: 0,
    fatorParaValor: 0,
    volumes: 0,
    cubicMeters: 0,
    merchandiseValue: 0
  });

  // Estado para as faixas de valores
  const [rangeValues] = useState<RangeValue[]>([
    {
      id: 1,
      order: 1,
      pesoAte: 0.250,
      m3Ate: 0,
      volumeAte: 0,
      valorAte: 0,
      valorDaFaixa: 18.20,
      tipoCalculo: 'Valor faixa',
      tipoFrete: 'Normal',
      freteValor: 0.40,
      freteMinimo: 0,
      tipoTaxa: 'Com taxas',
      taxaMinima: 0
    },
    {
      id: 2,
      order: 2,
      pesoAte: 0.500,
      m3Ate: 0,
      volumeAte: 0,
      valorAte: 0,
      valorDaFaixa: 18.73,
      tipoCalculo: 'Valor faixa',
      tipoFrete: 'Normal',
      freteValor: 0.40,
      freteMinimo: 0,
      tipoTaxa: 'Com taxas',
      taxaMinima: 0
    },
    {
      id: 3,
      order: 3,
      pesoAte: 0.750,
      m3Ate: 0,
      volumeAte: 0,
      valorAte: 0,
      valorDaFaixa: 19.66,
      tipoCalculo: 'Valor faixa',
      tipoFrete: 'Normal',
      freteValor: 0.40,
      freteMinimo: 0,
      tipoTaxa: 'Com taxas',
      taxaMinima: 0
    },
    {
      id: 4,
      order: 4,
      pesoAte: 1.000,
      m3Ate: 0,
      volumeAte: 0,
      valorAte: 0,
      valorDaFaixa: 21.90,
      tipoCalculo: 'Valor faixa',
      tipoFrete: 'Normal',
      freteValor: 0.40,
      freteMinimo: 0,
      tipoTaxa: 'Com taxas',
      taxaMinima: 0
    }
  ]);

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [activeTab, setActiveTab] = useState<'valores' | 'detalhes'>('valores');
  const [showCitiesModal, setShowCitiesModal] = useState(false);
  const [showFeesModal, setShowFeesModal] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'prazoEntrega' || name === 'valor' ? parseFloat(value) || 0 : value
    }));

    // Clear specific field errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.descricao) {
      newErrors.descricao = t('carriers.freightRates.form.descRequired');
    }
    
    if (formData.prazoEntrega < 1) {
      newErrors.prazoEntrega = t('carriers.freightRates.form.prazoMin');
    }
    
    if (formData.valor < 0) {
      newErrors.valor = t('carriers.freightRates.form.valueNotNegative');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Incluir as faixas de valores no objeto de dados da tarifa
    const rateData = {
      ...formData,
      rangeValues: rangeValues
    };
    
    onSave(rateData);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>{t('carriers.freightRates.form.back')}</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {rate ? t('carriers.freightRates.form.editTitle') : t('carriers.freightRates.form.newTitle')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{t('carriers.freightRates.form.subtitle')}</p>
          </div>
          {rate && (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCitiesModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Map size={20} />
                <span>{t('carriers.freightRates.form.cities')}</span>
              </button>
              <button
                onClick={() => setShowFeesModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Receipt size={20} />
                <span>{t('carriers.freightRates.form.additionalFees')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('valores')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'valores'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{t('carriers.freightRates.form.tabValues')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('detalhes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'detalhes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{t('carriers.freightRates.form.tabDetails')}</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'valores' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('carriers.freightRates.form.tariffValues')}</h2>
          </div>
        )}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('carriers.freightRates.form.tariffValues')}</h2>
            
            {/* Informações não editáveis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('carriers.freightRates.form.establishment')}
                </label>
                <input
                  type="text"
                  value="1 - Garthen"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('carriers.freightRates.form.carrier')}
                </label>
                <input
                  type="text"
                  value="1"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('carriers.freightRates.form.validityStart')}
                </label>
                <input
                  type="text"
                  value="01/01/2021"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('carriers.freightRates.form.tariffCode')}
                </label>
                <input
                  type="text"
                  value="0001"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('carriers.freightRates.form.description')}
                </label>
                <input
                  type="text"
                  value="SC CAP"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('carriers.freightRates.form.tariffType')}
                </label>
                <input
                  type="text"
                  value="Cidade"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('carriers.freightRates.form.type')}
                </label>
                <input
                  type="text"
                  value="Vendas"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                />
              </div>
            </div>
            
            {/* Campos de valores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pedágio mínimo
                </label>
                <input
                  type="number"
                  name="pedagioMinimo"
                  value={formData.pedagioMinimo}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pedágio por KG
                </label>
                <input
                  type="number"
                  name="pedagioPorKg"
                  value={formData.pedagioPorKg}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pedágio a cada KG
                </label>
                <input
                  type="number"
                  name="pedagioACadaKg"
                  value={formData.pedagioACadaKg}
                  onChange={handleInputChange}
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pedágio tipo KG
                </label>
                <select
                  name="pedagioTipoKg"
                  value={formData.pedagioTipoKg}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Peso cálculo">Peso cálculo</option>
                  <option value="Peso real">Peso real</option>
                  <option value="Peso cubado">Peso cubado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ICMS embutido na tabela
                </label>
                <select
                  name="icmsEmbutido"
                  value={formData.icmsEmbutido}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Não embutido no valor">Não embutido no valor</option>
                  <option value="Embutido no valor">Embutido no valor</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alíquota ICMS
                </label>
                <input
                  type="number"
                  name="aliquotaIcms"
                  value={formData.aliquotaIcms}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  % GRIS
                </label>
                <input
                  type="number"
                  name="gris"
                  value={formData.gris}
                  onChange={handleInputChange}
                  step="0.001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GRIS mínimo
                </label>
                <input
                  type="number"
                  name="grisMinimo"
                  value={formData.grisMinimo}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fator para m²
                </label>
                <input
                  type="number"
                  name="fatorParaMt"
                  value={formData.fatorParaMt}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fator m² a partir Kg
                </label>
                <input
                  type="number"
                  name="fatorParaMt3"
                  value={formData.fatorParaMt3}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fator m² a partir M³
                </label>
                <input
                  type="number"
                  name="fatorParaValor"
                  value={formData.fatorParaValor}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SECCAT
                </label>
                <input
                  type="number"
                  name="seccat"
                  value={formData.seccat}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Despacho
                </label>
                <input
                  type="number"
                  name="despacho"
                  value={formData.despacho}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ITR
                </label>
                <input
                  type="number"
                  name="itr"
                  value={formData.itr}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Taxa adicional
                </label>
                <input
                  type="number"
                  name="taxaAdicional"
                  value={formData.taxaAdicional}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coleta/Entrega
                </label>
                <input
                  type="number"
                  name="coletaEntrega"
                  value={formData.coletaEntrega}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  TDE
                </label>
                <input
                  type="number"
                  name="tde"
                  value={formData.tde}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
      </form>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('carriers.freightRates.form.quantVolumes')}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={formData.volumes || ''}
              onChange={(e) => setFormData({ ...formData, volumes: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('carriers.freightRates.form.ex10')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('carriers.freightRates.form.cubicMeters')}
            </label>
            <input
              type="number"
              min="0"
              step="0.001"
              value={formData.cubicMeters || ''}
              onChange={(e) => setFormData({ ...formData, cubicMeters: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('carriers.freightRates.form.ex2500')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('carriers.freightRates.form.merchandiseValue')}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.merchandiseValue || ''}
              onChange={(e) => setFormData({ ...formData, merchandiseValue: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('carriers.freightRates.form.ex15000')}
            />
          </div>

      {showCitiesModal && rate && (
        <FreightRateCitiesModal
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rate={rate as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tableId={tableId as any}
          onClose={() => setShowCitiesModal(false)}
          onUpdate={() => {}}
        />
      )}

      {showFeesModal && rate && (
        <AdditionalFeesModal
          freightRateTableId={tableId.toString()}
          freightRateTableName={rate.codigo}
          onClose={() => setShowFeesModal(false)}
        />
      )}
    </div>
  );
};