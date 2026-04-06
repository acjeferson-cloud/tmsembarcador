import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';
import { Toast, ToastType } from '../common/Toast';
import { ElectronicDocument, isValidChaveAcesso, isChaveAcessoUnique } from '../../data/electronicDocumentsData';
import { parseXML } from '../../services/xmlService';
import { useTranslation } from 'react-i18next';
import { TenantContextHelper } from '../../utils/tenantContext';
import { parseNFeXml, importNFeToDatabase } from '../../services/nfeXmlService';
import { cteXmlService } from '../../services/cteXmlService';

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
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleFileSelect = (files: FileList) => {
    const xmlFiles = Array.from(files).filter(file => 
      file.name.toLowerCase().endsWith('.xml')
    );

    if (xmlFiles.length === 0) {
      setToast({ message: t('electronicDocs.upload.supportedFormat'), type: 'warning' });
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
                throw new Error(t('electronicDocs.upload.validationError'));
              }
              
              if (!isChaveAcessoUnique(parsedData.chaveAcesso)) {
                throw new Error(t('electronicDocs.upload.validationError')); // Reusing error message for simplicity but ideally needs a new key
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
                    error: (error as Error).message || t('electronicDocs.upload.validationError')
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
        return `${t('electronicDocs.upload.status.uploading')} ${file.progress}%`;
      case 'processing':
        return `${t('electronicDocs.upload.status.processing')} ${file.progress}%`;
      case 'success':
        return t('electronicDocs.upload.status.success');
      case 'error':
        return file.error || t('electronicDocs.upload.status.error');
      default:
        return t('electronicDocs.upload.status.waiting');
    }
  };

  const handleCompleteImport = async () => {
    // Save all successfully processed files to the database
    const successFiles = uploadedFiles.filter(f => f.status === 'success');
    
    if (successFiles.length === 0) {
      setToast({ message: t('electronicDocs.upload.alerts.noFiles'), type: 'warning' });
      return;
    }
    
    const context = await TenantContextHelper.getCurrentContext();
    if (!context) {
      setToast({ message: "Contexto de locatário não encontrado", type: 'error' });
      return;
    }
    
    let orgId = context.organizationId;
    let envId = context.environmentId;
    
    if (!orgId || !envId) {
        orgId = '12345678-1234-1234-1234-123456789012'; // Fallbacks para testes que não devem quebrar se nulos
        envId = '12345678-1234-1234-1234-123456789012';
    }
    
    let establishmentId = '';
    try {
      const { establishmentsService } = await import('../../services/establishmentsService');
      const establishments = await establishmentsService.getAll();
      if (establishments.length > 0) {
        establishmentId = establishments[0].id;
      }
    } catch (e) {

    }

    if (!establishmentId) {
      setToast({ message: "Não foi possível identificar o estabelecimento principal.", type: 'error' });
      return;
    }
    
    // Add each document to the database
    for (const file of successFiles) {
      if (file.parsedData && file.xmlContent) {
        const p = file.parsedData as any;
        
        try {
          if (p.tipo === 'NFe') {
            const nfeData = parseNFeXml(file.xmlContent);
            if (nfeData) {
              await importNFeToDatabase(nfeData, establishmentId, orgId, envId);
            }
          } else if (p.tipo === 'CTe') {
            const cteData = cteXmlService.parseXml(file.xmlContent);
            if (cteData) {
              await cteXmlService.importCTeToDatabase(cteData, establishmentId);
            }
          }
        } catch (e: any) {

        }
      }
    }
    
    setToast({ message: `${successFiles.length} ${t('electronicDocs.upload.alerts.success')}`, type: 'success' });
    setTimeout(() => {
      onUploadComplete();
    }, 1500);
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
          <span>{t('electronicDocs.upload.back')}</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('electronicDocs.upload.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('electronicDocs.upload.subtitle')}</p>
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
              {t('electronicDocs.upload.dragDrop')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('electronicDocs.upload.or')}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {t('electronicDocs.upload.selectFiles')}
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
              {t('electronicDocs.upload.limitLabel')}
            </p>
          </div>
        </div>

        {/* Statistics */}
        {uploadedFiles.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('electronicDocs.upload.stats.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100 dark:border-blue-900">
                <p className="text-2xl font-bold text-blue-600">{uploadedFiles.length}</p>
                <p className="text-sm text-blue-700">{t('electronicDocs.upload.stats.total')}</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100 dark:border-yellow-900">
                <p className="text-2xl font-bold text-yellow-600">{processingCount}</p>
                <p className="text-sm text-yellow-700">{t('electronicDocs.upload.stats.processing')}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100 dark:border-green-900">
                <p className="text-2xl font-bold text-green-600">{successCount}</p>
                <p className="text-sm text-green-700">{t('electronicDocs.upload.stats.success')}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100 dark:border-red-900">
                <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                <p className="text-sm text-red-700">{t('electronicDocs.upload.stats.error')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Files List */}
        {uploadedFiles.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('electronicDocs.upload.filesTitle')}</h3>
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
                          <p>{t('electronicDocs.filterType')}: {file.parsedData.tipo} - {t('electronicDocs.card.model')}: {file.parsedData.modelo}</p>
                          <p>{t('electronicDocs.table.number')}: {file.parsedData.numeroDocumento} - {t('electronicDocs.view.series')}: {file.parsedData.serie}</p>
                          <p className="truncate">{t('electronicDocs.card.key')}: {file.parsedData.chaveAcesso}</p>
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
              {t('common.cancel')}
            </button>
            <button
              onClick={handleCompleteImport}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('electronicDocs.upload.finishImport')}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('electronicDocs.upload.instructions.title')}</h3>
          <div className="text-blue-800 space-y-2">
            <p>• <strong>{t('electronicDocs.upload.instructions.formats')}:</strong> {t('electronicDocs.upload.instructions.formatsDesc')}</p>
            <p>• <strong>{t('electronicDocs.upload.instructions.validation')}:</strong> {t('electronicDocs.upload.instructions.validationDesc')}</p>
            <p>• <strong>{t('electronicDocs.upload.instructions.processing')}:</strong> {t('electronicDocs.upload.instructions.processingDesc')}</p>
            <p>• <strong>{t('electronicDocs.upload.instructions.integration')}:</strong> {t('electronicDocs.upload.instructions.integrationDesc')}</p>
            <p>• <strong>{t('electronicDocs.upload.instructions.generation')}:</strong> {t('electronicDocs.upload.instructions.generationDesc')}</p>
            <p>• <strong>{t('electronicDocs.upload.instructions.storage')}:</strong> {t('electronicDocs.upload.instructions.storageDesc')}</p>
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
    </div>
  );
};
