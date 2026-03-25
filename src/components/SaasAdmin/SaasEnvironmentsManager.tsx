import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Save, X, Trash2, Database, Activity, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { Environment, environmentsService, CreateEnvironmentInput, UpdateEnvironmentInput } from '../../services/environmentsService';
import { environmentLogoService } from '../../services/environmentLogoService';
import { supabase } from '../../lib/supabase';

interface SaasEnvironmentsManagerProps {
  organizationId: string;
  organizationName: string;
}

export function SaasEnvironmentsManager({ organizationId, organizationName }: SaasEnvironmentsManagerProps) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [envEstablishments, setEnvEstablishments] = useState<Record<string, any[]>>({});
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CreateEnvironmentInput>>({
    organization_id: organizationId,
    codigo: '',
    nome: '',
    tipo: 'desenvolvimento',
    metadata: {},
  });

  useEffect(() => {
    loadEnvironments();
  }, [organizationId]);

  async function loadEnvironments() {
    try {
      setLoading(true);
      setError(null);
      const data = await environmentsService.getAll(organizationId);
      setEnvironments(data);

      // Carregar stats e estabelecimentos para cada environment
      const statsData: Record<string, any> = {};
      const estDataMap: Record<string, any[]> = {};

      for (const env of data) {
        const envStats = await environmentsService.getStats(env.id);
        statsData[env.id] = envStats;

        const { data: ests } = await supabase
          .from('establishments')
          .select('id, codigo, nome_fantasia, razao_social, ativo')
          .eq('environment_id', env.id)
          .order('codigo');
        
        estDataMap[env.id] = ests || [];
      }
      setStats(statsData);
      setEnvEstablishments(estDataMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar environments');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      if (!formData.nome || !formData.codigo || !formData.tipo) {
        alert('Preencha todos os campos obrigatórios');
        return;
      }

      await environmentsService.create(formData as CreateEnvironmentInput);
      setIsCreating(false);
      setFormData({
        organization_id: organizationId,
        codigo: '',
        nome: '',
        tipo: 'desenvolvimento',
        metadata: {},
      });
      await loadEnvironments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao criar environment');
    }
  }

  async function handleUpdate(id: string) {
    try {
      const updates: UpdateEnvironmentInput = {
        nome: formData.nome,
        metadata: formData.metadata,
      };

      await environmentsService.update(id, updates);
      setEditingId(null);
      await loadEnvironments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar environment');
    }
  }

  async function handleToggleActive(id: string) {
    try {
      await environmentsService.toggleActive(id);
      await loadEnvironments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao ativar/desativar environment');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja desativar este environment? Ele ficará oculto/inativo, mas os dados serão mantidos.')) {
      return;
    }

    try {
      await environmentsService.softDelete(id);
      await loadEnvironments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao desativar environment');
    }
  }

  async function handleHardDelete(id: string) {
    if (!confirm('ATENÇÃO: Você está prestes a EXCLUIR DEFINITIVAMENTE este ambiente e TODOS os seus dados (Pedidos, Clientes, Usuários, Faturas, etc).\n\nEssa ação é irreversível e destruirá todo o histórico desta organização vinculada.\n\nTem certeza absoluta?')) {
      return;
    }

    try {
      await environmentsService.hardDelete(id);
      await loadEnvironments();
      alert('Ambiente e todos os dados vinculados foram excluídos com sucesso!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir definitivamente o ambiente. Verifique se a constraint cascade foi aplicada no banco de dados.');
    }
  }

  function startEdit(env: Environment) {
    setEditingId(env.id);
    setFormData({
      nome: env.nome,
      codigo: env.codigo,
      tipo: env.tipo,
      metadata: env.metadata || {},
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData({
      organization_id: organizationId,
      codigo: '',
      nome: '',
      tipo: 'desenvolvimento',
      metadata: {},
    });
  }

  async function handleLogoUpload(environmentId: string, file: File) {
    try {
      setUploadingLogo(environmentId);

      const result = await environmentLogoService.uploadLogo(environmentId, file);

      if (result.success) {
        alert('Logotipo enviado com sucesso!');
        // Forçar reload completo dos ambientes
        await loadEnvironments();
      } else {
        console.error('Erro no upload do logo:', result.error);
        alert(result.error || 'Erro ao enviar logotipo');
      }
    } catch (err) {
      console.error('Exceção no upload do logo:', err);
      alert(err instanceof Error ? err.message : 'Erro ao enviar logotipo');
    } finally {
      setUploadingLogo(null);
    }
  }

  async function handleLogoRemove(environmentId: string) {
    if (!confirm('Deseja remover o logotipo deste ambiente?')) {
      return;
    }

    try {
      const result = await environmentLogoService.removeLogo(environmentId);

      if (result.success) {
        alert('Logotipo removido com sucesso!');
        await loadEnvironments();
      } else {
        alert(result.error || 'Erro ao remover logotipo');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover logotipo');
    }
  }

  const environmentTypes = [
    { value: 'producao', label: 'Produção', color: 'bg-green-500' },
    { value: 'homologacao', label: 'Homologação', color: 'bg-blue-500' },
    { value: 'teste', label: 'Testes', color: 'bg-yellow-500' },
    { value: 'sandbox', label: 'Sandbox', color: 'bg-purple-500' },
    { value: 'desenvolvimento', label: 'Desenvolvimento', color: 'bg-gray-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Database size={20} />
            Ambientes - {organizationName}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Organização: <code className="text-blue-400 bg-gray-800 px-1 py-0.5 rounded">{organizationId}</code>
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Novo Ambiente
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Formulário de criação */}
      {isCreating && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h4 className="text-white font-semibold mb-4">Criar Novo Ambiente</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="Ex: Produção"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Código (identificador) *</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="Ex: PRODUCAO"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Tipo *</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                {environmentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Save size={18} />
              Criar
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                cancelEdit();
              }}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de environments */}
      <div className="grid grid-cols-1 gap-4">
        {environments.map((env) => (
          <div
            key={env.id}
            className={`bg-gray-800 rounded-lg p-6 border ${
              env.status === 'ativo' ? 'border-gray-700' : 'border-gray-800 opacity-60'
            }`}
          >
            {editingId === env.id ? (
              <div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nome</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleUpdate(env.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Save size={18} />
                    Salvar
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-white">{env.nome}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                        environmentTypes.find(t => t.value === env.tipo)?.color || 'bg-gray-500'
                      }`}>
                        {environmentTypes.find(t => t.value === env.tipo)?.label || env.tipo}
                      </span>
                      {env.status !== 'ativo' && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-500 text-white">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-1">Código: <code className="text-blue-400">{env.codigo}</code></p>
                    <p className="text-xs text-gray-500 mb-1">Environment ID: <code className="text-gray-400 bg-gray-700/50 px-1 py-0.5 rounded">{env.id}</code></p>
                  </div>
                  <div className="flex gap-2 items-start">
                    {(() => {
                      // Obter URL do logo com fallback para base64
                      const logoUrl = env.logo_url || (env.logo_metadata && typeof env.logo_metadata === 'object' && (env.logo_metadata as any).base64);

                      if (logoUrl) {
                        // Adicionar cache busting baseado em updated_at
                        const timestamp = new Date(env.updated_at).getTime();
                        const finalUrl = logoUrl.startsWith('data:')
                          ? logoUrl
                          : `${logoUrl}${logoUrl.includes('?') ? '&' : '?'}v=${timestamp}`;

                        return (
                          <div className="mr-2">
                            <img
                              key={`logo-${env.id}-${timestamp}`}
                              src={finalUrl}
                              alt="Logo do ambiente"
                              className="h-12 w-12 object-contain rounded bg-white/5 p-1"
                              onLoad={() => {
                              }}
                              onError={(e) => {
                                console.error('Erro ao carregar logo:', finalUrl);
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <button
                      onClick={() => startEdit(env)}
                      className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    {env.tipo !== 'producao' && env.status === 'ativo' && (
                      <button
                        onClick={() => handleDelete(env.id)}
                        className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"
                        title="Desativar (Soft Delete)"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    {env.tipo !== 'producao' && env.status === 'inativo' && (
                      <button
                        onClick={() => handleHardDelete(env.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Excluir Definitivamente (CASCATA DE DADOS)"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload de Logotipo */}
                <div className="mb-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const logoUrl = env.logo_url || (env.logo_metadata && typeof env.logo_metadata === 'object' && (env.logo_metadata as any).base64);
                        if (logoUrl) {
                          const timestamp = new Date(env.updated_at).getTime();
                          const finalUrl = logoUrl.startsWith('data:')
                            ? logoUrl
                            : `${logoUrl}${logoUrl.includes('?') ? '&' : '?'}v=${timestamp}`;

                          return (
                            <div className="flex-shrink-0">
                              <img
                                key={`preview-${env.id}-${timestamp}`}
                                src={finalUrl}
                                alt="Preview do logo"
                                className="h-16 w-16 object-contain rounded bg-white/10 p-2"
                                onLoad={() => console.log('Preview carregado:', env.nome)}
                                onError={(e) => {
                                  console.error('Erro no preview:', finalUrl);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          );
                        }
                        return null;
                      })()}
                      <div>
                        <h5 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                          <ImageIcon size={16} />
                          Logotipo do Ambiente
                        </h5>
                        <p className="text-xs text-gray-400">
                          {(() => {
                            const hasLogo = env.logo_url || (env.logo_metadata && typeof env.logo_metadata === 'object' && (env.logo_metadata as any).base64);
                            if (hasLogo) {
                              const metadata = env.logo_metadata as any;
                              const size = metadata?.size_bytes ? `(${(metadata.size_bytes / 1024).toFixed(1)} KB)` : '';
                              return `Logotipo configurado ${size}`;
                            }
                            return 'Nenhum logotipo configurado';
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleLogoUpload(env.id, file);
                            }
                          }}
                          disabled={uploadingLogo === env.id}
                        />
                        <div className={`px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm ${
                          uploadingLogo === env.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}>
                          {uploadingLogo === env.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Upload size={16} />
                              {(() => {
                                const hasLogo = env.logo_url || (env.logo_metadata && typeof env.logo_metadata === 'object' && (env.logo_metadata as any).base64);
                                return hasLogo ? 'Alterar' : 'Upload';
                              })()}
                            </>
                          )}
                        </div>
                      </label>
                      {(() => {
                        const hasLogo = env.logo_url || (env.logo_metadata && typeof env.logo_metadata === 'object' && (env.logo_metadata as any).base64);
                        if (hasLogo) {
                          return (
                            <button
                              onClick={() => handleLogoRemove(env.id)}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-2"
                              disabled={uploadingLogo === env.id}
                            >
                              <X size={16} />
                              Remover
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Estatísticas */}
                {stats[env.id] && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mt-4 pt-4 border-t border-gray-700">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Estabelecimentos</div>
                      <div className="text-lg font-semibold text-white">{stats[env.id].total_establishments || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Usuários</div>
                      <div className="text-lg font-semibold text-white">{stats[env.id].total_users || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Transportadores</div>
                      <div className="text-lg font-semibold text-white">{stats[env.id].total_carriers || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Pedidos</div>
                      <div className="text-lg font-semibold text-white">{stats[env.id].total_orders || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Notas Fiscais</div>
                      <div className="text-lg font-semibold text-white">{stats[env.id].total_invoices || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Coletas</div>
                      <div className="text-lg font-semibold text-white">{stats[env.id].total_pickups || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">CT-es</div>
                      <div className="text-lg font-semibold text-white">{stats[env.id].total_ctes || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Faturas</div>
                      <div className="text-lg font-semibold text-white">{stats[env.id].total_bills || 0}</div>
                    </div>
                  </div>
                )}

                {/* Estabelecimentos (Company) */}
                {envEstablishments[env.id] && envEstablishments[env.id].length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <h5 className="text-sm font-semibold text-white mb-3">Companhias / Estabelecimentos do Ambiente</h5>
                    <div className="space-y-2">
                      {envEstablishments[env.id].map((est: any) => (
                        <div key={est.id} className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-3 flex justify-between items-center hover:bg-gray-700/50 transition-colors">
                          <div>
                            <div className="text-sm text-white font-medium flex items-center gap-2">
                              {est.codigo} - {est.nome_fantasia || est.razao_social}
                              {!est.ativo && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-semibold">INATIVO</span>}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Company ID: <code className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">{est.id}</code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400">
                  <div>Criado: {new Date(env.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {environments.length === 0 && !isCreating && (
        <div className="text-center py-12 text-gray-400">
          <Database size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum ambiente encontrado</p>
          <p className="text-sm mt-2">Crie o primeiro ambiente para esta organização</p>
        </div>
      )}
    </div>
  );
}
