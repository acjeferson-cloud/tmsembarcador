import React, { useState, useEffect } from 'react';
import { X, Search, Users, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usersService, User } from '../../services/usersService';

interface CopyPermissionsModalProps {
  sourceUserId?: string; // Optional because source user might not be saved yet
  sourceUserName: string;
  sourcePermissions: string[];
  onClose: () => void;
  onConfirm: (targetUserIds: string[]) => Promise<void>;
}

export const CopyPermissionsModal: React.FC<CopyPermissionsModalProps> = ({
  sourceUserId,
  sourceUserName,
  sourcePermissions,
  onClose,
  onConfirm
}) => {
  const [targetUsers, setTargetUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allUsers = await usersService.getAll();
      
      // Filter target users:
      // 1. Must be 'personalizado'
      // 2. Must not be the source user itself (if saved)
      const validTargetUsers = allUsers.filter(user => 
        user.perfil === 'personalizado' && 
        user.id !== sourceUserId
      );
      
      setTargetUsers(validTargetUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Não foi possível carregar a lista de usuários. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = targetUsers.filter(user => 
    (user.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    const newKeys = new Set(selectedUserIds);
    if (newKeys.has(userId)) {
      newKeys.delete(userId);
    } else {
      newKeys.add(userId);
    }
    setSelectedUserIds(newKeys);
  };

  const selectAll = () => {
    const newKeys = new Set(filteredUsers.map(u => u.id));
    setSelectedUserIds(newKeys);
  };

  const clearAll = () => {
    setSelectedUserIds(new Set());
  };

  const handleConfirm = async () => {
    if (selectedUserIds.size === 0) return;
    
    try {
      setIsSaving(true);
      setError(null);
      await onConfirm(Array.from(selectedUserIds));
    } catch (err) {
      console.error('Error copying permissions:', err);
      setError('Erro ao copiar permissões. Tente novamente mais tarde.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 sm:mx-0 sm:h-10 sm:w-10">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                  Distribuir Permissões
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Você está prestes a copiar {sourcePermissions.length} rotas marcadas de <strong>{sourceUserName || 'este rascunho de usuário'}</strong> para outros usuários de perfil personalizado.
                  </p>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
                    <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                  </div>
                )}

                <div className="mt-4">
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      placeholder="Buscar usuários..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {selectedUserIds.size} selecionados de {filteredUsers.length} disponíveis
                    </span>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={selectAll}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        Selecionar Todos
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={clearAll}
                        className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-left border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden h-60 overflow-y-auto">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 h-full text-gray-500 dark:text-gray-400">
                        <Users className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
                        <p>{searchTerm ? 'Nenhum usuário correspondente.' : 'Nenhum outro usuário personalizado encontrado.'}</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUsers.map((user) => (
                          <div 
                            key={user.id}
                            className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedUserIds.has(user.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            onClick={() => toggleUser(user.id)}
                          >
                            <div className="flex-shrink-0 mr-3">
                              {selectedUserIds.has(user.id) ? (
                                <CheckSquare size={20} className="text-blue-600" />
                              ) : (
                                <Square size={20} className="text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {user.nome}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {user.email} {user.departamento ? `| ${user.departamento}` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={isSaving || selectedUserIds.size === 0}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleConfirm}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 mt-0.5"></div>
                  Salvando...
                </>
              ) : (
                'Aplicar e Distribuir'
              )}
            </button>
            <button
              type="button"
              disabled={isSaving}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
