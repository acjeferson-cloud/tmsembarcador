import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { whiteLabelService, WhiteLabelAsset } from '../../services/whiteLabelService';

export function WhiteLabelAssetsManager({ tenantId }: { tenantId: string }) {
  const [assets, setAssets] = useState<WhiteLabelAsset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAssets();
  }, [tenantId]);

  async function loadAssets() {
    const data = await whiteLabelService.getAssets(tenantId);
    setAssets(data);
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este asset?')) return;

    const result = await whiteLabelService.deleteAsset(id);
    if (result.success) {
      alert('Asset excluído com sucesso!');
      loadAssets();
    } else {
      alert('Erro ao excluir asset: ' + result.error);
    }
  }

  const assetTypes = [
    { value: 'logo', label: 'Logo Principal' },
    { value: 'logo_small', label: 'Logo Pequeno' },
    { value: 'favicon', label: 'Favicon' },
    { value: 'background', label: 'Imagem de Fundo' },
    { value: 'email_header', label: 'Cabeçalho de Email' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Upload de Assets</h4>
        <p className="text-sm text-blue-700 mb-4">
          Funcionalidade de upload em desenvolvimento. Em produção, integrará com storage do Supabase.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assetTypes.map(type => {
          const asset = assets.find(a => a.asset_type === type.value && a.is_active);

          return (
            <div key={type.value} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">{type.label}</h4>

              {asset ? (
                <div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-3 flex items-center justify-center h-32">
                    {asset.file_url ? (
                      <img
                        src={asset.file_url}
                        alt={type.label}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remover</span>
                  </button>
                </div>
              ) : (
                <div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-3 flex items-center justify-center h-32">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                  <button className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
