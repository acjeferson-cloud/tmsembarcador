import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';
import { addElectronicDocument, ElectronicDocument, isValidChaveAcesso, isChaveAcessoUnique } from '../../data/electronicDocumentsData';
import { parseXML } from '../../services/xmlService';

interface DocumentUploadProps {
  onBack: () => void;
  onUploadComplete: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  progress: number;
  xmlContent?: string;
  parsedData?: Partial<ElectronicDocument>;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onBack, onUploadComplete }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList) => {
    const xmlFiles = Array.from(files).filter(file => 
      file.name.toLowerCase().endsWith('.xml')
    );

    if (xmlFiles.length === 0) {
      alert('Por favor, selecione apenas arquivos XML.');
      return;
    }

    // Process each XML file
    xmlFiles.forEach(file => {
      const fileId = Math.random().toString(36).substr(2, 9);
      
      // Add file to state with uploading status
      setUploadedFiles(prev => [...prev, {
        id: fileId,
        name: file.name,
        size: file.size,
        status: 'uploading',
        progress: 0
      }]);

      // Read file content
      const reader = new FileReader();
      reader.onload = async (e) => {
        const xmlContent = e.target?.result as string;
        
        // Simulate upload progress
        simulateUploadProgress(fileId, xmlContent);
      };
      
      reader.readAsText(file);
    });
  };

  const simulateUploadProgress = (fileId: string, xmlContent: string) => {
    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setUploadedFiles(prev => prev.map(file => {
        if (file.id === fileId && file.status === 'uploading') {
          const newProgress = Math.min(file.progress + 10, 100);
          if (newProgress === 100) {
            clearInterval(uploadInterval);
            // Start processing
            setTimeout(() => {
              setUploadedFiles(prev => prev.map(f => 
                f.id === fileId ? { 
                  ...f, 
                  status: 'processing', 
                  progress: 0,
                  xmlContent // Store the XML content
                } : f
              ));
              processXML(fileId, xmlContent);
            }, 500);
            return { ...file, progress: newProgress };
          }
          return { ...file, progress: newProgress };
        }
        return file;
      }));
    }, 200);
  };

  const processXML = async (fileId: string, xmlContent: string) => {
    // Simulate processing
    const processingInterval = setInterval(() => {
      setUploadedFiles(prev => prev.map(file => {
        if (file.id === fileId && file.status === 'processing') {
          const newProgress = Math.min(file.progress + 15, 100);
          
          if (newProgress === 100) {
            clearInterval(processingInterval);
            
            // Parse XML and validate
            try {
              const parsedData = parseXML(xmlContent);
              
              // Validate the parsed data
              if (!parsedData.chaveAcesso || !isValidChaveAcesso(parsedData.chaveAcesso)) {
                throw new Error('Chave de acesso inválida ou não encontrada no XML');
              }
              
              if (!isChaveAcessoUnique(parsedData.chaveAcesso)) {
                throw new Error('Este documento já foi importado anteriormente');
              }
              
              // Update file status to success with parsed data
              setTimeout(() => {
                setUploadedFiles(prev => prev.map(f => 
                  f.id === fileId ? { 
                    ...f, 
                    status: 'success',
                    parsedData
                  } : f
                ));
              }, 500);
            } catch (error) {
              // Update file status to error
              setTimeout(() => {
                setUploadedFiles(prev => prev.map(f => 
                  f.id === fileId ? { 
                    ...f, 
                    status: 'error',
                    error: (error as Error).message || 'Erro na validação do XML'
                  } : f
                ));
              }, 500);
            }
            
            return { ...file, progress: newProgress };
          }
          
          return { ...file, progress: newProgress };
        }
        return file;
      }));
    }, 300);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <RefreshCw size={16} className="animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <FileText size={16} className="text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusText = (file: UploadedFile) => {
    switch (file.status) {
      case 'uploading':
        return `Enviando... ${file.progress}%`;
      case 'processing':
        return `Processando... ${file.progress}%`;
      case 'success':
        return 'Processado com sucesso';
      case 'error':
        return file.error || 'Erro no processamento';
      default:
        return 'Aguardando';
    }
  };

  const handleCompleteImport = () => {
    // Save all successfully processed files to the database
    const successFiles = uploadedFiles.filter(f => f.status === 'success');
    
    if (successFiles.length === 0) {
      alert('Nenhum arquivo foi processado com sucesso para importação.');
      return;
    }
    
    // Add each document to the database
    successFiles.forEach(file => {
      if (file.parsedData && file.xmlContent) {
        // Add the XML content to the document data
        const documentData = {
          ...file.parsedData,
          xmlContent: file.xmlContent
        };
        
        // Add to database
        addElectronicDocument(documentData as any);
      }
    });
    
    alert(`${successFiles.length} documento(s) importado(s) com sucesso!`);
    onUploadComplete();
  };

  const successCount = uploadedFiles.filter(f => f.status === 'success').length;
  const errorCount = uploadedFiles.filter(f => f.status === 'error').length;
  const processingCount = uploadedFiles.filter(f => f.status === 'uploading' || f.status === 'processing').length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Voltar para Documentos Eletrônicos</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Importar XMLs</h1>
        <p className="text-gray-600 dark:text-gray-400">Faça upload de arquivos XML de NFe (modelo 55) e CTe (modelo 57)</p>
      </div>

      <div className="space-y-6">
        {/* Upload Area */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Arraste e solte seus arquivos XML aqui
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
              accept=".xml"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Apenas arquivos XML são aceitos. Tamanho máximo: 10MB por arquivo.
            </p>
          </div>
        </div>

        {/* Statistics */}
        {uploadedFiles.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status do Processamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{uploadedFiles.length}</p>
                <p className="text-sm text-blue-700">Total de Arquivos</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{processingCount}</p>
                <p className="text-sm text-yellow-700">Processando</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{successCount}</p>
                <p className="text-sm text-green-700">Processados</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                <p className="text-sm text-red-700">Com Erro</p>
              </div>
            </div>
          </div>
        )}

        {/* Files List */}
        {uploadedFiles.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Arquivos Enviados</h3>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    {getStatusIcon(file.status)}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{getStatusText(file)}</span>
                      </div>
                      {(file.status === 'uploading' || file.status === 'processing') && (
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                      {file.status === 'error' && file.error && (
                        <p className="text-sm text-red-600 mt-1">{file.error}</p>
                      )}
                      {file.status === 'success' && file.parsedData && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          <p>Tipo: {file.parsedData.tipo} - Modelo: {file.parsedData.modelo}</p>
                          <p>Número: {file.parsedData.numeroDocumento} - Série: {file.parsedData.serie}</p>
                          <p className="truncate">Chave: {file.parsedData.chaveAcesso}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {uploadedFiles.length > 0 && processingCount === 0 && (
          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCompleteImport}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Concluir Importação
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Instruções de Importação</h3>
          <div className="text-blue-800 space-y-2">
            <p>• <strong>Formatos aceitos:</strong> Apenas arquivos XML de NFe (modelo 55) e CTe (modelo 57)</p>
            <p>• <strong>Validação:</strong> Os XMLs são validados automaticamente com a SEFAZ</p>
            <p>• <strong>Processamento:</strong> Extração automática de dados fiscais e logísticos</p>
            <p>• <strong>Integração:</strong> Documentos processados ficam disponíveis para vinculação com entregas</p>
            <p>• <strong>Geração:</strong> DANFE e DACTE podem ser gerados automaticamente após o processamento</p>
            <p>• <strong>Armazenamento:</strong> O conteúdo XML completo é armazenado para consultas futuras</p>
          </div>
        </div>
      </div>
    </div>
  );
};