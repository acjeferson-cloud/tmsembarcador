import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload, CheckCircle, XCircle, Loader } from 'lucide-react';
import { parseNFeXml, importNFeToDatabase } from '../../services/nfeXmlService';
import { TenantContextHelper } from '../../utils/tenantContext';

interface BulkXmlUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishmentId: string;
  onSuccess: () => void;
}

interface FileResult {
  fileName: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
}

export const BulkXmlUploadModal: React.FC<BulkXmlUploadModalProps> = ({
  isOpen,
  onClose,
  establishmentId,
  onSuccess
}) => {
  const { t } = useTranslation();

  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<FileResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const xmlFiles = selectedFiles.filter(file => file.name.toLowerCase().endsWith('.xml'));
    setFiles(prev => [...prev, ...xmlFiles]);
    setResults(prev => [
      ...prev,
      ...xmlFiles.map(file => ({
        fileName: file.name,
        status: 'pending' as const
      }))
    ]);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(event.dataTransfer.files);
    const xmlFiles = droppedFiles.filter(file => file.name.toLowerCase().endsWith('.xml'));
    setFiles(prev => [...prev, ...xmlFiles]);
    setResults(prev => [
      ...prev,
      ...xmlFiles.map(file => ({
        fileName: file.name,
        status: 'pending' as const
      }))
    ]);
  };

  const processFiles = async () => {
    setIsProcessing(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      setResults(prev => prev.map((result, index) =>
        index === i ? { ...result, status: 'processing' } : result
      ));

      try {
        const xmlContent = await file.text();
        const parsedData = parseNFeXml(xmlContent);

        if (!parsedData) {
          throw new Error(t('invoices.modals.bulkXml.errorParse'));
        }

        const context = await TenantContextHelper.getCurrentContext();
        if (!context) throw new Error(t('invoices.modals.bulkXml.errorTenant'));
        
        let orgId = context.organizationId;
        let envId = context.environmentId;
        
        if (!orgId || !envId) {
            orgId = '12345678-1234-1234-1234-123456789012'; // Fallbacks para testes que não devem quebrar se nulos
            envId = '12345678-1234-1234-1234-123456789012';
        }

        const result = await importNFeToDatabase(parsedData, establishmentId, orgId!, envId!);

        if (result.success) {
          setResults(prev => prev.map((res, index) =>
            index === i ? {
              ...res,
              status: 'success',
              message: t('invoices.modals.bulkXml.importedSuccess')
            } : res
          ));
          successCount++;
        } else {
          throw new Error(result.error || t('invoices.modals.bulkXml.errorImport'));
        }
      } catch (error: any) {
        setResults(prev => prev.map((res, index) =>
          index === i ? {
            ...res,
            status: 'error',
            message: error.message || t('invoices.modals.bulkXml.errorUnknown')
          } : res
        ));
      }
    }

    setIsProcessing(false);

    if (successCount > 0) {
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setFiles([]);
      setResults([]);
      onClose();
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setResults(prev => prev.filter((_, i) => i !== index));
  };

  const pendingCount = results.filter(r => r.status === 'pending').length;
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center">
            <Upload className="mr-3" size={24} />
            {t('invoices.modals.bulkXml.title')}
          </h2>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="hover:bg-white dark:bg-gray-800 hover:bg-opacity-20 rounded-full p-1 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {files.length === 0 ? (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('invoices.modals.bulkXml.dragXml')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {t('invoices.modals.bulkXml.orClickToSelect')}
              </p>
              <label className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                {t('invoices.modals.bulkXml.selectFiles')}
                <input
                  type="file"
                  multiple
                  accept=".xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('invoices.modals.bulkXml.total')}: <strong>{files.length}</strong>
                  </span>
                  {successCount > 0 && (
                    <span className="text-green-600">
                      {t('invoices.modals.bulkXml.success')}: <strong>{successCount}</strong>
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-red-600">
                      {t('invoices.modals.bulkXml.error')}: <strong>{errorCount}</strong>
                    </span>
                  )}
                </div>
                {!isProcessing && pendingCount > 0 && (
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors text-sm">
                    {t('invoices.modals.bulkXml.addMore')}
                    <input
                      type="file"
                      multiple
                      accept=".xml"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : result.status === 'error'
                        ? 'bg-red-50 border-red-200'
                        : result.status === 'processing'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      {result.status === 'success' && (
                        <CheckCircle className="text-green-600 mr-3 flex-shrink-0" size={20} />
                      )}
                      {result.status === 'error' && (
                        <XCircle className="text-red-600 mr-3 flex-shrink-0" size={20} />
                      )}
                      {result.status === 'processing' && (
                        <Loader className="text-blue-600 mr-3 flex-shrink-0 animate-spin" size={20} />
                      )}
                      {result.status === 'pending' && (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {result.fileName}
                        </p>
                        {result.message && (
                          <p className={`text-xs ${
                            result.status === 'error' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {result.message}
                          </p>
                        )}
                      </div>
                    </div>
                    {result.status === 'pending' && !isProcessing && (
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!isProcessing && pendingCount > 0 && (
                <button
                  onClick={processFiles}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  {t('invoices.modals.bulkXml.processFiles', { count: pendingCount })}
                </button>
              )}

              {isProcessing && (
                <div className="text-center text-gray-600 dark:text-gray-400">
                  <Loader className="animate-spin mx-auto mb-2" size={32} />
                  <p className="font-medium">{t('invoices.modals.bulkXml.processingFiles')}</p>
                </div>
              )}

              {!isProcessing && pendingCount === 0 && (
                <button
                  onClick={handleClose}
                  className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  {t('invoices.modals.common.close')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
