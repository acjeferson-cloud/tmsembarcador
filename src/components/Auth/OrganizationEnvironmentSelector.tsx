import React, { useState, useEffect, useRef } from 'react';
import { X, Building2, Layers, CheckCircle2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OrganizationEnvironment {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  organization_is_active: boolean;
  environment_id: string;
  environment_name: string;
  environment_slug: string;
  environment_type: string;
  environment_is_active: boolean;
}

interface Props {
  isOpen: boolean;
  userEmail: string;
  onSelect: (orgId: string, envId: string, orgName: string, envName: string) => void;
  onClose: () => void;
}

export const OrganizationEnvironmentSelector: React.FC<Props> = ({
  isOpen,
  userEmail,
  onSelect,
  onClose
}) => {
  const [items, setItems] = useState<OrganizationEnvironment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgEnv, setSelectedOrgEnv] = useState<{
    orgId: string;
    envId: string;
    orgName: string;
    envName: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [shouldShowModal, setShouldShowModal] = useState(false);

  useEffect(() => {
    if (isOpen && userEmail) {
      loadOrganizationsEnvironments();
    }
  }, [isOpen, userEmail]);

  // Auto-focus no campo de pesquisa quando o modal abrir
  useEffect(() => {
    if (isOpen && !loading && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, loading]);

  const loadOrganizationsEnvironments = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .rpc('get_user_organizations_environments', {
          p_user_email: userEmail
        });

      if (error) {
        console.error('Erro ao buscar organizations/environments:', error);
        return;
      }

      if (data && data.length > 0) {
        setItems(data);

        // Se houver apenas 1 organization/environment, auto-selecionar E confirmar
        if (data.length === 1) {
          const item = data[0];

          // NÃO mostrar o modal
          setShouldShowModal(false);

          // Chamar onSelect diretamente sem mostrar o modal
          onSelect(
            item.organization_id,
            item.environment_id,
            item.organization_name,
            item.environment_name
          );
        } else {
          // Múltiplos ambientes: mostrar o modal
          setShouldShowModal(true);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar organizations/environments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (orgId: string, envId: string, orgName: string, envName: string) => {
    setSelectedOrgEnv({ orgId, envId, orgName, envName });
  };

  const handleConfirm = () => {
    if (selectedOrgEnv) {
      onSelect(
        selectedOrgEnv.orgId,
        selectedOrgEnv.envId,
        selectedOrgEnv.orgName,
        selectedOrgEnv.envName
      );
    }
  };

  // Filtrar itens baseado no termo de pesquisa
  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      item.organization_name.toLowerCase().includes(searchLower) ||
      item.organization_slug.toLowerCase().includes(searchLower) ||
      item.environment_name.toLowerCase().includes(searchLower) ||
      item.environment_slug.toLowerCase().includes(searchLower)
    );
  });

  // Agrupar por organização
  const groupedData = filteredItems.reduce((acc, item) => {
    const orgKey = item.organization_id;
    if (!acc[orgKey]) {
      acc[orgKey] = {
        organization_id: item.organization_id,
        organization_name: item.organization_name,
        organization_slug: item.organization_slug,
        environments: []
      };
    }
    acc[orgKey].environments.push({
      environment_id: item.environment_id,
      environment_name: item.environment_name,
      environment_slug: item.environment_slug,
      environment_type: item.environment_type,
      environment_is_active: item.environment_is_active
    });
    return acc;
  }, {} as Record<string, any>);

  const organizations = Object.values(groupedData);

  // Não renderizar o modal se:
  // 1. Não está aberto (isOpen = false)
  // 2. Está carregando dados
  // 3. Foi detectado apenas 1 ambiente (shouldShowModal = false)
  if (!isOpen || (loading === false && shouldShowModal === false)) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 bg-gray-100 dark:bg-slate-900">
        <img
          src="/Tamanho_pequenoveio-de-drone-camiao-no-porto-de-embarque-para-transporte-de-carga-e-logistica-empresarial.jpg"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover opacity-20 dark:opacity-5"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/40 via-blue-50/30 to-gray-100/40 dark:from-blue-900/20 dark:to-slate-900/30"></div>
      </div>

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Selecione a Organização e Ambiente
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Escolha a organização e o ambiente que deseja acessar
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 pt-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar organização ou ambiente..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-12">
              <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm
                  ? `Nenhum resultado encontrado para "${searchTerm}"`
                  : 'Nenhuma organização ou ambiente encontrado para este usuário.'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Limpar pesquisa
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {organizations.map((org) => (
                <div
                  key={org.organization_id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                >
                  {/* Organization Header */}
                  <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <Building2 size={20} className="text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {org.organization_name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Código: {org.organization_slug}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Environments */}
                  <div className="p-4 space-y-2">
                    {org.environments.map((env: any) => {
                      const isSelected =
                        selectedOrgEnv?.orgId === org.organization_id &&
                        selectedOrgEnv?.envId === env.environment_id;

                      const getEnvColor = (type: string) => {
                        switch (type) {
                          case 'production':
                            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                          case 'staging':
                            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                          case 'sandbox':
                            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                          default:
                            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
                        }
                      };

                      const getEnvLabel = (type: string) => {
                        switch (type) {
                          case 'production':
                            return 'Produção';
                          case 'staging':
                            return 'Homologação';
                          case 'sandbox':
                            return 'Sandbox';
                          default:
                            return type;
                        }
                      };

                      return (
                        <button
                          key={env.environment_id}
                          onClick={() =>
                            handleSelect(
                              org.organization_id,
                              env.environment_id,
                              org.organization_name,
                              env.environment_name
                            )
                          }
                          disabled={!env.environment_is_active}
                          className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                          } ${
                            !env.environment_is_active
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Layers
                              size={20}
                              className={isSelected ? 'text-blue-600' : 'text-gray-400'}
                            />
                            <div className="text-left">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {env.environment_name}
                              </p>
                              <span
                                className={`inline-block text-xs px-2 py-1 rounded mt-1 ${getEnvColor(
                                  env.environment_type
                                )}`}
                              >
                                {getEnvLabel(env.environment_type)}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 size={24} className="text-blue-600 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedOrgEnv ? (
              <p className="font-medium">
                {selectedOrgEnv.orgName} - {selectedOrgEnv.envName}
              </p>
            ) : (
              <p>Nenhum ambiente selecionado</p>
            )}
            {searchTerm && (
              <p className="text-xs mt-1">
                {filteredItems.length} resultado{filteredItems.length !== 1 ? 's' : ''} encontrado{filteredItems.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedOrgEnv}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
