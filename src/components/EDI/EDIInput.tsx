import React, { useState, useRef } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Upload, FileText, CheckCircle, AlertCircle, X, Info, RefreshCw, FileUp, Database } from 'lucide-react';
import { doccobImportService } from '../../services/doccobImportService';
import { Toast, ToastType } from '../common/Toast';

// EDI Layout types
type EDILayoutType = 'NOTFIS' | 'CONEMB' | 'OCOREN' | 'DOCCOB';

interface EDIFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  status: 'uploading' | 'validating' | 'success' | 'error';
  progress: number;
  message?: string;
  layout?: EDILayoutType;
}

export const EDIInput: React.FC = () => {
  const breadcrumbItems = [
    { label: 'EDI' },
    { label: 'Entrada', current: true }
  ];

  const [selectedLayout, setSelectedLayout] = useState<EDILayoutType | ''>('');
  const [files, setFiles] = useState<EDIFile[]>([]);
  const [observations, setObservations] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const processingCount = files.filter(f => ['uploading', 'validating'].includes(f.status)).length;

  const handleLayoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedLayout(e.target.value as EDILayoutType);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedLayout) return;
    
    const newFiles = Array.from(e.target.files).filter(file => file.type === 'text/plain' || file.name.endsWith('.txt'));
    
    if (newFiles.length === 0) {
      setToast({ message: 'Por favor, selecione apenas arquivos .txt', type: 'error' });
      return;
    }
    
    processFiles(newFiles);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (!selectedLayout) {
      setToast({ message: 'Por favor, selecione um tipo de importação primeiro', type: 'warning' });
      return;
    }
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'text/plain' || file.name.endsWith('.txt')
    );
    
    if (droppedFiles.length === 0) {
      setToast({ message: 'Por favor, arraste apenas arquivos .txt', type: 'error' });
      return;
    }
    
    processFiles(droppedFiles);
  };

  const processFiles = (newFiles: File[]) => {
    newFiles.forEach(file => {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Add file to state with uploading status
      setFiles(prev => [
        ...prev,
        {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          content: '',
          status: 'uploading',
          progress: 0
        }
      ]);
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, progress: Math.min(progress, 100) } 
              : f
          )
        );
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // Read file content
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            
            // Update file with content and move to validating status
            setFiles(prev => 
              prev.map(f => 
                f.id === fileId 
                  ? { ...f, content, status: 'validating', progress: 0 } 
                  : f
              )
            );
            
            // Validate file content
            validateFile(fileId, content);
          };
          
          reader.readAsText(file);
        }
      }, 200);
    });
  };

  const validateFile = (fileId: string, content: string) => {
    // Simulate validation process
    let progress = 0;
    const interval = setInterval(() => {
      progress += 15;
      setFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, progress: Math.min(progress, 100) } 
            : f
        )
      );
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Perform basic layout validation
        const isValid = validateLayout(content, selectedLayout as EDILayoutType);
        
        // Update file status based on validation result
        setFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { 
                  ...f, 
                  status: isValid ? 'success' : 'error',
                  message: isValid 
                    ? `Arquivo ${selectedLayout} válido` 
                    : `Arquivo não corresponde ao layout ${selectedLayout}`,
                  layout: selectedLayout as EDILayoutType
                } 
              : f
          )
        );
      }
    }, 300);
  };

  const validateLayout = (content: string, layout: EDILayoutType): boolean => {
    // Simple validation based on expected content in each layout type
    // In a real implementation, this would be more sophisticated
    const firstLine = content.split('\n')[0] || '';
    
    switch (layout) {
      case 'NOTFIS':
        return firstLine.includes('NOTFIS') || firstLine.includes('NF') || firstLine.includes('NOTA');
      case 'CONEMB':
        return firstLine.includes('CONEMB') || firstLine.includes('CTE') || firstLine.includes('CONHECIMENTO');
      case 'OCOREN':
        return firstLine.includes('OCOREN') || firstLine.includes('OCOR') || firstLine.includes('ENTREGA');
      case 'DOCCOB':
        return firstLine.includes('DOCCOB') || firstLine.includes('FATURA') || firstLine.includes('COB');
      default:
        return false;
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setObservations('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'validating':
        return <RefreshCw size={16} className="animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <FileText size={16} className="text-gray-600 dark:text-gray-400" />;
    }
  };

  const getLayoutDescription = (layout: EDILayoutType): string => {
    switch (layout) {
      case 'NOTFIS':
        return 'Importação de NFs emitidas para a empresa embarcadora';
      case 'CONEMB':
        return 'Importação de CT-es emitidos pelos transportadores';
      case 'OCOREN':
        return 'Recebimento de status logísticos das entregas via EDI';
      case 'DOCCOB':
        return 'Importação de faturas consolidadas de fretes';
      default:
        return '';
    }
  };

  const handleProcessAll = async () => {
    if (files.length === 0) {
      setToast({ message: 'Não há arquivos para processar', type: 'warning' });
      return;
    }
    
    if (files.some(f => f.status === 'uploading' || f.status === 'validating')) {
      setToast({ message: 'Aguarde o término do processamento de todos os arquivos', type: 'warning' });
      return;
    }
    
    setIsProcessing(true);
    
    const validFiles = files.filter(f => f.status === 'success');
    if (validFiles.length === 0) {
      setToast({ message: 'Não há arquivos válidos para processar', type: 'error' });
      setIsProcessing(false);
      return;
    }
    
    if (selectedLayout === 'DOCCOB') {
      let totalProcessed = 0;
      let totalCTesLinked = 0;
      let allErrors: string[] = [];

      for (const file of validFiles) {
        const result = await doccobImportService.processFile(file.content);
        totalProcessed += result.billsProcessed;
        totalCTesLinked += result.ctesLinked;
        if (result.errors && result.errors.length > 0) {
          allErrors = [...allErrors, ...result.errors];
        }
      }

      setIsProcessing(false);
      if (allErrors.length === 0) {
        setToast({ message: `Processamento concluído: ${totalProcessed} fatura(s) importada(s) com sucesso e ${totalCTesLinked} CT-e(s) vinculado(s).`, type: 'success' });
      } else {
        setToast({ message: `Processamento com avisos: ${totalProcessed} fatura(s) importada(s).\nErros encontrados:\n${allErrors.join('\n')}`, type: 'warning' });
      }
    } else {
      // Simulate processing for other layout types
      setTimeout(() => {
        setToast({ message: `Processamento de ${selectedLayout} concluído (Simulado)`, type: 'success' });
        setIsProcessing(false);
      }, 2000);
    }
  };

  const exportErrorReport = () => {
    const errorFiles = files.filter(f => f.status === 'error');
    if (errorFiles.length === 0) {
      setToast({ message: 'Não há erros para exportar', type: 'warning' });
      return;
    }
    
    const report = errorFiles.map(f => `Arquivo: ${f.name}\nErro: ${f.message}\n\n`).join('');
    
    // Create a blob and download it
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio_erros_edi.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EDIs de Entrada</h1>
          <p className="text-gray-600 dark:text-gray-400">Importe e processe arquivos EDI conforme os layouts homologados</p>
        </div>
      </div>

      {/* Layout Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Seleção do Tipo de Importação</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="radio"
              id="layout-notfis"
              name="layout"
              value="NOTFIS"
              checked={selectedLayout === 'NOTFIS'}
              onChange={handleLayoutChange}
              className="peer absolute opacity-0 w-0 h-0"
            />
            <label
              htmlFor="layout-notfis"
              className="flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:bg-gray-50 dark:bg-gray-900"
            >
              <FileText size={32} className="text-blue-600 mb-2" />
              <span className="font-medium text-gray-900 dark:text-white">Notas Fiscais</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">Layout: NOTFIS</span>
            </label>
          </div>
          
          <div className="relative">
            <input
              type="radio"
              id="layout-conemb"
              name="layout"
              value="CONEMB"
              checked={selectedLayout === 'CONEMB'}
              onChange={handleLayoutChange}
              className="peer absolute opacity-0 w-0 h-0"
            />
            <label
              htmlFor="layout-conemb"
              className="flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:bg-gray-50 dark:bg-gray-900"
            >
              <FileText size={32} className="text-green-600 mb-2" />
              <span className="font-medium text-gray-900 dark:text-white">Conhecimentos</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">Layout: CONEMB</span>
            </label>
          </div>
          
          <div className="relative">
            <input
              type="radio"
              id="layout-ocoren"
              name="layout"
              value="OCOREN"
              checked={selectedLayout === 'OCOREN'}
              onChange={handleLayoutChange}
              className="peer absolute opacity-0 w-0 h-0"
            />
            <label
              htmlFor="layout-ocoren"
              className="flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:bg-gray-50 dark:bg-gray-900"
            >
              <FileText size={32} className="text-orange-600 mb-2" />
              <span className="font-medium text-gray-900 dark:text-white">Ocorrências</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">Layout: OCOREN</span>
            </label>
          </div>
          
          <div className="relative">
            <input
              type="radio"
              id="layout-doccob"
              name="layout"
              value="DOCCOB"
              checked={selectedLayout === 'DOCCOB'}
              onChange={handleLayoutChange}
              className="peer absolute opacity-0 w-0 h-0"
            />
            <label
              htmlFor="layout-doccob"
              className="flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:bg-gray-50 dark:bg-gray-900"
            >
              <FileText size={32} className="text-purple-600 mb-2" />
              <span className="font-medium text-gray-900 dark:text-white">Faturas</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">Layout: DOCCOB</span>
            </label>
          </div>
        </div>
        
        {selectedLayout && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Layout selecionado: {selectedLayout}</p>
                <p className="text-xs text-blue-700 mt-1">
                  {getLayoutDescription(selectedLayout as EDILayoutType)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File Upload */}
      {selectedLayout && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload de Arquivos</h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Arraste e solte seus arquivos EDI aqui
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ou clique para selecionar arquivos
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Selecionar Arquivos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Apenas arquivos .txt são aceitos. Tamanho máximo: 10MB por arquivo.
            </p>
          </div>
          
          {/* Observations */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Informações adicionais sobre este lote de arquivos..."
            />
          </div>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Arquivos Enviados</h2>
            <button
              onClick={clearAllFiles}
              className="text-red-600 hover:text-red-800 text-sm flex items-center space-x-1"
            >
              <X size={16} />
              <span>Limpar Todos</span>
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{files.length}</p>
                </div>
                <FileText size={24} className="text-gray-400" />
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Processando</p>
                  <p className="text-2xl font-semibold text-blue-900">{processingCount}</p>
                </div>
                <RefreshCw size={24} className={`text-blue-400 ${processingCount > 0 ? 'animate-spin' : ''}`} />
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Sucesso</p>
                  <p className="text-2xl font-semibold text-green-900">{successCount}</p>
                </div>
                <CheckCircle size={24} className="text-green-400" />
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Erros</p>
                  <p className="text-2xl font-semibold text-red-900">{errorCount}</p>
                </div>
                <AlertCircle size={24} className="text-red-400" />
              </div>
            </div>
          </div>
          
          {/* Files Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Arquivo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tamanho
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Layout
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50 dark:bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText size={20} className="text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {file.layout || selectedLayout}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(file.status)}
                        <div className="ml-2">
                          {file.status === 'uploading' && (
                            <div className="flex flex-col">
                              <span className="text-sm text-blue-600">Enviando...</span>
                              <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full" 
                                  style={{ width: `${file.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          
                          {file.status === 'validating' && (
                            <div className="flex flex-col">
                              <span className="text-sm text-blue-600">Validando...</span>
                              <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full" 
                                  style={{ width: `${file.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          
                          {file.status === 'success' && (
                            <span className="text-sm text-green-600">Validado com sucesso</span>
                          )}
                          
                          {file.status === 'error' && (
                            <span className="text-sm text-red-600">{file.message || 'Erro na validação'}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Actions */}
          <div className="mt-6 flex flex-wrap justify-end gap-4">
            {errorCount > 0 && (
              <button
                onClick={exportErrorReport}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors flex items-center space-x-2"
              >
                <FileUp size={16} />
                <span>Exportar Relatório de Erros</span>
              </button>
            )}
            
            <button
              onClick={handleProcessAll}
              disabled={isProcessing || processingCount > 0 || files.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Database size={16} />
                  <span>Processar Arquivos</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Sobre Layouts EDI</h3>
        <p className="text-blue-800 mb-4">
          Os arquivos EDI (Electronic Data Interchange) permitem a troca de informações entre empresas de forma padronizada.
          Cada layout tem uma finalidade específica no processo logístico.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">NOTFIS</p>
            <p className="text-blue-700">Notas fiscais emitidas</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">CONEMB</p>
            <p className="text-blue-700">Conhecimentos de transporte</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">OCOREN</p>
            <p className="text-blue-700">Ocorrências na entrega</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">DOCCOB</p>
            <p className="text-blue-700">Faturas de frete</p>
          </div>
        </div>
      </div>

      {/* Technical Requirements */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Requisitos Técnicos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Formatos Aceitos</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Arquivos de texto (.txt)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Codificação UTF-8 ou ASCII</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Tamanho máximo: 10MB por arquivo</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Processamento</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Validação automática de layout</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Registro de logs para auditoria</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Relatório detalhado de erros</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};