import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Search, Filter, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { InteractionLog, interactionLogsService } from '../../services/interactionLogsService';

interface InteractionLogsTabProps {
  businessPartnerId: string;
}

export function InteractionLogsTab({ businessPartnerId }: InteractionLogsTabProps) {
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'email'>('all');

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        const data = await interactionLogsService.getByBusinessPartner(businessPartnerId);
        setLogs(data);
      } catch (error) {

      } finally {
        setLoading(false);
      }
    }

    if (businessPartnerId) {
      fetchLogs();
    }
  }, [businessPartnerId]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.contact_name.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || log.channel === channelFilter;

    return matchesSearch && matchesStatus && matchesChannel;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por NF, tipo de evento ou contato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400 w-5 h-5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todos os Status</option>
            <option value="success">Sucesso</option>
            <option value="error">Erro</option>
          </select>
          
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as any)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todos os Canais</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">E-mail</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Carregando registros de interações...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhum registro de interação encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Evento (Ocorrência)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Nota Fiscal
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Canal & Contato
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {log.created_at ? format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{log.event_type}</div>
                      <div className="text-xs text-slate-500">Cód: {log.occurrence_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                      NF: {log.invoice_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        {log.channel === 'whatsapp' ? (
                          <MessageSquare className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Mail className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="text-sm font-medium capitalize">{log.channel}</span>
                      </div>
                      <div className="text-xs text-slate-500">{log.contact_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 w-fit">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Enviado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 w-fit">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Falha
                          </span>
                        )}
                        {log.log_message && (
                          <span className="text-xs text-slate-500 truncate max-w-[200px]" title={log.log_message}>
                            {log.log_message}
                          </span>
                        )}
                      </div>
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
}
