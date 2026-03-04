import React, { useState, useEffect } from 'react';
import {
  Palette,
  Image,
  Globe,
  FileText,
  Save,
  Eye,
  Download,
  Upload,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { whiteLabelService, WhiteLabelConfig, WhiteLabelTheme } from '../../services/whiteLabelService';
import { saasTenantsService } from '../../services/saasTenantsService';
import { WhiteLabelThemeEditor } from './WhiteLabelThemeEditor';
import { WhiteLabelAssetsManager } from './WhiteLabelAssetsManager';
import { WhiteLabelDomainsManager } from './WhiteLabelDomainsManager';
import { WhiteLabelTemplates } from './WhiteLabelTemplates';

type TabType = 'config' | 'theme' | 'assets' | 'domains' | 'templates';

export function WhiteLabelManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('config');
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    is_enabled: false,
    brand_name: '',
    company_name: '',
    tagline: '',
    support_url: '',
    contact_email: '',
    contact_phone: '',
    privacy_policy_url: '',
    terms_of_service_url: '',
    hide_powered_by: true,
    custom_footer_text: '',
    custom_login_message: ''
  });

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      loadConfig();
    }
  }, [selectedTenant]);

  async function loadTenants() {
    const data = await saasTenantsService.getTenants();
    setTenants(data);
  }

  async function loadConfig() {
    if (!selectedTenant) return;

    try {
      setLoading(true);
      const data = await whiteLabelService.getConfig(selectedTenant);

      if (data) {
        setConfig(data);
        setFormData({
          is_enabled: data.is_enabled,
          brand_name: data.brand_name,
          company_name: data.company_name || '',
          tagline: data.tagline || '',
          support_url: data.support_url || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          privacy_policy_url: data.privacy_policy_url || '',
          terms_of_service_url: data.terms_of_service_url || '',
          hide_powered_by: data.hide_powered_by,
          custom_footer_text: data.custom_footer_text || '',
          custom_login_message: data.custom_login_message || ''
        });
      } else {
        const tenant = tenants.find(t => t.id === selectedTenant);
        setFormData({
          ...formData,
          brand_name: tenant?.company_name || '',
          company_name: tenant?.company_name || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveConfig() {
    if (!selectedTenant) {
      alert('Selecione um cliente primeiro');
      return;
    }

    try {
      setLoading(true);
      let result;

      if (config) {
        result = await whiteLabelService.updateConfig(selectedTenant, formData);
      } else {
        result = await whiteLabelService.createConfig({
          tenant_id: selectedTenant,
          ...formData
        });
      }

      if (result.success) {
        alert('Configuração salva com sucesso!');
        loadConfig();
      } else {
        alert('Erro ao salvar: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'config' as TabType, label: 'Configurações', icon: FileText },
    { id: 'theme' as TabType, label: 'Tema e Cores', icon: Palette },
    { id: 'assets' as TabType, label: 'Logos e Assets', icon: Image },
    { id: 'domains' as TabType, label: 'Domínios', icon: Globe },
    { id: 'templates' as TabType, label: 'Templates', icon: Download }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Gestão White Label</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Configure a identidade visual por cliente</p>
          </div>
        </div>

        {/* Tenant Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selecione o Cliente
          </label>
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione um cliente...</option>
            {tenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.company_name} ({tenant.tenant_code})
              </option>
            ))}
          </select>
        </div>

        {selectedTenant && (
          <>
            {/* Status Badge */}
            <div className="flex items-center space-x-2">
              {formData.is_enabled ? (
                <span className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  White Label Ativado
                </span>
              ) : (
                <span className="flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm">
                  <XCircle className="w-4 h-4 mr-1" />
                  White Label Desativado
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {selectedTenant && (
        <>
          {/* Navigation Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-all ${
                      isActive
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'config' && (
                <div className="space-y-6">
                  {/* Enable/Disable */}
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="is_enabled"
                      checked={formData.is_enabled}
                      onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="is_enabled" className="font-medium text-gray-900 dark:text-white">
                      Ativar White Label para este cliente
                    </label>
                  </div>

                  {/* Brand Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome da Marca *
                      </label>
                      <input
                        type="text"
                        value={formData.brand_name}
                        onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                        placeholder="Ex: Minha Empresa TMS"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Razão Social
                      </label>
                      <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Slogan/Tagline
                      </label>
                      <input
                        type="text"
                        value={formData.tagline}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        placeholder="Ex: Gestão inteligente de transporte"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-2 gap-4">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        URL de Suporte
                      </label>
                      <input
                        type="url"
                        value={formData.support_url}
                        onChange={(e) => setFormData({ ...formData, support_url: e.target.value })}
                        placeholder="https://suporte.exemplo.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        URL Política de Privacidade
                      </label>
                      <input
                        type="url"
                        value={formData.privacy_policy_url}
                        onChange={(e) => setFormData({ ...formData, privacy_policy_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        URL Termos de Serviço
                      </label>
                      <input
                        type="url"
                        value={formData.terms_of_service_url}
                        onChange={(e) => setFormData({ ...formData, terms_of_service_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Custom Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Texto do Rodapé
                    </label>
                    <textarea
                      value={formData.custom_footer_text}
                      onChange={(e) => setFormData({ ...formData, custom_footer_text: e.target.value })}
                      rows={2}
                      placeholder="Ex: © 2025 Minha Empresa. Todos os direitos reservados."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mensagem de Login Personalizada
                    </label>
                    <textarea
                      value={formData.custom_login_message}
                      onChange={(e) => setFormData({ ...formData, custom_login_message: e.target.value })}
                      rows={2}
                      placeholder="Ex: Bem-vindo ao sistema de gestão de transporte"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Hide Powered By */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="hide_powered_by"
                      checked={formData.hide_powered_by}
                      onChange={(e) => setFormData({ ...formData, hide_powered_by: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="hide_powered_by" className="text-sm text-gray-700 dark:text-gray-300">
                      Ocultar "Powered by TMS Embarcador"
                    </label>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4 border-t">
                    <button
                      onClick={handleSaveConfig}
                      disabled={loading}
                      className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-5 h-5" />
                      <span>{loading ? 'Salvando...' : 'Salvar Configurações'}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'theme' && <WhiteLabelThemeEditor tenantId={selectedTenant} />}
              {activeTab === 'assets' && <WhiteLabelAssetsManager tenantId={selectedTenant} />}
              {activeTab === 'domains' && <WhiteLabelDomainsManager tenantId={selectedTenant} />}
              {activeTab === 'templates' && <WhiteLabelTemplates tenantId={selectedTenant} />}
            </div>
          </div>
        </>
      )}

      {!selectedTenant && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center text-gray-500 dark:text-gray-400">
          Selecione um cliente para configurar o White Label
        </div>
      )}
    </div>
  );
}
