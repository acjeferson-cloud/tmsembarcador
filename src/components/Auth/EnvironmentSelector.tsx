import React, { useState, useEffect, useRef } from 'react';
import { Building2, Database, AlertCircle, ChevronRight, Loader2, Search, X } from 'lucide-react';
import { userEnvironmentsService, UserEnvironment } from '../../services/userEnvironmentsService';
import { useTranslation } from 'react-i18next';

interface EnvironmentSelectorProps {
  email: string;
  password: string;
  onSelect: (environmentId: string, establishmentCode: string) => void;
  onBack: () => void;
}

export const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({
  email,
  password,
  onSelect,
  onBack,
}) => {
  const { t } = useTranslation();
  const [environments, setEnvironments] = useState<UserEnvironment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnv, setSelectedEnv] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEnvironments();
  }, [email]);

  useEffect(() => {
    if (!loading && environments.length > 0 && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [loading, environments.length]);

  async function loadEnvironments() {
    try {
      setLoading(true);
      setError(null);
      const data = await userEnvironmentsService.getUserEnvironments(email);
      setEnvironments(data);

      // Se houver apenas 1 environment, selecionar automaticamente
      if (data.length === 1) {
        handleSelectEnvironment(data[0].environment_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar ambientes');
    } finally {
      setLoading(false);
    }
  }

  const handleSelectEnvironment = (environmentId: string) => {
    setSelectedEnv(environmentId);
    // Por padrão, usar estabelecimento 0001
    onSelect(environmentId, '0001');
  };

  const getEnvironmentTypeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      producao: 'bg-emerald-500',
      homologacao: 'bg-blue-500',
      teste: 'bg-yellow-500',
      sandbox: 'bg-orange-500',
      desenvolvimento: 'bg-slate-500',
    };
    return colors[tipo] || 'bg-slate-500';
  };

  const getEnvironmentTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      producao: t('environmentSelector.envTypes.production'),
      homologacao: t('environmentSelector.envTypes.staging'),
      teste: t('environmentSelector.envTypes.test'),
      sandbox: t('environmentSelector.envTypes.sandbox'),
      desenvolvimento: t('environmentSelector.envTypes.development'),
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('environmentSelector.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-800 px-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle size={24} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                  {t('environmentSelector.error')}
                </h3>
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {t('environmentSelector.backToLogin')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (environments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-800 px-4">
        <div className="max-w-md w-full">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle size={24} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                  {t('environmentSelector.noEnvironments')}
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  {t('environmentSelector.noEnvironmentsMessage')}
                </p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="mt-4 w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              {t('environmentSelector.backToLogin')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar ambientes com base no termo de pesquisa
  const filteredEnvironments = environments.filter((env) => {
    if (!searchTerm.trim()) return true;

    const search = searchTerm.toLowerCase();
    return (
      env.organization_nome.toLowerCase().includes(search) ||
      env.organization_codigo.toLowerCase().includes(search) ||
      env.environment_nome?.toLowerCase().includes(search) ||
      false
    );
  });

  // Agrupar por organização
  const groupedEnvironments = filteredEnvironments.reduce((acc, env) => {
    if (!acc[env.organization_codigo]) {
      acc[env.organization_codigo] = {
        organization_id: env.organization_id,
        organization_codigo: env.organization_codigo,
        organization_nome: env.organization_nome,
        environments: [],
      };
    }
    acc[env.organization_codigo].environments.push(env);
    return acc;
  }, {} as Record<string, { organization_id: string; organization_codigo: string; organization_nome: string; environments: UserEnvironment[] }>);

  const hasResults = Object.keys(groupedEnvironments).length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 bg-gray-100 dark:bg-slate-900">
        <img
          src="/Tamanho_pequenoveio-de-drone-camiao-no-porto-de-embarque-para-transporte-de-carga-e-logistica-empresarial.jpg"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover opacity-20 dark:opacity-5"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/40 via-blue-50/30 to-gray-100/40 dark:from-blue-900/20 dark:to-slate-900/30"></div>
      </div>

      <div className="max-w-6xl w-full relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('environmentSelector.title')}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              {t('environmentSelector.greeting', { name: environments[0]?.user_nome })}
            </p>
          </div>

          {/* Campo de Pesquisa */}
          <div className="mb-6">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('environmentSelector.searchPlaceholder')}
                className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {hasResults
                  ? t('environmentSelector.resultsFound', { count: filteredEnvironments.length })
                  : t('environmentSelector.noResults')}
              </p>
            )}
          </div>

          {/* Lista de Ambientes */}
          {!hasResults ? (
            <div className="text-center py-12">
              <AlertCircle size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('environmentSelector.noResultsTitle')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('environmentSelector.noResultsMessage', { search: searchTerm })}
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('environmentSelector.clearSearch')}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
            {Object.values(groupedEnvironments).map((org) => (
              <div key={org.organization_codigo}>
                {Object.values(groupedEnvironments).length > 1 && (
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2 pb-2 border-b-2 border-gray-200 dark:border-gray-700">
                    <Building2 size={20} className="text-blue-600 dark:text-blue-400" />
                    <span>{org.organization_nome}</span>
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400">({org.organization_codigo})</span>
                  </h3>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {org.environments.map((env) => (
                    <button
                      key={env.environment_id}
                      onClick={() => handleSelectEnvironment(env.environment_id)}
                      disabled={selectedEnv === env.environment_id}
                      className={`group relative w-full p-6 border-2 rounded-xl transition-all duration-300 cursor-pointer ${
                        selectedEnv === env.environment_id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-lg hover:scale-[1.02] bg-white dark:bg-gray-800'
                      }`}
                    >
                      {/* Badge de Tipo - Canto Superior Direito */}
                      <span
                        className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-md ${getEnvironmentTypeColor(
                          env.environment_tipo
                        )}`}
                      >
                        {getEnvironmentTypeLabel(env.environment_tipo)}
                      </span>

                      {/* Logo Centralizado */}
                      <div className="flex justify-center mb-4">
                        {env.environment_logo_url ? (
                          <img
                            src={env.environment_logo_url}
                            alt={env.environment_nome}
                            className="h-16 w-16 object-contain drop-shadow-lg"
                            onError={(e) => {
                              console.error('Erro ao carregar logo do ambiente:', env.environment_logo_url);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const icon = document.createElement('div');
                                icon.className = 'flex items-center justify-center h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-lg';
                                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>';
                                parent.appendChild(icon);
                              }
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-lg shadow-md">
                            <Database size={32} className="text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                      </div>

                      {/* Nome e Código do Ambiente - Centralizados */}
                      <div className="text-center mb-4">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                          {org.organization_nome}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          ({org.organization_codigo})
                        </p>
                      </div>

                      {/* Linha Separadora */}
                      <div className="border-t border-gray-200 dark:border-gray-700 mb-3"></div>

                      {/* Contagem de Estabelecimentos */}
                      <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                        <ChevronRight size={14} className="flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {t('environmentSelector.establishmentsCount', { count: env.establishments_count })}
                        </span>
                      </div>

                      {/* Indicador de Seleção */}
                      {selectedEnv === env.environment_id && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-400/5 to-blue-500/10 rounded-xl pointer-events-none"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={onBack}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {t('environmentSelector.backToLogin')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
