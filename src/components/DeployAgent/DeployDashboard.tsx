import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, CheckCircle, AlertTriangle, Info, Upload,
  FileText, TrendingUp, Clock, Bot, Zap, RefreshCw
} from 'lucide-react';
import { deployAgentService } from '../../services/deployAgentService';
import { DeployUploader } from './DeployUploader';

interface DeployDashboardProps {
  projectId: string;
  onBack: () => void;
}

export const DeployDashboard: React.FC<DeployDashboardProps> = ({ projectId, onBack }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [projectId]);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const data = await deployAgentService.getProjectDashboard(projectId);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !dashboardData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      </div>
    );
  }

  const { project, uploads, validations, suggestions, stats } = dashboardData;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Projetos
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{project.project_name}</h1>
              <p className="text-gray-600 dark:text-gray-400">Cliente: {project.client_name}</p>
            </div>
            <button
              onClick={() => setShowUploader(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Enviar Arquivos
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Progresso</span>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.progress}%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {stats.completedSteps} de {stats.totalSteps} etapas
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Erros</span>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600">{stats.errorsCount}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Requerem atenção</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Avisos</span>
            <Info className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-600">{stats.warningsCount}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Para revisão</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sugestões</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">{stats.suggestionsCount}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Melhorias possíveis</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Progresso Geral</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Implantação</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs text-center pt-2">
            <div>
              <div className="flex items-center justify-center gap-1 text-green-600 font-semibold">
                <CheckCircle className="w-4 h-4" />
                Coleta
              </div>
            </div>
            <div>
              <div className={`flex items-center justify-center gap-1 ${stats.progress >= 33 ? 'text-green-600' : 'text-gray-400'} font-semibold`}>
                <Bot className="w-4 h-4" />
                Interpretação
              </div>
            </div>
            <div>
              <div className={`flex items-center justify-center gap-1 ${stats.progress >= 66 ? 'text-green-600' : 'text-gray-400'} font-semibold`}>
                <Zap className="w-4 h-4" />
                Execução
              </div>
            </div>
            <div>
              <div className={`flex items-center justify-center gap-1 ${stats.progress === 100 ? 'text-green-600' : 'text-gray-400'} font-semibold`}>
                <CheckCircle className="w-4 h-4" />
                Concluído
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uploads */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Arquivos Enviados</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {uploads.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                Nenhum arquivo enviado ainda
              </div>
            ) : (
              uploads.map((upload: any) => (
                <div key={upload.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{upload.file_name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{upload.data_category.replace('_', ' ')}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      upload.status === 'executed' ? 'bg-green-100 text-green-800' :
                      upload.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {upload.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Validations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Validações</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {validations.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                Nenhuma validação registrada
              </div>
            ) : (
              validations.slice(0, 10).map((validation: any) => (
                <div key={validation.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {validation.severity === 'error' ? (
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{validation.message}</div>
                      {validation.field_name && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Campo: {validation.field_name}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Sugestões de Melhoria</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {suggestions.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                Nenhuma sugestão disponível
              </div>
            ) : (
              suggestions.map((suggestion: any) => (
                <div key={suggestion.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          suggestion.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          suggestion.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {suggestion.priority}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{suggestion.category.replace('_', ' ')}</span>
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">{suggestion.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{suggestion.description}</div>
                    </div>
                    {suggestion.status === 'pending' && (
                      <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
                        Aprovar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Uploader Modal */}
      {showUploader && (
        <DeployUploader
          projectId={projectId}
          onClose={() => {
            setShowUploader(false);
            loadDashboard();
          }}
        />
      )}
    </div>
  );
};
