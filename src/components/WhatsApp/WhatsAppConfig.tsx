import React, { useState, useEffect } from 'react';
import { Save, TestTube, CheckCircle, XCircle, AlertCircle, MessageSquare, FileText, Plus, Trash2, Edit, Receipt, Info } from 'lucide-react';
import { whatsappService, WhatsAppConfig as IWhatsAppConfig, WhatsAppTemplate } from '../../services/whatsappService';
import { useAuth } from '../../hooks/useAuth';
import { WhatsAppExtract } from './WhatsAppExtract';
import { useInnovation, INNOVATION_IDS } from '../../hooks/useInnovation';

export const WhatsAppConfig: React.FC = () => {
  const { user } = useAuth();
  const { isActive: whatsappActive, isLoading: whatsappLoading } = useInnovation(
    INNOVATION_IDS.WHATSAPP,
    user?.id
  );
  const [activeTab, setActiveTab] = useState<'config' | 'templates' | 'extract'>('config');
  const [config, setConfig] = useState<IWhatsAppConfig>({
    access_token: '',
    phone_number_id: '',
    business_account_id: '',
    webhook_verify_token: '',
    is_active: true
  });

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
    loadTemplates();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await whatsappService.getActiveConfig();
      if (data) {
        setConfig({
          ...data,
          access_token: data.access_token || '',
          phone_number_id: data.phone_number_id || '',
          business_account_id: data.business_account_id || '',
          webhook_verify_token: data.webhook_verify_token || '',
          is_active: data.is_active !== undefined ? data.is_active : true
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await whatsappService.getAllTemplates();
      // Filtrar templates com dados válidos e adicionar valores padrão
      const validTemplates = data.filter(t => t && t.template_name).map(t => ({
        ...t,
        template_name: t.template_name || '',
        body_text: t.body_text || '',
        category: t.category || 'UTILITY',
        approval_status: t.approval_status || 'PENDING',
        template_language: t.template_language || 'pt_BR',
        is_active: t.is_active !== undefined ? t.is_active : true
      }));
      setTemplates(validTemplates);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      setTemplates([]);
    }
  };

  const handleSaveConfig = async () => {
    if (!whatsappActive) {
      setSaveMessage({ type: 'error', text: 'Recurso não contratado. Ative em Inovações & Sugestões.' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    const result = await whatsappService.saveConfig({
      ...config,
      created_by: user?.supabaseUser?.id
    });

    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Configuração salva com sucesso!' });
      await loadConfig();
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Erro ao salvar configuração' });
    }

    setIsSaving(false);
  };

  const handleTestConnection = async () => {
    if (!whatsappActive) {
      setTestResult({ success: false, message: 'Recurso não contratado. Ative em Inovações & Sugestões.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await whatsappService.testConnection(config);

    if (result.success) {
      setTestResult({ success: true, message: 'Conexão testada com sucesso! A configuração está funcionando.' });
    } else {
      setTestResult({ success: false, message: result.error || 'Falha ao testar conexão' });
    }

    setIsTesting(false);
    setTimeout(() => setTestResult(null), 5000);
  };

  const handleSaveTemplate = async () => {
    if (!whatsappActive) {
      setSaveMessage({ type: 'error', text: 'Recurso não contratado. Ative em Inovações & Sugestões.' });
      return;
    }

    if (!editingTemplate) return;

    if (!editingTemplate.template_name || !editingTemplate.body_text) {
      setSaveMessage({ type: 'error', text: 'Nome e corpo da mensagem são obrigatórios' });
      return;
    }

    setIsSaving(true);
    const result = await whatsappService.saveTemplate({
      ...editingTemplate,
      template_name: editingTemplate.template_name.trim(),
      body_text: editingTemplate.body_text.trim(),
      category: editingTemplate.category || 'UTILITY',
      approval_status: editingTemplate.approval_status || 'APPROVED',
      template_language: editingTemplate.template_language || 'pt_BR',
      created_by: user?.supabaseUser?.id
    });

    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Template salvo com sucesso!' });
      await loadTemplates();
      setShowTemplateForm(false);
      setEditingTemplate(null);
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Erro ao salvar template' });
    }

    setIsSaving(false);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!whatsappActive) {
      setSaveMessage({ type: 'error', text: 'Recurso não contratado. Ative em Inovações & Sugestões.' });
      return;
    }

    if (!confirm('Deseja realmente excluir este template?')) return;

    const result = await whatsappService.deleteTemplate(templateId);

    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Template excluído com sucesso!' });
      await loadTemplates();
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Erro ao excluir template' });
    }
  };

  const handleNewTemplate = () => {
    if (!whatsappActive) {
      setSaveMessage({ type: 'error', text: 'Recurso não contratado. Ative em Inovações & Sugestões.' });
      return;
    }

    setEditingTemplate({
      template_name: '',
      template_language: 'pt_BR',
      category: 'UTILITY',
      body_text: '',
      is_active: true,
      approval_status: 'APPROVED',
      variables: []
    });
    setShowTemplateForm(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações do WhatsApp</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure a integração com WhatsApp Business API</p>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-lg border ${
          saveMessage.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        }`}>
          <div className="flex items-center space-x-2">
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        </div>
      )}

      {/* Innovation Notice */}
      {!whatsappActive && !whatsappLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              <strong>Integração com WhatsApp não contratada:</strong> Para utilizar as funcionalidades do WhatsApp Business API,
              é necessário ativar o serviço em <strong>Inovações & Sugestões</strong>. Sem a ativação, as configurações não terão efeito.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MessageSquare size={16} />
              <span>Configurações API</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText size={16} />
              <span>Templates</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('extract')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'extract'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Receipt size={16} />
              <span>Extrato</span>
            </div>
          </button>
        </nav>
      </div>

      {activeTab === 'config' && (
        <>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Access Token *
              </label>
              <input
                type="password"
                value={config.access_token}
                onChange={(e) => setConfig({ ...config, access_token: e.target.value })}
                disabled={!whatsappActive}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Token de acesso permanente gerado na Meta for Developers
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number ID *
              </label>
              <input
                type="text"
                value={config.phone_number_id}
                onChange={(e) => setConfig({ ...config, phone_number_id: e.target.value })}
                disabled={!whatsappActive}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="123456789012345"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ID do número de telefone do WhatsApp Business
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Account ID *
              </label>
              <input
                type="text"
                value={config.business_account_id}
                onChange={(e) => setConfig({ ...config, business_account_id: e.target.value })}
                disabled={!whatsappActive}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="123456789012345"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ID da conta comercial do WhatsApp
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Webhook Verify Token (opcional)
              </label>
              <input
                type="text"
                value={config.webhook_verify_token || ''}
                onChange={(e) => setConfig({ ...config, webhook_verify_token: e.target.value })}
                disabled={!whatsappActive}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="seu_token_secreto"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Token para verificação de webhooks (se configurado)
              </p>
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center space-x-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <span className={testResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}>
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <button
                onClick={handleSaveConfig}
                disabled={!whatsappActive || isSaving || !config.access_token || !config.phone_number_id || !config.business_account_id}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                <span>{isSaving ? 'Salvando...' : 'Salvar Configuração'}</span>
              </button>

              <button
                onClick={handleTestConnection}
                disabled={!whatsappActive || isTesting || !config.access_token || !config.phone_number_id}
                className="flex items-center space-x-2 px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TestTube size={16} />
                <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
                Como obter as credenciais:
              </h3>
              <ol className="text-sm text-green-800 dark:text-green-400 space-y-2 list-decimal list-inside">
                <li>Acesse <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Meta for Developers</a></li>
                <li>Crie ou selecione um App do tipo "Business"</li>
                <li>Adicione o produto "WhatsApp" ao seu app</li>
                <li>Em "API Setup", você encontrará o Phone Number ID e poderá gerar o Access Token</li>
                <li>O Business Account ID está disponível nas configurações do WhatsApp Business</li>
              </ol>
              <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700">
                <p className="text-xs text-yellow-900 dark:text-yellow-300 font-medium mb-1">WhatsApp Business API (não possui plano gratuito):</p>
                <p className="text-xs text-yellow-800 dark:text-yellow-400 mt-2">
                  O WhatsApp opera exclusivamente com cobrança por uso, baseada no envio de mensagens e templates. Cada mensagem enviada — principalmente aquelas iniciadas pela empresa — gera custo conforme a tabela oficial de preços da Meta.
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-400 mt-2">
                  Recomendamos configurar limites de consumo no painel da plataforma parceira (BSP) para evitar qualquer gasto inesperado.
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-400 mt-2">
                  Lembre-se: além da cobrança por mensagem, existe também o valor mensal fixo do recurso, conforme previsto em contrato.
                </p>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gerencie os templates de mensagens aprovados pela Meta
            </p>
            <button
              onClick={handleNewTemplate}
              disabled={!whatsappActive}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              <span>Novo Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Nenhum template encontrado. Clique em "Novo Template" para criar um.
              </div>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {template.template_name || 'Sem nome'}
                        </h3>
                        {template.approval_status && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            template.approval_status === 'APPROVED'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : template.approval_status === 'PENDING'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {template.approval_status}
                          </span>
                        )}
                        {template.category && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {template.category}
                          </span>
                        )}
                      </div>
                    {template.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {template.description}
                      </p>
                    )}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {template.body_text}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        if (!whatsappActive) {
                          setSaveMessage({ type: 'error', text: 'Recurso não contratado. Ative em Inovações & Sugestões.' });
                          return;
                        }
                        setEditingTemplate(template);
                        setShowTemplateForm(true);
                      }}
                      disabled={!whatsappActive}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id!)}
                      disabled={!whatsappActive}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
            )}
          </div>

          {showTemplateForm && editingTemplate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingTemplate.id ? 'Editar Template' : 'Novo Template'}
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome do Template *
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.template_name || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, template_name: e.target.value })}
                      disabled={!!editingTemplate.id}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                      placeholder="nome_do_template"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.description || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                      disabled={!whatsappActive}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Descrição do uso do template"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Corpo da Mensagem *
                    </label>
                    <textarea
                      value={editingTemplate.body_text || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, body_text: e.target.value })}
                      rows={6}
                      disabled={!whatsappActive}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Digite o corpo da mensagem. Use {{1}}, {{2}}, etc. para variáveis."
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Variáveis devem estar no formato {'{{1}}'}, {'{{2}}'}, etc.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Categoria
                      </label>
                      <select
                        value={editingTemplate.category || 'UTILITY'}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                        disabled={!whatsappActive}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="UTILITY">UTILITY</option>
                        <option value="MARKETING">MARKETING</option>
                        <option value="AUTHENTICATION">AUTHENTICATION</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status de Aprovação
                      </label>
                      <select
                        value={editingTemplate.approval_status || 'APPROVED'}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, approval_status: e.target.value })}
                        disabled={!whatsappActive}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="APPROVED">APPROVED</option>
                        <option value="PENDING">PENDING</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={editingTemplate.is_active}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })}
                      disabled={!whatsappActive}
                      className="rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                      Template ativo
                    </label>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={handleSaveTemplate}
                      disabled={!whatsappActive || isSaving || !editingTemplate.template_name || !editingTemplate.body_text}
                      className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      onClick={() => {
                        setShowTemplateForm(false);
                        setEditingTemplate(null);
                      }}
                      className="flex-1 px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'extract' && <WhatsAppExtract />}
    </div>
  );
};
