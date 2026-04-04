import React, { useState, useEffect } from 'react';
import { Save, Plus, Eye, Trash2, Check } from 'lucide-react';
import { whiteLabelService, WhiteLabelTheme } from '../../services/whiteLabelService';

export function WhiteLabelThemeEditor({ tenantId }: { tenantId: string }) {
  const [themes, setThemes] = useState<WhiteLabelTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<WhiteLabelTheme | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    primary_color: '#3B82F6',
    secondary_color: '#8B5CF6',
    accent_color: '#10B981',
    background_color: '#FFFFFF',
    text_color: '#1F2937',
    header_bg_color: '#1F2937',
    header_text_color: '#FFFFFF',
    sidebar_bg_color: '#FFFFFF',
    sidebar_text_color: '#1F2937',
    button_primary_bg: '#3B82F6',
    button_primary_text: '#FFFFFF',
    link_color: '#3B82F6',
    success_color: '#10B981',
    warning_color: '#F59E0B',
    error_color: '#EF4444',
    info_color: '#3B82F6',
    border_radius: '0.5rem',
    font_family: 'Inter, system-ui, sans-serif',
    theme_mode: 'light' as 'light' | 'dark' | 'auto'
  });

  useEffect(() => {
    loadThemes();
  }, [tenantId]);

  async function loadThemes() {
    const data = await whiteLabelService.getThemes(tenantId);
    setThemes(data);
  }

  function handleSelectTheme(theme: WhiteLabelTheme) {
    setSelectedTheme(theme);
    setFormData({
      name: theme.name,
      primary_color: theme.primary_color,
      secondary_color: theme.secondary_color,
      accent_color: theme.accent_color,
      background_color: theme.background_color,
      text_color: theme.text_color,
      header_bg_color: theme.header_bg_color,
      header_text_color: theme.header_text_color,
      sidebar_bg_color: theme.sidebar_bg_color,
      sidebar_text_color: theme.sidebar_text_color,
      button_primary_bg: theme.button_primary_bg,
      button_primary_text: theme.button_primary_text,
      link_color: theme.link_color,
      success_color: theme.success_color,
      warning_color: theme.warning_color,
      error_color: theme.error_color,
      info_color: theme.info_color,
      border_radius: theme.border_radius,
      font_family: theme.font_family,
      theme_mode: theme.theme_mode
    });
  }

  function handleNewTheme() {
    setSelectedTheme(null);
    setFormData({
      name: '',
      primary_color: '#3B82F6',
      secondary_color: '#8B5CF6',
      accent_color: '#10B981',
      background_color: '#FFFFFF',
      text_color: '#1F2937',
      header_bg_color: '#1F2937',
      header_text_color: '#FFFFFF',
      sidebar_bg_color: '#FFFFFF',
      sidebar_text_color: '#1F2937',
      button_primary_bg: '#3B82F6',
      button_primary_text: '#FFFFFF',
      link_color: '#3B82F6',
      success_color: '#10B981',
      warning_color: '#F59E0B',
      error_color: '#EF4444',
      info_color: '#3B82F6',
      border_radius: '0.5rem',
      font_family: 'Inter, system-ui, sans-serif',
      theme_mode: 'light'
    });
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      alert('Digite um nome para o tema');
      return;
    }

    try {
      setLoading(true);
      let result;

      if (selectedTheme) {
        result = await whiteLabelService.updateTheme(selectedTheme.id, formData);
      } else {
        result = await whiteLabelService.createTheme({
          tenant_id: tenantId,
          ...formData
        });
      }

      if (result.success) {
        alert('Tema salvo com sucesso!');
        loadThemes();
      } else {
        alert('Erro ao salvar tema: ' + result.error);
      }
    } catch (error) {

      alert('Erro ao salvar tema');
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate(themeId: string) {
    try {
      const result = await whiteLabelService.activateTheme(tenantId, themeId);
      if (result.success) {
        alert('Tema ativado com sucesso!');
        loadThemes();
      } else {
        alert('Erro ao ativar tema: ' + result.error);
      }
    } catch (error) {

      alert('Erro ao ativar tema');
    }
  }

  async function handleDelete(themeId: string) {
    if (!confirm('Tem certeza que deseja excluir este tema?')) return;

    try {
      const result = await whiteLabelService.deleteTheme(themeId);
      if (result.success) {
        alert('Tema excluído com sucesso!');
        loadThemes();
        if (selectedTheme?.id === themeId) {
          handleNewTheme();
        }
      } else {
        alert('Erro ao excluir tema: ' + result.error);
      }
    } catch (error) {

      alert('Erro ao excluir tema');
    }
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Themes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">Temas</h3>
          <button
            onClick={handleNewTheme}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo</span>
          </button>
        </div>

        <div className="space-y-2">
          {themes.map(theme => (
            <div
              key={theme.id}
              onClick={() => handleSelectTheme(theme)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedTheme?.id === theme.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{theme.name}</span>
                {theme.is_active && (
                  <span className="flex items-center text-xs text-green-600">
                    <Check className="w-3 h-3 mr-1" />
                    Ativo
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1 mb-2">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: theme.primary_color }}
                  title="Primary"
                />
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: theme.secondary_color }}
                  title="Secondary"
                />
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: theme.accent_color }}
                  title="Accent"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs">
                {!theme.is_active && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActivate(theme.id);
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Ativar
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(theme.id);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}

          {themes.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Nenhum tema cadastrado
            </p>
          )}
        </div>
      </div>

      {/* Theme Editor */}
      <div className="col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">
            {selectedTheme ? 'Editar Tema' : 'Novo Tema'}
          </h3>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white"
          >
            <Eye className="w-4 h-4" />
            <span>{showPreview ? 'Ocultar' : 'Visualizar'} Preview</span>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome do Tema *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Tema Azul Corporativo"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cor Primária
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cor Secundária
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.secondary_color}
                onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.secondary_color}
                onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cor de Destaque
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.accent_color}
                onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.accent_color}
                onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cor de Fundo
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.background_color}
                onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.background_color}
                onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <h4 className="font-medium mb-4">Preview do Tema</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <button
                  style={{
                    backgroundColor: formData.button_primary_bg,
                    color: formData.button_primary_text
                  }}
                  className="px-4 py-2 rounded-lg"
                >
                  Botão Primário
                </button>
                <a href="#" style={{ color: formData.link_color }}>
                  Link de exemplo
                </a>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div
                  className="p-3 rounded text-center text-white text-sm"
                  style={{ backgroundColor: formData.success_color }}
                >
                  Sucesso
                </div>
                <div
                  className="p-3 rounded text-center text-white text-sm"
                  style={{ backgroundColor: formData.warning_color }}
                >
                  Aviso
                </div>
                <div
                  className="p-3 rounded text-center text-white text-sm"
                  style={{ backgroundColor: formData.error_color }}
                >
                  Erro
                </div>
                <div
                  className="p-3 rounded text-center text-white text-sm"
                  style={{ backgroundColor: formData.info_color }}
                >
                  Info
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Salvando...' : 'Salvar Tema'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
