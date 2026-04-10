import React from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { CTeWithRelations } from '../../services/ctesCompleteService';

interface CTeValuesComparisonModalProps {
  cte: CTeWithRelations;
  onClose: () => void;
}

interface TaxComparison {
  label: string;
  conhecimento: number;
  calculado: number;
  isEqual: boolean;
}

export const CTeValuesComparisonModal: React.FC<CTeValuesComparisonModalProps> = ({
  cte,
  onClose
}) => {
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const compareValues = (value1: number, value2: number, tolerance: number = 0.01): boolean => {
    return Math.abs(value1 - value2) <= tolerance;
  };

  // Buscar valores calculados
  const calculatedICMSBase = parseFloat(cte.carrier_costs?.find(c => c.cost_type === 'icms_base')?.cost_value.toString() || '0');
  const calculatedICMSValue = parseFloat(cte.carrier_costs?.find(c => c.cost_type === 'icms_value')?.cost_value.toString() || '0');
  const calculatedTotalValue = parseFloat(cte.carrier_costs?.find(c => c.cost_type === 'total_value')?.cost_value.toString() || '0');

  // O Total Calculado deve vir diretamente do custo consolidado `total_value`.
  // Em lógicas de tabela padrão ele já contém as taxas, em Spot Negotiation contém o valor exato fechado.
  const totalCalculado = calculatedTotalValue;

  const taxComparisons: TaxComparison[] = [
    {
      label: 'Frete peso',
      conhecimento: parseFloat(cte.freight_weight_value?.toString() || '0'),
      calculado: parseFloat(cte.carrier_costs?.find(c => c.cost_type === 'freight_weight')?.cost_value.toString() || '0'),
      isEqual: false
    },
    {
      label: 'Frete valor',
      conhecimento: parseFloat(cte.freight_value_value?.toString() || '0'),
      calculado: parseFloat(cte.carrier_costs?.find(c => c.cost_type === 'freight_value')?.cost_value.toString() || '0'),
      isEqual: false
    },
    {
      label: 'SECCAT',
      conhecimento: parseFloat(cte.seccat_value?.toString() || '0'),
      calculado: parseFloat(cte.carrier_costs?.find(c => c.cost_type === 'seccat')?.cost_value.toString() || '0'),
      isEqual: false
    },
    {
      label: 'Outros valores',
      conhecimento: parseFloat(cte.other_value?.toString() || '0'),
      calculado: parseFloat(cte.carrier_costs?.find(c => c.cost_type === 'other_value')?.cost_value.toString() || '0'),
      isEqual: false
    },
    {
      label: 'Despacho',
      conhecimento: parseFloat(cte.dispatch_value?.toString() || '0'),
      calculado: parseFloat(cte.carrier_costs?.find(c => c.cost_type === 'dispatch')?.cost_value.toString() || '0'),
      isEqual: false
    },
    {
      label: 'GRIS',
      conhecimento: parseFloat(cte.ademe_gris_value?.toString() || '0'),
      calculado: parseFloat(cte.carrier_costs?.find(c => c.cost_type === 'gris')?.cost_value.toString() || '0'),
      isEqual: false
    },
    {
      label: 'ITR',
      conhecimento: parseFloat(cte.itr_value?.toString() || '0'),
      calculado: parseFloat(cte.carrier_costs?.find(c => c.cost_type === 'itr')?.cost_value.toString() || '0'),
      isEqual: false
    },
    {
      label: 'TAS',
      conhecimento: parseFloat(cte.tas_value?.toString() || '0'),
      calculado: parseFloat(cte.carrier_costs?.find(c => c.cost_type === 'tas')?.cost_value.toString() || '0'),
      isEqual: false
    },
    {
      label: 'Coleta/Entrega',
      conhecimento: parseFloat(cte.collection_delivery_value?.toString() || '0'),
      calculado: parseFloat(cte.carrier_costs?.find(c => c.cost_type === 'collection_delivery')?.cost_value.toString() || '0'),
      isEqual: false
    },
    {
      label: 'Pedágio',
      conhecimento: parseFloat(cte.toll_value?.toString() || '0'),
      calculado: parseFloat(cte.carrier_costs?.find(c => c.cost_type === 'toll')?.cost_value.toString() || '0'),
      isEqual: false
    },
    {
      label: 'Alíquota ICMS',
      conhecimento: parseFloat(cte.icms_rate?.toString() || '0'),
      calculado: parseFloat(cte.icms_rate?.toString() || '0'),
      isEqual: true // Alíquota sempre será igual
    },
    {
      label: 'Base ICMS',
      conhecimento: parseFloat(cte.icms_base?.toString() || '0'),
      calculado: calculatedICMSBase,
      isEqual: false
    },
    {
      label: 'Valor ICMS',
      conhecimento: parseFloat(cte.icms_value?.toString() || '0'),
      calculado: calculatedICMSValue,
      isEqual: false
    }
  ];

  taxComparisons.forEach(tax => {
    tax.isEqual = compareValues(tax.conhecimento, tax.calculado);
  });

  const totalConhecimento = parseFloat(cte.total_value?.toString() || '0');
  const isTotalEqual = compareValues(totalConhecimento, totalCalculado);

  const equalCount = taxComparisons.filter(t => t.isEqual).length;
  const differentCount = taxComparisons.filter(t => !t.isEqual).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Comparação de Valores</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              CT-e Nº {cte.number} - Série {cte.series || 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle size={20} />
                <span className="font-semibold">{equalCount} iguais</span>
              </div>
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle size={20} />
                <span className="font-semibold">{differentCount} diferentes</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Chave de Acesso</p>
              <p className="text-xs font-mono text-gray-800 dark:text-gray-200">{cte.access_key || 'N/A'}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[50vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {taxComparisons.map((tax, index) => (
                <div
                  key={index}
                  className={`rounded-lg border-2 p-3 transition-all ${
                    tax.isEqual
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{tax.label}</h3>
                    {tax.isEqual ? (
                      <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Conhecimento</p>
                      <p className={`font-semibold ${
                        tax.isEqual ? 'text-green-700' : 'text-gray-900'
                      }`}>
                        {formatCurrency(tax.conhecimento)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Calculado</p>
                      <p className={`font-semibold ${
                        tax.isEqual ? 'text-green-700' : 'text-red-600'
                      }`}>
                        {formatCurrency(tax.calculado)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Diferença</p>
                      <p className={`font-semibold ${
                        tax.isEqual && Number(Math.abs(tax.conhecimento - tax.calculado).toFixed(2)) === 0 ? 'text-green-700' : 
                        tax.isEqual ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(Math.abs(tax.conhecimento - tax.calculado))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-lg border-2 p-6 ${
            isTotalEqual
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Total</h3>
                <div className="flex items-center space-x-8">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Conhecimento</p>
                    <p className={`text-2xl font-bold ${
                      isTotalEqual ? 'text-green-700' : 'text-gray-900'
                    }`}>
                      R$ {formatCurrency(totalConhecimento)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Calculado</p>
                    <p className={`text-2xl font-bold ${
                      isTotalEqual ? 'text-green-700' : 'text-red-600'
                    }`}>
                      R$ {formatCurrency(totalCalculado)}
                    </p>
                  </div>
                  {Number(Math.abs(totalConhecimento - totalCalculado).toFixed(2)) > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Diferença</p>
                      <p className={`text-2xl font-bold ${
                        isTotalEqual ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        R$ {formatCurrency(Math.abs(totalConhecimento - totalCalculado))}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                {isTotalEqual ? (
                  <CheckCircle size={48} className="text-green-600" />
                ) : (
                  <AlertCircle size={48} className="text-red-600" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
