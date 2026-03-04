import React, { useState, useEffect } from 'react';
import { X, Building2, Globe, CheckCircle } from 'lucide-react';
import { TenantContextHelper } from '../../utils/tenantContext';

interface Organization {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface Environment {
  id: string;
  name: string;
  type: 'production' | 'staging' | 'testing' | 'sandbox' | 'development';
  is_active: boolean;
}

interface OrganizationSelectorProps {
  isOpen: boolean;
  userEmail: string;
  onSelect: (organizationId: string, environmentId: string | null) => void;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  isOpen,
  userEmail,
  onSelect
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadOrganizations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedOrganization) {
      loadEnvironments(selectedOrganization);
    } else {
      setEnvironments([]);
      setSelectedEnvironment(null);
    }
  }, [selectedOrganization]);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      const data = await TenantContextHelper.getAllOrganizations();
      setOrganizations(data);
    } catch (error) {
      console.error('Erro ao carregar organizações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEnvironments = async (organizationId: string) => {
    try {
      const data = await TenantContextHelper.getEnvironmentsByOrganization(organizationId);
      setEnvironments(data);

      const productionEnv = data.find(env => env.type === 'production');
      if (productionEnv) {
        setSelectedEnvironment(productionEnv.id);
      } else if (data.length > 0) {
        setSelectedEnvironment(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar ambientes:', error);
    }
  };

  const handleConfirm = () => {
    if (selectedOrganization) {
      onSelect(selectedOrganization, selectedEnvironment);
    }
  };

  const getEnvironmentBadgeColor = (type: string) => {
    switch (type) {
      case 'production':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'staging':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'development':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sandbox':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'testing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEnvironmentLabel = (type: string) => {
    switch (type) {
      case 'production':
        return 'Produção';
      case 'staging':
        return 'Homologação';
      case 'development':
        return 'Desenvolvimento';
      case 'sandbox':
        return 'Sandbox';
      case 'testing':
        return 'Testes';
      default:
        return type;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Seleção de Organização e Ambiente
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Selecione a Organização
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => setSelectedOrganization(org.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${'${'}
                        selectedOrganization === org.id
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      ${'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">
                            {org.name}
                          </div>
                          <div className="text-sm text-slate-600 mt-1">
                            Código: {org.slug}
                          </div>
                        </div>
                        {selectedOrganization === org.id && (
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedOrganization && environments.length > 0 && (
                <div className="border-t border-slate-200 pt-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Selecione o Ambiente
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {environments.map((env) => (
                      <button
                        key={env.id}
                        onClick={() => setSelectedEnvironment(env.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${'${'}
                          selectedEnvironment === env.id
                            ? 'border-blue-600 bg-blue-50 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        ${'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-slate-500" />
                              <span className="font-semibold text-slate-900">
                                {env.name}
                              </span>
                              {env.type === 'production' && (
                                <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                                  Padrão
                                </span>
                              )}
                            </div>
                            <div className="mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full border ${'${getEnvironmentBadgeColor(env.type)}'}`}>
                                {getEnvironmentLabel(env.type)}
                              </span>
                            </div>
                          </div>
                          {selectedEnvironment === env.id && (
                            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrganization && environments.length === 0 && (
                <div className="border-t border-slate-200 pt-6">
                  <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Globe className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                    <p className="text-yellow-800 font-medium">Nenhum ambiente encontrado</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Entre em contato com o administrador para criar ambientes para esta organização
                    </p>
                  </div>
                </div>
              )}

              {organizations.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Nenhuma organização encontrada</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={handleConfirm}
            disabled={!selectedOrganization || !selectedEnvironment || isLoading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed font-medium"
          >
            Confirmar Seleção
          </button>
        </div>
      </div>
    </div>
  );
};
