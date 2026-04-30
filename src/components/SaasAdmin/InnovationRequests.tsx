import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Clock, Building, User, Mail, Search } from 'lucide-react';
import { Toast, ToastType } from '../common/Toast';

interface InnovationRequest {
  id: string;
  user_id: number;
  innovation_id: string;
  organization_id: string;
  environment_id: string;
  establishment_code: string;
  status: string;
  created_at: string;
  innovation: {
    name: string;
    description: string;
  };
  organization: {
    nome: string;
  };
  user?: {
    nome: string;
    email: string;
  };
}

export function InnovationRequests() {
  const [requests, setRequests] = useState<InnovationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_innovations')
        .select(`
          *,
          innovation:innovations(name, description),
          organization:saas_tenants(nome)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Load user details separately because the relation might be tricky with numeric user_id
      const requestsData = data || [];
      const enrichedRequests = await Promise.all(
        requestsData.map(async (req: any) => {
          let userInfo = undefined;
          if (req.user_id) {
            const { data: user } = await supabase
              .from('users')
              .select('nome, email')
              .eq('id', req.user_id)
              .maybeSingle();
            if (user) userInfo = user;
          }
          return { ...req, user: userInfo } as InnovationRequest;
        })
      );
      
      setRequests(enrichedRequests);
    } catch (err: any) {
      setToast({ message: 'Erro ao carregar solicitações', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_innovations')
        .update({ status: 'approved', is_active: true })
        .eq('id', id);

      if (error) throw error;

      setToast({ message: 'Solicitação aprovada com sucesso!', type: 'success' });
      loadRequests();
    } catch (err: any) {
      setToast({ message: 'Erro ao aprovar solicitação', type: 'error' });
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja rejeitar esta solicitação?')) return;

    try {
      const { error } = await supabase
        .from('user_innovations')
        .update({ status: 'rejected', is_active: false })
        .eq('id', id);

      if (error) throw error;

      setToast({ message: 'Solicitação rejeitada.', type: 'info' });
      loadRequests();
    } catch (err: any) {
      setToast({ message: 'Erro ao rejeitar solicitação', type: 'error' });
    }
  };

  const filteredRequests = requests.filter(req => 
    req.innovation?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.organization?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.user?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Aprovações de Módulos</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Gerencie as solicitações de ativação de inovações feitas pelos clientes
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar solicitações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="p-0">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-full mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tudo em dia!</h3>
            <p className="text-gray-500 dark:text-gray-400">Nenhuma solicitação pendente no momento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente / Organização</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Módulo Solicitado</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Solicitante</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center">
                        <Building className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {request.organization?.nome || 'Cliente Desconhecido'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-blue-600 dark:text-blue-400">
                        {request.innovation?.name || 'Recurso Removido'}
                      </div>
                    </td>
                    <td className="p-4">
                      {request.user ? (
                        <div>
                          <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                            <User className="w-4 h-4 text-gray-400 mr-1" />
                            {request.user.nome}
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Mail className="w-3 h-3 text-gray-400 mr-1" />
                            {request.user.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">ID: {request.user_id}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 text-gray-400 mr-1" />
                        {new Date(request.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleReject(request.id)}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                        >
                          Rejeitar
                        </button>
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors shadow-sm"
                        >
                          Aprovar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
