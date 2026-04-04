import React, { useState, useEffect } from 'react';
import { Download, Eye } from 'lucide-react';
import { whiteLabelService, WhiteLabelTemplate } from '../../services/whiteLabelService';

export function WhiteLabelTemplates({ tenantId }: { tenantId: string }) {
  const [templates, setTemplates] = useState<WhiteLabelTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    const data = await whiteLabelService.getTemplates();
    setTemplates(data);
  }

  async function handleApply(templateId: string) {
    if (!confirm('Aplicar este template? Isso criará um novo tema com as cores do template.')) {
      return;
    }

    try {
      setLoading(true);
      const result = await whiteLabelService.applyTemplate(tenantId, templateId);

      if (result.success) {
        alert('Template aplicado com sucesso!');
      } else {
        alert('Erro ao aplicar template: ' + result.error);
      }
    } catch (error) {
      alert('Erro ao aplicar template');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white mb-2">Templates Prontos</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Selecione um template para aplicar rapidamente ao cliente
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map(template => (
          <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">{template.name}</h4>
                {template.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
                )}
              </div>
              {template.category && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                  {template.category}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 mb-4">
              {template.theme_config?.primary_color && (
                <div
                  className="w-10 h-10 rounded"
                  style={{ backgroundColor: template.theme_config.primary_color }}
                  title="Primary"
                />
              )}
              {template.theme_config?.secondary_color && (
                <div
                  className="w-10 h-10 rounded"
                  style={{ backgroundColor: template.theme_config.secondary_color }}
                  title="Secondary"
                />
              )}
              {template.theme_config?.accent_color && (
                <div
                  className="w-10 h-10 rounded"
                  style={{ backgroundColor: template.theme_config.accent_color }}
                  title="Accent"
                />
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
              <span>Usado {template.usage_count} vezes</span>
            </div>

            <button
              onClick={() => handleApply(template.id)}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Aplicar Template</span>
            </button>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Nenhum template disponível
        </div>
      )}
    </div>
  );
}
