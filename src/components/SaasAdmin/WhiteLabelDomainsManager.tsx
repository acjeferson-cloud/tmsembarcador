import React, { useState, useEffect } from 'react';
import { Plus, Globe, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { whiteLabelService, WhiteLabelDomain } from '../../services/whiteLabelService';

export function WhiteLabelDomainsManager({ tenantId }: { tenantId: string }) {
  const [domains, setDomains] = useState<WhiteLabelDomain[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    domain: '',
    domain_type: 'subdomain' as 'subdomain' | 'custom'
  });

  useEffect(() => {
    loadDomains();
  }, [tenantId]);

  async function loadDomains() {
    const data = await whiteLabelService.getDomains(tenantId);
    setDomains(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = await whiteLabelService.createDomain({
      tenant_id: tenantId,
      ...formData
    });

    if (result.success) {
      alert('Domínio adicionado com sucesso!');
      setShowModal(false);
      loadDomains();
      setFormData({ domain: '', domain_type: 'subdomain' });
    } else {
      alert('Erro: ' + result.error);
    }
  }

  const statusIcons = {
    pending: AlertTriangle,
    verifying: AlertTriangle,
    active: CheckCircle,
    failed: XCircle,
    suspended: XCircle
  };

  const statusColors = {
    pending: 'text-yellow-600 bg-yellow-100',
    verifying: 'text-blue-600 bg-blue-100',
    active: 'text-green-600 bg-green-100',
    failed: 'text-red-600 bg-red-100',
    suspended: 'text-orange-600 bg-orange-100'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-600 dark:text-gray-400">Configure domínios personalizados para este cliente</p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Domínio</span>
        </button>
      </div>

      <div className="space-y-4">
        {domains.map(domain => {
          const StatusIcon = statusIcons[domain.status];

          return (
            <div key={domain.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{domain.domain}</span>
                    {domain.is_primary && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Principal
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Tipo: {domain.domain_type === 'subdomain' ? 'Subdomínio' : 'Domínio Próprio'}</span>
                    <span className={`flex items-center space-x-1 px-2 py-1 rounded-full ${statusColors[domain.status]}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{domain.status}</span>
                    </span>
                  </div>

                  {domain.dns_verification_token && domain.status === 'pending' && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                      <p className="text-sm font-medium text-yellow-900 mb-1">Verificação Pendente</p>
                      <p className="text-xs text-yellow-700">
                        Adicione este registro TXT ao DNS: <code className="bg-yellow-100 px-1">{domain.dns_verification_token}</code>
                      </p>
                    </div>
                  )}

                  {domain.ssl_status && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      SSL: {domain.ssl_status} {domain.ssl_expires_at && `(expira em ${new Date(domain.ssl_expires_at).toLocaleDateString('pt-BR')})`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {domains.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Nenhum domínio configurado
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Adicionar Domínio</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Domínio
                </label>
                <select
                  value={formData.domain_type}
                  onChange={(e) => setFormData({ ...formData, domain_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="subdomain">Subdomínio (ex: cliente.tms.com)</option>
                  <option value="custom">Domínio Próprio (ex: app.cliente.com.br)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Domínio *
                </label>
                <input
                  type="text"
                  required
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="cliente.tms.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
