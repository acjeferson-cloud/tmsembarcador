import React from 'react';
import { ArrowLeft, Edit, FileText, Hash, Calendar, User, Tag, CheckCircle, XCircle } from 'lucide-react';
import { RejectionReason } from '../../data/rejectionReasonsData';

interface RejectionReasonViewProps {
  onBack: () => void;
  onEdit: () => void;
  reason: RejectionReason;
  isAdmin?: boolean;
}

export const RejectionReasonView: React.FC<RejectionReasonViewProps> = ({ onBack, onEdit, reason, isAdmin }) => {
  // Get category color based on category name
  const getCategoryColor = () => {
    if (reason.categoria.includes('Dados do Documento')) return 'bg-blue-100 text-blue-800';
    if (reason.categoria.includes('Valor')) return 'bg-green-100 text-green-800';
    if (reason.categoria.includes('Temporais')) return 'bg-yellow-100 text-yellow-800';
    if (reason.categoria.includes('Integrações')) return 'bg-purple-100 text-purple-800';
    if (reason.categoria.includes('Contratuais')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Voltar para Motivos de Rejeições</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visualizar Motivo de Rejeição</h1>
            <p className="text-gray-600 dark:text-gray-400">Detalhes completos do motivo de rejeição</p>
          </div>
          {isAdmin && (
            <button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Edit size={20} />
              <span>Editar</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start space-x-6">
            {/* Code */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-600">{reason.codigo}</span>
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{reason.descricao}</h2>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${reason.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {reason.ativo ? (
                    <>
                      <CheckCircle size={14} className="mr-1" />
                      <span>Ativo</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} className="mr-1" />
                      <span>Inativo</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Código</p>
                  <p className="font-medium text-gray-900 dark:text-white">{reason.codigo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <p className="font-medium text-gray-900 dark:text-white">{reason.ativo ? 'Ativo' : 'Inativo'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categoria</h3>
          <div className={`p-4 rounded-lg ${getCategoryColor()}`}>
            <div className="flex items-center space-x-2">
              <Tag size={20} />
              <h4 className="text-lg font-medium">{reason.categoria}</h4>
            </div>
          </div>
        </div>

        {/* Description Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Descrição Completa</h3>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-gray-800 dark:text-gray-200">{reason.descricao}</p>
          </div>
        </div>

        {/* Audit Information */}
        {(reason.criadoEm || reason.alteradoEm) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações de Auditoria</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reason.criadoEm && (
                <div className="flex items-center space-x-3">
                  <Calendar className="text-blue-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Data de Criação</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(reason.criadoEm)}</p>
                  </div>
                </div>
              )}
              
              {reason.criadoPor && (
                <div className="flex items-center space-x-3">
                  <User className="text-green-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Criado por</p>
                    <p className="font-medium text-gray-900 dark:text-white">Usuário #{reason.criadoPor}</p>
                  </div>
                </div>
              )}
              
              {reason.alteradoEm && (
                <div className="flex items-center space-x-3">
                  <Calendar className="text-orange-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Data da última alteração</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(reason.alteradoEm)}</p>
                  </div>
                </div>
              )}
              
              {reason.alteradoPor && (
                <div className="flex items-center space-x-3">
                  <User className="text-purple-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Última alteração por</p>
                    <p className="font-medium text-gray-900 dark:text-white">Usuário #{reason.alteradoPor}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Usage Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Utilização no Sistema</h3>
          <p className="text-blue-800 mb-4">
            Este motivo de rejeição é utilizado no processo de conferência eletrônica de documentos fiscais.
            Quando uma inconsistência é identificada, o sistema associa este motivo padronizado ao documento,
            facilitando a comunicação com o transportador e a geração de relatórios.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <p className="font-semibold text-blue-900">Auditoria Automática</p>
              <p className="text-blue-700">Validação de CT-es e Faturas</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <p className="font-semibold text-blue-900">Conciliação</p>
              <p className="text-blue-700">Processo de conciliação de fretes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};