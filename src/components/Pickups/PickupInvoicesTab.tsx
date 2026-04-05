import React, { useEffect, useState } from 'react';
import { Package, Weight, Box } from 'lucide-react';
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
// null
    } finally {
      setIsLoading(false);
    }
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
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Nenhuma nota fiscal vinculada a esta coleta</p>
      </div>
    );
  }

  const parseInvoice = (item: any) => {
    const inv = item.invoices_nfe || item.invoices;
    if (!inv) return null;

    const cubic_meters = inv.cubagem_total || (inv.products || []).reduce((acc: number, p: any) => acc + (Number(p.cubagem) || 0), 0);

    return {
      id: inv.id || item.id,
      numero: inv.numero || inv.numero_nota || '-',
      cliente: inv.customer?.[0]?.razao_social || 'NÃO IDENTIFICADO',
      pesoTotal: inv.peso_total || inv.peso || 0,
      volumes: inv.quantidade_volumes || 1,
      metros_cubicos: cubic_meters || inv.metros_cubicos || 0,
    };
  };

  const formattedInvoices = invoices.map(parseInvoice).filter(Boolean);
  
  const totals = {
    volumes: formattedInvoices.reduce((sum, inv) => sum + (inv?.volumes || 0), 0),
    peso: formattedInvoices.reduce((sum, inv) => sum + (inv?.pesoTotal || 0), 0),
    cubagem: formattedInvoices.reduce((sum, inv) => sum + (inv?.metros_cubicos || 0), 0),
  };

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
         <div className="flex-1">
           <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1 flex items-center gap-1"><Package size={14} /> Volumes</p>
           <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{totals.volumes}</p>
         </div>
         <div className="flex-1">
           <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1 flex items-center gap-1"><Weight size={14} /> Peso Total</p>
           <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{totals.peso.toFixed(2)} kg</p>
         </div>
         <div className="flex-1">
           <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1 flex items-center gap-1"><Package size={14} /> NFs</p>
           <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{formattedInvoices.length}</p>
         </div>
         <div className="flex-1 text-right">
           <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1 flex items-center justify-end gap-1"><Box size={14} /> Metragem Cúbica</p>
           <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{totals.cubagem.toFixed(4)} m³</p>
         </div>
      </div>

      {/* Lista de Notas Fiscais */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 font-medium">Nota Fiscal</th>
              <th className="px-4 py-3 font-medium">Destinatário</th>
              <th className="px-4 py-3 font-medium text-right">Peso</th>
              <th className="px-4 py-3 font-medium text-right">Volumes</th>
              <th className="px-4 py-3 font-medium text-right">Metragem Cub.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
            {formattedInvoices.map((invoice: any) => (
              <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{invoice.numero}</td>
                <td className="px-4 py-3 truncate max-w-[200px]" title={invoice.cliente}>
                  {invoice.cliente}
                </td>
                <td className="px-4 py-3 text-right">{invoice.pesoTotal.toFixed(2)} kg</td>
                <td className="px-4 py-3 text-right">{invoice.volumes}</td>
                <td className="px-4 py-3 text-right">{invoice.metros_cubicos.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
