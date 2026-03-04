import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { deployAgentService } from '../../services/deployAgentService';
import * as XLSX from 'xlsx';

interface DeployUploaderProps {
  projectId: string;
  onClose: () => void;
}

export const DeployUploader: React.FC<DeployUploaderProps> = ({ projectId, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const categories = [
    { value: 'erp_integration', label: 'Integração ao ERP', icon: '🔗' },
    { value: 'carriers', label: 'Transportadoras', icon: '🚚' },
    { value: 'freight_tables', label: 'Tabelas de Fretes', icon: '📊' },
    { value: 'cities', label: 'Cidades', icon: '🏙️' },
    { value: 'fees', label: 'Taxas da Tabela', icon: '💰' },
    { value: 'restricted_zips', label: 'CEPs Restritos', icon: '🚫' },
    { value: 'table_adjustments', label: 'Reajustar Tabela', icon: '📈' }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
      setMessage('');
    }
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;

          if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Read as JSON with headers for better processing
            const json = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: '', // Default value for empty cells
              blankrows: false // Skip blank rows
            });

            // Clean up the data - remove completely empty rows and convert undefined to empty string
            const cleanedJson = json
              .filter((row: any) => Array.isArray(row) && row.some((cell: any) => cell !== '' && cell !== null && cell !== undefined))
              .map((row: any) =>
                Array.isArray(row) ? row.map((cell: any) => cell === null || cell === undefined ? '' : String(cell)) : row
              );

            resolve(JSON.stringify(cleanedJson));
          } else if (file.name.endsWith('.csv')) {
            resolve(data as string);
          } else {
            resolve(data as string);
          }
        } catch (error: any) {
          console.error('Error reading file:', error);
          reject(new Error('Erro ao ler arquivo: ' + (error?.message || 'formato inválido')));
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleUpload = async () => {
    if (!file || !selectedCategory) {
      setStatus('error');
      setMessage('Selecione uma categoria e um arquivo');
      return;
    }

    try {
      setIsUploading(true);
      setStatus('idle');
      setMessage('Enviando arquivo...');

      const fileContent = await readFileContent(file);

      const upload = await deployAgentService.createUpload({
        project_id: projectId,
        file_name: file.name,
        file_type: file.type || 'text/plain',
        file_size: file.size,
        file_content: fileContent,
        data_category: selectedCategory
      });

      setStatus('success');
      setMessage('Arquivo enviado com sucesso!');

      // Start processing
      setIsProcessing(true);
      setMessage('Processando com IA...');

      await deployAgentService.processFile(upload.id);

      setMessage('Processamento concluído!');

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error: any) {
      setStatus('error');
      console.error('Upload error:', error);

      const errorMessage = error?.message || 'Erro ao processar arquivo. Tente novamente.';
      setMessage(errorMessage);

      // Keep error visible longer
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Enviar Arquivo</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              A IA irá interpretar e configurar automaticamente
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading || isProcessing}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Tipo de Dados *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  disabled={isUploading || isProcessing}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedCategory === cat.value
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{cat.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Arquivo *
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                file ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
              }`}
            >
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".xlsx,.xls,.csv,.txt"
                disabled={isUploading || isProcessing}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-purple-600" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">{file.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {(file.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <div className="text-gray-600 dark:text-gray-400">
                      Clique para selecionar ou arraste o arquivo
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Formatos: XLSX, XLS, CSV, TXT
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              status === 'success' ? 'bg-green-50 text-green-800' :
              status === 'error' ? 'bg-red-50 text-red-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              {status === 'success' && <CheckCircle className="w-5 h-5" />}
              {status === 'error' && <AlertCircle className="w-5 h-5" />}
              {status === 'idle' && <Upload className="w-5 h-5 animate-pulse" />}
              <span>{message}</span>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Como funciona?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• A IA identifica a estrutura dos dados automaticamente</li>
              <li>• Valida campos obrigatórios e formatos</li>
              <li>• Mapeia os campos para o banco de dados</li>
              <li>• Detecta erros e sugere melhorias</li>
              <li>• Configura os cadastros automaticamente</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>Modo Desenvolvimento:</strong> Se OpenAI não estiver configurada, usa interpretação mock para demonstração.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            disabled={isUploading || isProcessing}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || !selectedCategory || isUploading || isProcessing}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading || isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isProcessing ? 'Processando...' : 'Enviando...'}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Enviar e Processar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
