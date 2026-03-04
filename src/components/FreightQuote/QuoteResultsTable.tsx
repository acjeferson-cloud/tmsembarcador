import React from 'react';
import { Award, TrendingDown, Truck, Calendar } from 'lucide-react';
import { QuoteResult } from '../../services/freightQuoteService';
import { formatCurrency } from '../../utils/formatters';
import { useInnovation, INNOVATION_IDS } from '../../hooks/useInnovation';

interface QuoteResultsTableProps {
  results: QuoteResult[];
  cargoValue?: number;
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
};

export const QuoteResultsTable: React.FC<QuoteResultsTableProps> = ({ results, cargoValue }) => {
  const { isActive: isNpsActive } = useInnovation(INNOVATION_IDS.NPS);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Resultados da Cotação ({results.length})
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Ordenado por menor valor
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Transportadora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Modal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Valor Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                % sobre menor valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                % Sobre NF-e
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Prazo de Entrega
              </th>
              {isNpsActive && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  NPS Interno
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Frete Peso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Frete Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                GRIS
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Pedágio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                TAS
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                SECCAT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Despacho
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ITR
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Coleta/Entrega
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Outros Valores
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ICMS
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
            {results.map((result, index) => (
              <tr
                key={result.carrierId}
                className={`hover:bg-gray-50 ${result.isNominated ? 'bg-green-50' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Truck className={`w-5 h-5 mr-3 ${result.isNominated ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{result.carrierName}</span>
                        {result.isNominated && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <Award className="w-3 h-3 mr-1" />
                            Nomeado
                          </span>
                        )}
                      </div>
                      {index === 0 && results.length > 1 && (
                        <p className="text-xs text-green-600 flex items-center mt-1">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          Menor preço
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    result.modal === 'rodoviario' ? 'bg-purple-100 text-purple-800' :
                    result.modal === 'aereo' ? 'bg-sky-100 text-sky-800' :
                    result.modal === 'aquaviario' ? 'bg-cyan-100 text-cyan-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {result.modal === 'rodoviario' && '🚛 Rodoviário'}
                    {result.modal === 'aereo' && '✈️ Aéreo'}
                    {result.modal === 'aquaviario' && '🚢 Aquaviário'}
                    {result.modal === 'ferroviario' && '🚂 Ferroviário'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-lg font-bold ${result.isNominated ? 'text-green-600' : 'text-gray-900'}`}>
                    {formatCurrency(result.totalValue)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    (result.percentageAboveLowest || 0) === 0
                      ? 'bg-green-100 text-green-800'
                      : (result.percentageAboveLowest || 0) <= 10
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.percentageAboveLowest !== undefined
                      ? `${result.percentageAboveLowest.toFixed(2)}%`
                      : '0.00%'
                    }
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cargoValue && cargoValue > 0 ? (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                      ((result.totalValue * 100) / cargoValue) <= 5
                        ? 'bg-green-100 text-green-800'
                        : ((result.totalValue * 100) / cargoValue) <= 10
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {((result.totalValue * 100) / cargoValue).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}%
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {result.deliveryDays !== undefined && result.deliveryDeadline ? (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {result.deliveryDays} {result.deliveryDays === 1 ? 'dia' : 'dias'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(result.deliveryDeadline)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Não informado</span>
                  )}
                </td>
                {isNpsActive && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {result.npsInterno !== undefined && result.npsInterno !== null ? (
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          result.npsInterno >= 9 ? 'bg-green-100 text-green-800' :
                          result.npsInterno >= 7 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          ⭐ {result.npsInterno.toFixed(1)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Sem avaliação</span>
                    )}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatCurrency(result.calculationDetails.fretePeso)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatCurrency(result.calculationDetails.freteValor)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatCurrency(result.calculationDetails.gris)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatCurrency(result.calculationDetails.pedagio)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatCurrency(result.calculationDetails.tas)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatCurrency(result.calculationDetails.seccat)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatCurrency(result.calculationDetails.despacho)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatCurrency(result.calculationDetails.itr)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatCurrency(result.calculationDetails.coletaEntrega)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatCurrency(result.calculationDetails.outrosValores)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div>
                    <div className="font-medium">{formatCurrency(result.calculationDetails.icmsValor)}</div>
                    {result.calculationDetails.icmsAliquota > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {result.calculationDetails.icmsAliquota}%
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
