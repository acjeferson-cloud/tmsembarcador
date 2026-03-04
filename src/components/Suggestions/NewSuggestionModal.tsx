import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Image, File, Trash2, Loader, CheckCircle } from 'lucide-react';
import { createSuggestion } from '../../services/suggestionsService';
import { Toast, ToastType } from '../common/Toast';
import { useTranslation } from 'react-i18next';

interface NewSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  establishmentId?: number;
}

interface FileWithPreview {
  file: File;
  preview?: string;
  id: string;
}

export const NewSuggestionModal: React.FC<NewSuggestionModalProps> = ({
  isOpen,
  onClose,
  userId,
  establishmentId
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [attachments, setAttachments] = useState<FileWithPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { value: '', label: 'Selecione uma categoria (opcional)' },
    { value: 'feature', label: 'Nova Funcionalidade' },
    { value: 'integration', label: 'Integração com Sistema' },
    { value: 'improvement', label: 'Melhoria de Processo' },
    { value: 'report', label: 'Novo Relatório' },
    { value: 'interface', label: 'Interface/Usabilidade' },
    { value: 'performance', label: 'Performance/Velocidade' },
    { value: 'other', label: 'Outros' }
  ];

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const validTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    const newFiles: FileWithPreview[] = [];

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setToast({
          message: `Arquivo ${file.name} não é suportado. Use imagens, PDF, Word, Excel ou TXT.`,
          type: 'error'
        });
        continue;
      }

      if (file.size > maxSize) {
        setToast({
          message: `Arquivo ${file.name} é muito grande. Limite: 10MB.`,
          type: 'error'
        });
        continue;
      }

      const fileWithPreview: FileWithPreview = {
        file,
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          fileWithPreview.preview = e.target?.result as string;
          setAttachments(prev => [...prev.filter(f => f.id !== fileWithPreview.id), fileWithPreview]);
        };
        reader.readAsDataURL(file);
      } else {
        newFiles.push(fileWithPreview);
      }
    }

    if (newFiles.length > 0) {
      setAttachments(prev => [...prev, ...newFiles]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type === 'application/pdf') return FileText;
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setToast({ message: 'Por favor, informe o título da sugestão', type: 'error' });
      return;
    }

    if (!description.trim()) {
      setToast({ message: 'Por favor, descreva sua sugestão', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createSuggestion({
        user_id: userId,
        establishment_id: establishmentId,
        title: title.trim(),
        description: description.trim(),
        category: category || undefined,
        attachments: attachments.map(a => a.file)
      });

      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        setToast({ message: result.message, type: 'error' });
        setIsSubmitting(false);
      }
    } catch (error) {
      setToast({ message: 'Erro ao enviar sugestão. Tente novamente.', type: 'error' });
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setAttachments([]);
    setIsSubmitting(false);
    setShowSuccess(false);
    onClose();
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Sugestão Enviada com Sucesso!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sua solicitação foi registrada e será analisada pela nossa equipe de consultoria.
            Em breve você receberá um retorno sobre sua sugestão.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800">
              Você pode acompanhar o status da sua solicitação na seção de sugestões.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Nova Sugestão</h2>
                <p className="text-blue-100 mt-1">
                  Compartilhe suas ideias para melhorar o sistema
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-white hover:bg-white dark:bg-gray-800/20 p-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título da Sugestão *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Adicionar integração com transportadora XYZ"
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:bg-gray-900 disabled:text-gray-500 dark:text-gray-400"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {title.length}/200 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:bg-gray-900 disabled:text-gray-500 dark:text-gray-400"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição Detalhada *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva sua sugestão em detalhes. Quanto mais informações você fornecer, melhor poderemos analisar e implementar sua ideia..."
                  disabled={isSubmitting}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:bg-gray-900 disabled:text-gray-500 dark:text-gray-400 resize-none"
                  maxLength={5000}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {description.length}/5000 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Arquivos de Apoio (Opcional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Clique para selecionar ou arraste arquivos aqui
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Imagens, PDF, Word, Excel ou TXT (máx. 10MB por arquivo)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={handleFileSelect}
                    disabled={isSubmitting}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  >
                    Selecionar Arquivos
                  </button>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachments.map((attachment) => {
                      const FileIcon = getFileIcon(attachment.file);
                      return (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {attachment.preview ? (
                              <img
                                src={attachment.preview}
                                alt={attachment.file.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <FileIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {attachment.file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(attachment.file.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(attachment.id)}
                            disabled={isSubmitting}
                            className="ml-3 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Dica:</strong> Para nos ajudar a entender melhor sua sugestão, inclua:
                  exemplos práticos, capturas de tela, fluxos de processo ou qualquer documento
                  que ilustre sua ideia.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex space-x-4">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors disabled:opacity-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !title.trim() || !description.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Enviar Sugestão</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};
