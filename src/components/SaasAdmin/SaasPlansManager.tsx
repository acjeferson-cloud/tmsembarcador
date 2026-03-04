import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Check, X, Star, AlertCircle } from 'lucide-react';
import { saasTenantsService, SaasPlan } from '../../services/saasTenantsService';
import { saasAdminLogsService } from '../../services/saasAdminLogsService';

export function SaasPlansManager() {
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SaasPlan | null>(null);
  const [formData, setFormData] = useState<Partial<SaasPlan>>({
    name: '',
    display_name: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    max_users: undefined,
    max_establishments: undefined,
    max_storage_gb: undefined,
    max_api_calls_month: undefined,
    features: [],
    is_active: true
  });
  const [featureInput, setFeatureInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    const data = await saasTenantsService.getPlans(true);
    setPlans(data);
    setLoading(false);
  }

  function handleNewPlan() {
    setEditingPlan(null);
    setFormData({
      name: '',
      display_name: '',
      description: '',
      price_monthly: 0,
      price_yearly: 0,
      max_users: undefined,
      max_establishments: undefined,
      max_storage_gb: undefined,
      max_api_calls_month: undefined,
      features: [],
      is_active: true
    });
    setFeatureInput('');
    setError('');
    setShowModal(true);
  }

  function handleEdit(plan: SaasPlan) {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      display_name: plan.display_name,
      description: plan.description || '',
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      max_users: plan.max_users,
      max_establishments: plan.max_establishments,
      max_storage_gb: plan.max_storage_gb,
      max_api_calls_month: plan.max_api_calls_month,
      features: plan.features || [],
      is_active: plan.is_active
    });
    setFeatureInput('');
    setError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.display_name) {
      setError('Nome e nome de exibição são obrigatórios');
      return;
    }

    setSaving(true);

    try {
      let result;

      if (editingPlan) {
        result = await saasTenantsService.updatePlan(editingPlan.id, formData);
        if (result.success) {
          await saasAdminLogsService.logAction(
            'update',
            'plan',
            `Plano atualizado: ${formData.display_name}`
          );
        }
      } else {
        result = await saasTenantsService.createPlan(formData);
        if (result.success) {
          await saasAdminLogsService.logAction(
            'create',
            'plan',
            `Novo plano criado: ${formData.display_name}`
          );
        }
      }

      if (result.success) {
        setShowModal(false);
        loadPlans();
      } else {
        setError(result.error || 'Erro ao salvar plano');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar plano');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(plan: SaasPlan) {
    if (!confirm(`Deseja realmente excluir o plano "${plan.display_name}"?`)) {
      return;
    }

    const result = await saasTenantsService.deletePlan(plan.id);

    if (result.success) {
      await saasAdminLogsService.logAction(
        'delete',
        'plan',
        `Plano excluído: ${plan.display_name}`
      );
      loadPlans();
    } else {
      alert(`Erro ao excluir plano: ${result.error}`);
    }
  }

  function addFeature() {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), featureInput.trim()]
      });
      setFeatureInput('');
    }
  }

  function removeFeature(index: number) {
    const newFeatures = [...(formData.features || [])];
    newFeatures.splice(index, 1);
    setFormData({ ...formData, features: newFeatures });
  }

  function formatPrice(price?: number) {
    if (price === null || price === undefined) return 'Sob consulta';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Gestão de Planos</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Configure os planos disponíveis para contratação</p>
          </div>
          <button
            onClick={handleNewPlan}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Plano</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Carregando planos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {plans.map(plan => (
              <div
                key={plan.id}
                className={`border-2 rounded-lg p-6 transition-all ${
                  !plan.is_active
                    ? 'border-gray-200 opacity-50'
                    : 'border-gray-200 hover:border-blue-500 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Package className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold">{plan.display_name}</h3>
                  </div>
                  {!plan.is_active && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                      Inativo
                    </span>
                  )}
                </div>

                {plan.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
                )}

                <div className="mb-4">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(plan.price_monthly)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">por mês</div>
                  {plan.price_yearly && plan.price_yearly > 0 && (
                    <div className="text-sm text-green-600 mt-1">
                      {formatPrice(plan.price_yearly)} por ano
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {plan.max_users && (
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      {plan.max_users === -1 ? 'Usuários ilimitados' : `Até ${plan.max_users} usuários`}
                    </div>
                  )}
                  {plan.max_establishments && (
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      {plan.max_establishments === -1 ? 'Estabelecimentos ilimitados' : `${plan.max_establishments} estabelecimentos`}
                    </div>
                  )}
                  {plan.max_storage_gb && (
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      {plan.max_storage_gb === -1 ? 'Armazenamento ilimitado' : `${plan.max_storage_gb} GB de armazenamento`}
                    </div>
                  )}
                </div>

                {plan.features && plan.features.length > 0 && (
                  <div className="border-t pt-4 mb-4">
                    <div className="space-y-1">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-start text-xs text-gray-600 dark:text-gray-400">
                          <Check className="w-3 h-3 text-green-600 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {plan.features.length > 3 && (
                        <div className="text-xs text-blue-600">
                          +{plan.features.length - 3} recursos
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(plan)}
                    className="flex items-center justify-center px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && plans.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Nenhum plano cadastrado</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">
                  {editingPlan ? 'Editar Plano' : 'Novo Plano'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome (identificador) *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ex: basic, pro, enterprise"
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Identificador único (sem espaços)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome de Exibição *
                    </label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ex: Plano Basic"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descrição do plano..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Preço Mensal (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price_monthly}
                      onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Preço Anual (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price_yearly}
                      onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Limites do Plano</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Máximo de Usuários
                      </label>
                      <input
                        type="number"
                        value={formData.max_users || ''}
                        onChange={(e) => setFormData({ ...formData, max_users: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ilimitado"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">-1 para ilimitado</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Máximo de Estabelecimentos
                      </label>
                      <input
                        type="number"
                        value={formData.max_establishments || ''}
                        onChange={(e) => setFormData({ ...formData, max_establishments: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ilimitado"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Armazenamento (GB)
                      </label>
                      <input
                        type="number"
                        value={formData.max_storage_gb || ''}
                        onChange={(e) => setFormData({ ...formData, max_storage_gb: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ilimitado"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Chamadas API/Mês
                      </label>
                      <input
                        type="number"
                        value={formData.max_api_calls_month || ''}
                        onChange={(e) => setFormData({ ...formData, max_api_calls_month: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ilimitado"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recursos Inclusos</h4>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite um recurso e pressione Enter"
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {formData.features && formData.features.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {formData.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-lg">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                          <button
                            type="button"
                            onClick={() => removeFeature(idx)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Plano Ativo</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                    Planos inativos não aparecem para seleção ao criar novos clientes
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : editingPlan ? 'Atualizar Plano' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
