import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Ban
} from 'lucide-react';
import { saasTenantsService, SaasTenant, SaasPlan } from '../../services/saasTenantsService';
import { saasAdminLogsService } from '../../services/saasAdminLogsService';

export function SaasTenantsManagement() {
  const [tenants, setTenants] = useState<SaasTenant[]>([]);
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<SaasTenant | null>(null);
  const [formData, setFormData] = useState<Partial<SaasTenant>>({
    company_name: '',
    trade_name: '',
    document: '',
    plan_id: '',
    status: 'trial',
    contact_email: '',
    contact_phone: ''
    // tenant_code será gerado automaticamente pelo banco
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [tenantsData, plansData] = await Promise.all([
        saasTenantsService.getTenants(),
        saasTenantsService.getPlans()
      ]);
      setTenants(tenantsData);
      setPlans(plansData);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  }

  function handleOpenModal(tenant?: SaasTenant) {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData(tenant);
    } else {
      setEditingTenant(null);
      setFormData({
        company_name: '',
        trade_name: '',
        document: '',
        plan_id: '',
        status: 'trial',
        contact_email: '',
        contact_phone: ''
        // tenant_code será gerado automaticamente
      });
    }
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingTenant(null);
    setFormData({
      company_name: '',
      trade_name: '',
      document: '',
      plan_id: '',
      status: 'trial',
      contact_email: '',
      contact_phone: ''
      // tenant_code será gerado automaticamente
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      let result;

      if (editingTenant) {
        result = await saasTenantsService.updateTenant(editingTenant.id, formData);
        await saasAdminLogsService.logAction(
          'update',
          'tenant',
          `Cliente atualizado: ${formData.company_name}`,
          { tenantId: editingTenant.id, changes: formData }
        );
      } else {
        result = await saasTenantsService.createTenant(formData);
        await saasAdminLogsService.logAction(
          'create',
          'tenant',
          `Cliente criado: ${formData.company_name}`,
          { resourceId: result.id }
        );
      }

      if (result.success) {
        alert(editingTenant ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!');
        handleCloseModal();
        loadData();
      } else {
        alert('Erro: ' + result.error);
      }
    } catch (error) {

      alert('Erro ao salvar cliente');
    }
  }

  async function handleDelete(tenant: SaasTenant) {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${tenant.company_name}"?`)) {
      return;
    }

    try {
      const result = await saasTenantsService.deleteTenant(tenant.id);

      if (result.success) {
        await saasAdminLogsService.logAction(
          'delete',
          'tenant',
          `Cliente excluído: ${tenant.company_name}`,
          { tenantId: tenant.id }
        );
        alert('Cliente excluído com sucesso!');
        loadData();
      } else {
        alert('Erro ao excluir cliente: ' + result.error);
      }
    } catch (error) {

      alert('Erro ao excluir cliente');
    }
  }

  const filteredTenants = tenants.filter(tenant =>
    tenant.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.tenant_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.document?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusIcons = {
    active: CheckCircle,
    inactive: XCircle,
    trial: Clock,
    suspended: Ban,
    blocked: Ban
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    trial: 'bg-blue-100 text-blue-800',
    suspended: 'bg-orange-100 text-orange-800',
    blocked: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    active: 'Ativo',
    inactive: 'Inativo',
    trial: 'Trial',
    suspended: 'Suspenso',
    blocked: 'Bloqueado'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Gestão de Clientes (Tenants)</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie todos os clientes do ambiente SaaS</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Cliente</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, código ou documento..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  CNPJ/CPF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
              {filteredTenants.map((tenant) => {
                const StatusIcon = statusIcons[tenant.status] || CheckCircle;

                return (
                  <tr key={tenant.id} className="hover:bg-gray-50 dark:bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {tenant.tenant_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {tenant.trade_name && (
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{tenant.trade_name}</div>
                        )}
                        <div className="text-sm text-gray-500 dark:text-gray-400">{tenant.company_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {tenant.document || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {tenant.plan?.display_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                        statusColors[tenant.status]
                      }`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusLabels[tenant.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{tenant.contact_email || '-'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{tenant.contact_phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenModal(tenant)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tenant)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTenants.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">
                  {editingTenant ? 'Editar Cliente' : 'Novo Cliente'}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {editingTenant && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Código do Cliente
                      </label>
                      <input
                        type="text"
                        value={formData.tenant_code}
                        readOnly
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Código não pode ser alterado</p>
                    </div>
                  )}
                  {!editingTenant && (
                    <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        O código será gerado automaticamente (Próximo estimado: <strong>{String(tenants.length > 0 ? Math.max(...tenants.map(t => parseInt(t.tenant_code || '0', 10))) + 1 : 1).padStart(8, '0')}</strong>)
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CNPJ/CPF
                    </label>
                    <input
                      type="text"
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Razão Social *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      value={formData.trade_name}
                      onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Plano *
                    </label>
                    <select
                      required
                      value={formData.plan_id}
                      onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione um plano</option>
                      {plans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.display_name} - R$ {plan.price_monthly.toFixed(2)}/mês
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status *
                    </label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Ativo</option>
                      <option value="trial">Trial</option>
                      <option value="inactive">Inativo</option>
                      <option value="suspended">Suspenso</option>
                      <option value="blocked">Bloqueado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email de Contato
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Telefone de Contato
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTenant ? 'Atualizar' : 'Criar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
