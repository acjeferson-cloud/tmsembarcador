import React, { useState, useEffect } from 'react';
import {
  Bot, Upload, CheckCircle, AlertTriangle, Clock,
  FileText, TrendingUp, Zap, Target, Activity,
  Play, Pause, RotateCcw, Download, Eye, Trash2
} from 'lucide-react';
import { deployAgentService, DeployProject } from '../../services/deployAgentService';
import { DeployDashboard } from './DeployDashboard';
import { DeployUploader } from './DeployUploader';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { useAuth } from '../../hooks/useAuth';

export const DeployAgent: React.FC = () => {
  const { user } = useAuth();
  const breadcrumbItems = [
    { label: 'Centro de Implementação' },
    { label: 'Deploy Agent', current: true }
  ];

  const [projects, setProjects] = useState<DeployProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; projectId: string; projectName: string } | null>(null);

  const [newProjectData, setNewProjectData] = useState({
    project_name: '',
    client_name: '',
    auto_execute: false,
    require_approval: true
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await deployAgentService.getProjects();
      setProjects(data);
    } catch (error) {
      setToast({ message: 'Erro ao carregar projetos', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectData.project_name || !newProjectData.client_name) {
      setToast({ message: 'Preencha todos os campos obrigatórios', type: 'error' });
      return;
    }

    try {
      // Passar o supabaseUser.id se disponível, caso contrário o serviço usará um fallback
      const userId = user?.supabaseUser?.id;
      const project = await deployAgentService.createProject({
        ...newProjectData,
        user_id: userId
      });
      setToast({ message: 'Projeto criado com sucesso!', type: 'success' });
      setShowNewProject(false);
      setNewProjectData({ project_name: '', client_name: '', auto_execute: false, require_approval: true });
      await loadProjects();
      setSelectedProject(project.id);
    } catch (error: any) {
      console.error('Error creating project:', error);
      const errorMessage = error?.message || 'Erro ao criar projeto. Verifique o console para mais detalhes.';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      collecting: 'bg-blue-100 text-blue-800',
      interpreting: 'bg-purple-100 text-purple-800',
      executing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: Clock,
      collecting: Upload,
      interpreting: Bot,
      executing: Zap,
      completed: CheckCircle,
      failed: AlertTriangle
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    setDeleteConfirm({ show: true, projectId, projectName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deployAgentService.deleteProject(deleteConfirm.projectId);
      setToast({ message: 'Projeto excluído com sucesso!', type: 'success' });
      setDeleteConfirm(null);
      await loadProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      const errorMessage = error?.message || 'Erro ao excluir projeto';
      setToast({ message: errorMessage, type: 'error' });
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  if (selectedProject) {
    return (
      <DeployDashboard
        projectId={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  return (
    <div className="p-6">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white dark:bg-gray-800/20 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold">Deploy Agent</h1>
            </div>
            <p className="text-white/90 text-lg">
              Implantação automatizada com Inteligência Artificial
            </p>
            <p className="text-white/80 mt-2">
              Envie seus dados e deixe a IA configurar automaticamente todo o sistema
            </p>
          </div>
          <button
            onClick={() => setShowNewProject(true)}
            className="px-6 py-3 bg-white dark:bg-gray-800 text-purple-600 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors flex items-center gap-2 font-semibold"
          >
            <Play className="w-5 h-5" />
            Novo Projeto
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Upload Inteligente</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Envie planilhas e arquivos, a IA identifica automaticamente o tipo de dados
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Interpretação IA</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            OpenAI analisa, valida e mapeia os campos automaticamente
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Auto-Execução</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Parametrização automática de cadastros, tabelas e integrações
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Monitoramento</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Dashboard com status, erros e sugestões de melhoria em tempo real
          </p>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Projetos de Implantação</h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">Carregando projetos...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center">
            <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">Nenhum projeto criado ainda</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Criar Primeiro Projeto
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-6 hover:bg-gray-50 dark:bg-gray-900 transition-colors cursor-pointer"
                onClick={() => setSelectedProject(project.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {project.project_name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {getStatusIcon(project.status)}
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Cliente: {project.client_name}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Iniciado: {new Date(project.started_at).toLocaleDateString('pt-BR')}</span>
                      <span>•</span>
                      <span>Progresso: {project.progress_percentage}%</span>
                      {project.completed_at && (
                        <>
                          <span>•</span>
                          <span>Concluído: {new Date(project.completed_at).toLocaleDateString('pt-BR')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{project.progress_percentage}%</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{project.current_step}</div>
                    </div>
                    <button
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project.id);
                      }}
                      title="Ver detalhes"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id, project.project_name);
                      }}
                      title="Excluir projeto"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress_percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Novo Projeto de Implantação</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Projeto *
                </label>
                <input
                  type="text"
                  value={newProjectData.project_name}
                  onChange={(e) => setNewProjectData({ ...newProjectData, project_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Implantação Cliente ABC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  value={newProjectData.client_name}
                  onChange={(e) => setNewProjectData({ ...newProjectData, client_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Empresa XYZ Ltda"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newProjectData.auto_execute}
                    onChange={(e) => setNewProjectData({ ...newProjectData, auto_execute: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Executar automaticamente após interpretação</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newProjectData.require_approval}
                    onChange={(e) => setNewProjectData({ ...newProjectData, require_approval: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Requerer aprovação antes de executar</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewProject(false);
                  setNewProjectData({ project_name: '', client_name: '', auto_execute: false, require_approval: true });
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Criar Projeto
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm?.show || false}
        title="Tem certeza que deseja excluir o projeto?"
        message={`Projeto: "${deleteConfirm?.projectName}"\n\nEsta ação não pode ser desfeita.`}
        confirmText="OK"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        type="danger"
      />
    </div>
  );
};
