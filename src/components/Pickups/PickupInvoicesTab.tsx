import React, { useEffect, useState } from 'react';
import { FileText, Package, Weight, Ruler, DollarSign, Calendar, Hash, Key } from 'lucide-react';
import { pickupsService } from '../../services/pickupsService';

interface PickupInvoicesTabProps {
  pickupId: string;
}

export const PickupInvoicesTab: React.FC<PickupInvoicesTabProps> = ({ pickupId }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, [pickupId]);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await pickupsService.getPickupInvoices(pickupId);
      setInvoices(data);
    } catch (error) {
      console.error('Erro ao carregar notas fiscais da coleta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando notas fiscais...</span>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Nenhuma nota fiscal vinculada a esta coleta</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>{invoices.length}</strong> nota{invoices.length > 1 ? 's' : ''} fiscal{invoices.length > 1 ? 'is' : ''} vinculada{invoices.length > 1 ? 's' : ''} a esta coleta
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Número NF
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Série
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Chave NF-e
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Data Emissão
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Nº Pedido
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Volumes
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                m³
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Peso
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Valor Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Mercadoria
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Tabela/Tarifa
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {invoices.map((item) => {
              const invoice = item.invoices;
              if (!invoice) return null;

              return (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-gray-400" />
                      {invoice.numero_nota}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {invoice.serie || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <Key className="w-3 h-3 mr-1 text-gray-400" />
                      <span className="truncate max-w-xs" title={invoice.chave_nfe}>
                        {invoice.chave_nfe ? `${invoice.chave_nfe.substring(0, 20)}...` : '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {invoice.data_emissao ? formatDate(invoice.data_emissao) : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      <Hash className="w-4 h-4 mr-2 text-gray-400" />
                      {invoice.numero_pedido || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2 text-gray-400" />
                      {invoice.quantidade_volumes || 0}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      <Ruler className="w-4 h-4 mr-2 text-gray-400" />
                      {invoice.metros_cubicos ? invoice.metros_cubicos.toFixed(3) : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      <Weight className="w-4 h-4 mr-2 text-gray-400" />
                      {invoice.peso ? `${invoice.peso} kg` : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                      {invoice.valor_total ? formatCurrency(invoice.valor_total) : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <span className="truncate max-w-xs block" title={invoice.mercadoria}>
                      {invoice.mercadoria || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {item.freight_table_name && item.freight_rate_value ? (
                      <div className="space-y-1">
                        <div className="text-xs">{item.freight_table_name}</div>
                        <div className="font-medium">{formatCurrency(item.freight_rate_value)}</div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Totais da Coleta</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total de Volumes</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {invoices.reduce((sum, item) => sum + (item.invoices?.quantidade_volumes || 0), 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Peso Total</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {invoices.reduce((sum, item) => sum + (item.invoices?.peso || 0), 0).toFixed(2)} kg
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">m³ Total</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {invoices.reduce((sum, item) => sum + (item.invoices?.metros_cubicos || 0), 0).toFixed(3)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Valor Total</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(invoices.reduce((sum, item) => sum + (item.invoices?.valor_total || 0), 0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
