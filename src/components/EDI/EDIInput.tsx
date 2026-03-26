import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Upload, FileText, CheckCircle, AlertCircle, X, Info, RefreshCw, FileUp, Database } from 'lucide-react';
import { doccobImportService } from '../../services/doccobImportService';
import { Toast, ToastType } from '../common/Toast';
import { TenantContextHelper } from '../../utils/tenantContext';

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
  const { t } = useTranslation();

  const breadcrumbItems = [
    { label: 'EDI' },
    { label: t('ediInbound.pageTitle'), current: true }
  ];

  const [selectedLayout, setSelectedLayout] = useState<EDILayoutType | ''>(() => {
    const preselected = localStorage.getItem('edi-preselected-layout');
    if (preselected) {
      localStorage.removeItem('edi-preselected-layout');
      return preselected as EDILayoutType;
    }
    return '';
  });
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
      setToast({ message: t('ediInbound.messages.onlyTxtAllowed'), type: 'error' });
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
      setToast({ message: t('ediInbound.messages.selectImportTypeFirst'), type: 'warning' });
      return;
    }
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'text/plain' || file.name.endsWith('.txt')
    );
    
    if (droppedFiles.length === 0) {
      setToast({ message: t('ediInbound.messages.dragOnlyTxtAllowed'), type: 'error' });
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
                    ? t('ediInbound.messages.validFile', { layout: selectedLayout }) 
                    : t('ediInbound.messages.invalidFile', { layout: selectedLayout }),
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
        return t('ediInbound.layouts.notfisDesc');
      case 'CONEMB':
        return t('ediInbound.layouts.conembDesc');
      case 'OCOREN':
        return t('ediInbound.layouts.ocorenDesc');
      case 'DOCCOB':
        return t('ediInbound.layouts.doccobDesc');
      default:
        return '';
    }
  };

  const handleProcessAll = async () => {
    if (files.length === 0) {
      setToast({ message: t('ediInbound.messages.noFilesToProcess'), type: 'warning' });
      return;
    }
    
    if (files.some(f => f.status === 'uploading' || f.status === 'validating')) {
      setToast({ message: t('ediInbound.messages.waitProcessing'), type: 'warning' });
      return;
    }
    
    setIsProcessing(true);
    
    const validFiles = files.filter(f => f.status === 'success');
    if (validFiles.length === 0) {
      setToast({ message: t('ediInbound.messages.noValidFilesToProcess'), type: 'error' });
      setIsProcessing(false);
      return;
    }
    
    if (selectedLayout === 'DOCCOB') {
      let totalProcessed = 0;
      let totalCTesLinked = 0;
      let allErrors: string[] = [];

      for (const file of validFiles) {
        const context = await TenantContextHelper.getCurrentContext();
        const result = await doccobImportService.processFile(
          file.content,
          context?.organizationId || undefined,
          context?.environmentId || undefined,
          context?.establishmentId || undefined
        );
        totalProcessed += result.billsProcessed;
        totalCTesLinked += result.ctesLinked;
        if (result.errors && result.errors.length > 0) {
          allErrors = [...allErrors, ...result.errors];
        }
      }

      setIsProcessing(false);
      if (allErrors.length === 0) {
        setToast({ message: t('ediInbound.messages.doccobProcessed', { processed: totalProcessed, linked: totalCTesLinked }), type: 'success' });
      } else {
        setToast({ message: t('ediInbound.messages.doccobProcessedWarnings', { processed: totalProcessed, errors: allErrors.join('\n') }), type: 'warning' });
      }
    } else {
      // Simulate processing for other layout types
      setTimeout(() => {
        setToast({ message: t('ediInbound.messages.simulatedProcessing', { layout: selectedLayout }), type: 'success' });
        setIsProcessing(false);
      }, 2000);
    }
  };

  const exportErrorReport = () => {
    const errorFiles = files.filter(f => f.status === 'error');
    if (errorFiles.length === 0) {
      setToast({ message: t('ediInbound.messages.noErrorsToExport'), type: 'warning' });
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('ediInbound.pageTitle')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('ediInbound.pageSubtitle')}</p>
        </div>
      </div>

      {/* Layout Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('ediInbound.layoutSelection')}</h2>
        
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
              <span className="font-medium text-gray-900 dark:text-white">{t('ediInbound.layouts.notfisTitle')}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('ediInbound.layouts.notfisSubtitle')}</span>
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
              <span className="font-medium text-gray-900 dark:text-white">{t('ediInbound.layouts.conembTitle')}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('ediInbound.layouts.conembSubtitle')}</span>
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
              <span className="font-medium text-gray-900 dark:text-white">{t('ediInbound.layouts.ocorenTitle')}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('ediInbound.layouts.ocorenSubtitle')}</span>
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
              <span className="font-medium text-gray-900 dark:text-white">{t('ediInbound.layouts.doccobTitle')}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('ediInbound.layouts.doccobSubtitle')}</span>
            </label>
          </div>
        </div>
        
        {selectedLayout && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">{t('ediInbound.selectedLayout')}: {selectedLayout}</p>
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('ediInbound.upload.title')}</h2>
          
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
              {t('ediInbound.upload.dragDrop')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('ediInbound.upload.orClick')}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {t('ediInbound.upload.selectFiles')}
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
              {t('ediInbound.upload.requirements')}
            </p>
          </div>
          
          {/* Observations */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('ediInbound.upload.observationsLabel')}
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('ediInbound.upload.observationsPlaceholder')}
            />
          </div>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('ediInbound.stats.title')}</h2>
            <button
               onClick={clearAllFiles}
              className="text-red-600 hover:text-red-800 text-sm flex items-center space-x-1"
            >
              <X size={16} />
              <span>{t('ediInbound.stats.clearAll')}</span>
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('ediInbound.stats.total')}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{files.length}</p>
                </div>
                <FileText size={24} className="text-gray-400" />
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">{t('ediInbound.stats.processing')}</p>
                  <p className="text-2xl font-semibold text-blue-900">{processingCount}</p>
                </div>
                <RefreshCw size={24} className={`text-blue-400 ${processingCount > 0 ? 'animate-spin' : ''}`} />
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">{t('ediInbound.stats.success')}</p>
                  <p className="text-2xl font-semibold text-green-900">{successCount}</p>
                </div>
                <CheckCircle size={24} className="text-green-400" />
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">{t('ediInbound.stats.errors')}</p>
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
                    {t('ediInbound.table.file')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('ediInbound.table.size')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('ediInbound.table.layout')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('ediInbound.table.status')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('ediInbound.table.actions')}
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
                              <span className="text-sm text-blue-600">{t('ediInbound.table.uploading')}</span>
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
                              <span className="text-sm text-blue-600">{t('ediInbound.table.validating')}</span>
                              <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full" 
                                  style={{ width: `${file.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          
                          {file.status === 'success' && (
                            <span className="text-sm text-green-600">{t('ediInbound.table.success')}</span>
                          )}
                          
                          {file.status === 'error' && (
                            <span className="text-sm text-red-600">{file.message || t('ediInbound.table.errorDefault')}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t('ediInbound.table.remove')}
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
                <span>{t('ediInbound.actions.exportReport')}</span>
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
                  <span>{t('ediInbound.actions.processing')}</span>
                </>
              ) : (
                <>
                  <Database size={16} />
                  <span>{t('ediInbound.actions.processFiles')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('ediInbound.about.title')}</h3>
        <p className="text-blue-800 mb-4">
          {t('ediInbound.about.description')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">{t('ediInbound.about.notfisTitle')}</p>
            <p className="text-blue-700">{t('ediInbound.about.notfisDesc')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">{t('ediInbound.about.conembTitle')}</p>
            <p className="text-blue-700">{t('ediInbound.about.conembDesc')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">{t('ediInbound.about.ocorenTitle')}</p>
            <p className="text-blue-700">{t('ediInbound.about.ocorenDesc')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">{t('ediInbound.about.doccobTitle')}</p>
            <p className="text-blue-700">{t('ediInbound.about.doccobDesc')}</p>
          </div>
        </div>
      </div>

      {/* Technical Requirements */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('ediInbound.requirements.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{t('ediInbound.requirements.formats')}</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>{t('ediInbound.requirements.formatTxt')}</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>{t('ediInbound.requirements.formatEncoding')}</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>{t('ediInbound.requirements.formatSize')}</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{t('ediInbound.requirements.processing')}</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>{t('ediInbound.requirements.procValidation')}</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>{t('ediInbound.requirements.procLogs')}</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>{t('ediInbound.requirements.procReport')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};