import React, { useState, useEffect } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SaasEnvironmentsManager } from './SaasEnvironmentsManager';

interface Organization {
  id: string;
  name: string;
  code: string;
  status: string;
}

export function SaasEnvironmentsView() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function loadOrganizations() {
    try {
      console.log('[SAAS_ENVIRONMENTS_VIEW] Carregando organizações...');

      const { data, error } = await supabase
        .from('saas_organizations')
        .select('id, nome, codigo, status')
        .order('nome');

      if (error) {
        console.error('[SAAS_ENVIRONMENTS_VIEW] Erro ao carregar organizações:', error);
        throw error;
      }

      // Mapear dados de saas_organizations para formato Organization
      const mapped = (data || []).map(org => ({
        id: org.id,
        name: org.nome,
        code: org.codigo,
        status: org.status
      }));

      console.log('[SAAS_ENVIRONMENTS_VIEW] Organizações carregadas:', mapped);
      setOrganizations(mapped);
    } catch (err) {
      console.error('[SAAS_ENVIRONMENTS_VIEW] Error loading organizations:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleOrg(orgId: string) {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(orgId)) {
      newExpanded.delete(orgId);
    } else {
      newExpanded.add(orgId);
    }
    setExpandedOrgs(newExpanded);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Layers size={28} />
          Gerenciamento de Ambientes
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gerencie os ambientes (produção, testes, sandbox, etc) de cada organização
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Hierarquia Multi-Tenant com Environments</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <div>SaaS Admin Console (global)</div>
          <div className="ml-4">└── Organization (tenant)</div>
          <div className="ml-8">└── Environment (produção, testes, sandbox, etc)</div>
          <div className="ml-12">└── Company/Estabelecimento</div>
          <div className="ml-16">└── Dados operacionais (usuários, fretes, documentos)</div>
        </div>
      </div>

      <div className="space-y-4">
        {organizations.map((org) => (
          <div key={org.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleOrg(org.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Layers className="text-blue-600" size={24} />
                <div className="text-left">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{org.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {org.code} • {org.status}
                  </p>
                </div>
              </div>
              {expandedOrgs.has(org.id) ? (
                <ChevronUp className="text-gray-400" size={20} />
              ) : (
                <ChevronDown className="text-gray-400" size={20} />
              )}
            </button>

            {expandedOrgs.has(org.id) && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-900">
                <SaasEnvironmentsManager
                  organizationId={org.id}
                  organizationName={org.name}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {organizations.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Layers size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhuma organização encontrada</p>
        </div>
      )}
    </div>
  );
}
