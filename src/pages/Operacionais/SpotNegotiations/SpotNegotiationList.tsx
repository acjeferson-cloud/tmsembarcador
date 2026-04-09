import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { spotNegotiationService, SpotNegotiation } from '../../services/spotNegotiationService';
import { Plus, Search, FileText, CheckCircle, Clock } from 'lucide-react';
import Breadcrumbs from '../Layout/Breadcrumbs';

export const SpotNegotiationList: React.FC<{ onNew: () => void }> = ({ onNew }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<SpotNegotiation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await spotNegotiationService.getActiveNegotiations();
    setData(res);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente_faturamento':
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-max"><Clock size={12}/> Pendente CTe</span>;
      case 'liquidado':
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-max"><CheckCircle size={12}/> Faturado</span>;
      case 'cancelado':
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-max">Cancelado</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Breadcrumbs items={[{ label: 'Cotações Spot', current: true }]} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cotações Manuais (Spot)</h1>
           <p className="text-sm text-gray-600 dark:text-gray-400">Hub de negociações avulsas para auditoria de CTes fora da tabela.</p>
        </div>
        <button 
           onClick={onNew}
           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20}/>
          <span>Nova Negociação Spot</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-gray-500">Carregando negociações...</div>
        ) : data.length === 0 ? (
           <div className="p-12 text-center flex flex-col items-center">
             <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
               <FileText className="text-gray-400" size={32}/>
             </div>
             <p className="text-gray-600 dark:text-gray-300 font-medium">Nenhuma negociação avulsa registrada.</p>
             <p className="text-sm text-gray-500 mt-1">Sua auditoria está baseada inteiramente nas tabelas fixas cadastradas.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Transportador</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Valor Prometido</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Validade</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Evidência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="px-6 py-4">
                       <span className="font-medium text-gray-900 dark:text-white">{item.carrier_name}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                       {Number(item.agreed_value).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                       {item.valid_to ? new Date(item.valid_to).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                       {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4">
                       {item.attachment_url ? (
                         <a href={item.attachment_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                           <FileText size={16}/> Abrir Anexo
                         </a>
                       ) : (
                         <span className="text-xs text-gray-400">Sem evidência</span>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
