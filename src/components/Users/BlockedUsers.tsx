import React, { useState, useEffect } from 'react';
import { Shield, Unlock, AlertTriangle, Clock, User, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

interface BlockedUser {
  id: string;
  codigo: string;
  email: string;
  nome: string;
  perfil: string;
  bloqueado: boolean;
  tentativas_login: number;
  ultimo_login: string;
  estabelecimento_id: string;
  estabelecimento_nome?: string;
}

interface BlockedUsersProps {
  currentUserEmail: string;
}

export const BlockedUsers: React.FC<BlockedUsersProps> = ({ currentUserEmail: _currentUserEmail }) => {
  const { t } = useTranslation();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);

      // Obter contexto
      const orgId = localStorage.getItem('tms-selected-org-id');
      const envId = localStorage.getItem('tms-selected-env-id');

      if (!orgId || !envId) {
        throw new Error('Contexto não disponível');
      }

      const { data: users, error } = await supabase
        .from('users')
        .select(`
          id,
          codigo,
          email,
          nome,
          perfil,
          bloqueado,
          tentativas_login,
          ultimo_login,
          estabelecimento_id
        `)
        .eq('organization_id', orgId)
        .eq('environment_id', envId)
        .eq('bloqueado', true)
        .order('ultimo_login', { ascending: false, nullsFirst: false });

      if (error) throw error;

      if (users) {
        // Buscar nomes dos estabelecimentos
        const usersWithEstablishments = await Promise.all(
          users.map(async (user) => {
            if (user.estabelecimento_id) {
              const { data: establishment } = await supabase
                .from('establishments')
                .select('nome, codigo')
                .eq('id', user.estabelecimento_id)
                .maybeSingle();

              return {
                ...user,
                estabelecimento_nome: establishment
                  ? `${establishment.codigo} - ${establishment.nome}`
                  : 'Não encontrado'
              };
            }
            return {
              ...user,
              estabelecimento_nome: 'Não vinculado'
            };
          })
        );

        setBlockedUsers(usersWithEstablishments as BlockedUser[]);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao carregar usuários bloqueados' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const handleUnlock = async (userId: string, userName: string) => {
    try {
      setUnlocking(userId);
      setMessage(null);

      // Desbloquear usuário
      const { error } = await supabase
        .from('users')
        .update({
          bloqueado: false,
          tentativas_login: 0
        })
        .eq('id', userId);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `Usuário ${userName} desbloqueado com sucesso! As tentativas foram zeradas.`
      });

      // Recarregar lista após 2 segundos
      setTimeout(() => {
        loadBlockedUsers();
      }, 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || t('users.blocked.unlockError') });
    } finally {
      setUnlocking(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">{t('users.blocked.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('users.filters.blocked')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('users.blocked.reasonMultiple')}
            </p>
          </div>
        </div>
        <button
          onClick={loadBlockedUsers}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t('common.refresh')}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Blocked Users List */}
      {blockedUsers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('users.blocked.emptyTitle')}</p>
          <p className="text-sm text-gray-400 mt-1">
            {t('users.blocked.emptyDesc')}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  {t('users.table.code')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">{t('users.table.name')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  {t('users.table.profile')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  {t('users.table.establishment')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  {t('users.table.attempts')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  {t('users.table.lastLogin')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">{t('users.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {blockedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-semibold text-gray-900 dark:text-white">
                      {user.codigo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-full">
                        <User className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.nome}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {user.perfil}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.estabelecimento_nome}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="font-semibold text-red-600">
                        {user.tentativas_login} {t('users.view.loginAttempts', { count: user.tentativas_login })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      {user.ultimo_login ? formatDateTime(user.ultimo_login) : t('users.view.never')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleUnlock(user.id, user.nome)}
                      disabled={unlocking === user.id}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      <Unlock className="w-4 h-4" />
                      {unlocking === user.id ? t('users.blocked.unlocking') : t('users.blocked.unlockBtn')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">{t('users.blocked.infoTitle')}</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• {t('users.blocked.infoItem1')}</li>
              <li>• {t('users.blocked.infoItem2')}</li>
              <li>• {t('users.blocked.infoItem3')}</li>
              <li>• {t('users.blocked.infoItem4')}</li>
              <li>• {t('users.blocked.infoItem5')}</li>
              <li>• {t('users.blocked.infoItem6')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

