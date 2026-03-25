import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Upload, Download, FileSpreadsheet, Truck, DollarSign, MapPin, CheckCircle, AlertCircle, Info, Shield, Percent, Settings, Save, Bot } from 'lucide-react';
import { DeployAgent } from '../DeployAgent/DeployAgent';
import { generateERPIntegrationTemplate, processERPIntegrationFile, ERPIntegrationTemplate, generateCarriersTemplate, generateFreightRatesTemplate, generateFreightRateCitiesTemplate, generateAdditionalFeesTemplate } from '../../services/templateService';
import { implementationService } from '../../services/implementationService';
import { carriersService, Carrier } from '../../services/carriersService';
import { freightRatesService, FreightRateTable } from '../../services/freightRatesService';
import { useAuth } from '../../hooks/useAuth';
import { Toast } from '../common/Toast';
import { useTranslation } from 'react-i18next';

interface ImportResult {
  success: boolean;
  message: string;
  recordsProcessed?: number;
  errors?: string[];
}

const ImplementationCenter: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const breadcrumbItems = [
    { label: t('implementationCenter.title'), current: true }
  ];

  const [activeTab, setActiveTab] = useState('deploy-agent');
  const [isLoading, setIsLoading] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'manual'>('percentage');
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [erpIntegrationData, setErpIntegrationData] = useState<ERPIntegrationTemplate[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  // ERP Integration state
  const [selectedERP, setSelectedERP] = useState('');
  const [erpConfig, setErpConfig] = useState({
    serviceLayerAddress: '',
    port: '',
    username: '',
    password: '',
    database: '',
    cteIntegrationType: 'draft',
    cteModel: '',
    invoiceModel: '',
    billingNFeItem: '',
    billingUsage: '',
    billingControlAccount: '',
    outboundNFItem: '',
    cteWithoutNFItem: '',
    cteUsage: '',
    inboundNFControlAccount: '',
    invoiceTransitoryAccount: '',
    nfeXmlNetworkAddress: '',
    fiscalModule: 'skill'
  });
  
  // Freight Adjustment state
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selectedCarrierAdjustment, setSelectedCarrierAdjustment] = useState('');
  const [carrierTables, setCarrierTables] = useState<FreightRateTable[]>([]);
  const [selectedTablesToAdjust, setSelectedTablesToAdjust] = useState<string[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);

  // Carregar configuração ERP do banco ao montar componente
  useEffect(() => {
    loadERPConfig();
    loadCarriers();
  }, []);

  const loadCarriers = async () => {
    try {
      const data = await carriersService.getAll();
      setCarriers(data.filter(c => c.status === 'ativo'));
    } catch (err) {
      console.error('Failed to load active carriers:', err);
    }
  };

  useEffect(() => {
    if (selectedCarrierAdjustment) {
      loadCarrierTables(selectedCarrierAdjustment);
    } else {
      setCarrierTables([]);
      setSelectedTablesToAdjust([]);
    }
  }, [selectedCarrierAdjustment]);

  const loadCarrierTables = async (carrierId: string) => {
    setIsLoadingTables(true);
    try {
      const data = await freightRatesService.getTablesByCarrier(carrierId);
      // Filter active tables or let them adjust inactive ones too? Let's show all tables for precision
      setCarrierTables(data);
      setSelectedTablesToAdjust(['all']);
    } catch (err) {
      console.error('Falha ao carregar tabelas', err);
    } finally {
      setIsLoadingTables(false);
    }
  };

  const loadERPConfig = async () => {
    const config = await implementationService.getERPConfig();
    if (config) {
      setSelectedERP(config.erp_name);
      setErpConfig({
        serviceLayerAddress: config.service_layer_address || '',
        port: config.port || '',
        username: config.username || '',
        password: config.password || '',
        database: config.database || '',
        cteIntegrationType: config.cte_integration_type || 'draft',
        cteModel: config.cte_model || '',
        invoiceModel: config.invoice_model || '',
        billingNFeItem: config.billing_nfe_item || '',
        billingUsage: config.billing_usage || '',
        billingControlAccount: config.billing_control_account || '',
        outboundNFItem: config.outbound_nf_item || '',
        cteWithoutNFItem: config.cte_without_nf_item || '',
        cteUsage: config.cte_usage || '',
        inboundNFControlAccount: config.inbound_nf_control_account || '',
        invoiceTransitoryAccount: config.invoice_transitory_account || '',
        nfeXmlNetworkAddress: config.nfe_xml_network_address || '',
        fiscalModule: config.fiscal_module || 'skill'
      });
    }
  };

  const handleFileUpload = async (file: File, type: string) => {
    if (!user) return;

    setIsUploading(true);
    setImportResults([]);

    try {
      let result;

      switch (type) {
        case 'carriers':
          result = await implementationService.processCarriersImport(file, user.id);
          break;
        case 'freight':
          result = await implementationService.processFreightTablesImport(file, user.id);
          break;
        case 'cities':
          result = await implementationService.processCitiesImport(file, user.id);
          break;
        case 'table-fees':
          result = await implementationService.processTableFeesImport(file, user.id);
          break;
        default:
          result = { success: false, message: t('implementationCenter.messages.unsupportedImport') };
      }

      const importResult: ImportResult = {
        success: result.success,
        message: result.message,
        recordsProcessed: result.recordsProcessed,
        errors: result.errors
      };

      setImportResults([importResult]);
    } catch (error) {
      console.error('Erro durante importação:', error);
      setImportResults([{
        success: false,
        message: t('implementationCenter.messages.processError')
      }]);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = (type: string) => {
    try {
      switch (type) {
        case 'carriers':
          generateCarriersTemplate();
          setToast({ type: 'success', message: t('implementationCenter.imports.carriers.title') + ' - ' + t('implementationCenter.messages.saveSuccess') });
          break;
        case 'freight':
          generateFreightRatesTemplate();
          setToast({ type: 'success', message: t('implementationCenter.imports.freight.title') + ' - ' + t('implementationCenter.messages.saveSuccess') });
          break;
        case 'cities':
          generateFreightRateCitiesTemplate();
          setToast({ type: 'success', message: t('implementationCenter.imports.cities.title') + ' - ' + t('implementationCenter.messages.saveSuccess') });
          break;
        case 'table-fees':
          generateAdditionalFeesTemplate();
          setToast({ type: 'success', message: t('implementationCenter.imports.fees.title') + ' - ' + t('implementationCenter.messages.saveSuccess') });
          break;
        default:
          setToast({ type: 'error', message: t('implementationCenter.messages.unsupportedTemplate') });
      }
    } catch (error) {
      console.error('Erro ao gerar template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setToast({
        type: 'error',
        message: t('implementationCenter.messages.templateError', { error: errorMessage })
      });
    }
  };

  const handleAdjustmentSubmit = async () => {
    if (!user) return;

    setIsUploading(true);

    try {
      const value = adjustmentType === 'percentage' ? parseFloat(adjustmentValue) : null;

      const payloadTables = selectedTablesToAdjust.includes('all') 
        ? carrierTables.map(t => t.id) 
        : selectedTablesToAdjust;

      if (!payloadTables.length) {
        setToast({ type: 'error', message: 'Nenhuma tabela selecionada para reajuste.' });
        setIsUploading(false);
        return;
      }

      const result = await implementationService.applyFreightAdjustment(
        payloadTables,
        adjustmentType,
        value,
        user.id,
        `Reajuste ${adjustmentType === 'percentage' ? `de ${value}%` : 'manual'} aplicado`
      );

      if (result.success) {
        setToast({ type: 'success', message: result.message });
        setAdjustmentValue('');
        setSelectedTablesToAdjust([]);
        setSelectedCarrierAdjustment('');
      } else {
        setToast({ type: 'error', message: result.message });
      }
    } catch (error) {
      console.error('Erro ao aplicar reajuste:', error);
      setToast({ type: 'error', message: t('implementationCenter.messages.adjustError') });
    } finally {
      setIsUploading(false);
    }
  };

  const ImportSection = ({ 
    type, 
    title, 
    description, 
    icon: Icon,
    templateName 
  }: {
    type: string;
    title: string;
    description: string;
    icon: React.ElementType;
    templateName: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Download Template */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <div>
            <p className="font-medium text-gray-900 dark:text-white">{t('implementationCenter.imports.templateExcel')}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{templateName}</p>
          </div>
        </div>
        <button
          onClick={() => downloadTemplate(type)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          {t('implementationCenter.imports.downloadTemplate')}
        </button>
      </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">{t('implementationCenter.imports.dragDrop')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('implementationCenter.imports.acceptedFormats')}</p>
          
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, type);
            }}
            className="hidden"
            id={`file-${type}`}
          />
          <label
            htmlFor={`file-${type}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4" />
            Selecionar Arquivo
          </label>
        </div>

        {/* Loading State */}
        {isUploading && (
          <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-700">Processando importação...</span>
          </div>
        )}

        {/* Results */}
        {importResults && importResults.length > 0 && (
          <div className={`p-4 rounded-lg ${importResults[0].success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {importResults[0].success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${importResults[0].success ? 'text-green-800' : 'text-red-800'}`}>
                {importResults[0].message}
              </span>
            </div>
            
            {importResults[0].recordsProcessed && (
              <p className={`text-sm ${importResults[0].success ? 'text-green-700' : 'text-red-700'}`}>
                Registros processados: {importResults[0].recordsProcessed}
              </p>
            )}
            
            {importResults[0].errors && importResults[0].errors.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-red-800 mb-1">Erros encontrados:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {importResults[0].errors.map((error, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-red-500">•</span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderAdjustmentSection = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">{t('implementationCenter.adjustment.infoTitle')}</h4>
            <p className="text-sm text-blue-700 mt-1">
              {t('implementationCenter.adjustment.infoDesc')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('implementationCenter.adjustment.configTitle')}</h3>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('implementationCenter.adjustment.type')}
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="adjustmentType"
                  value="percentage"
                  checked={adjustmentType === 'percentage'}
                  onChange={(e) => setAdjustmentType(e.target.value as 'percentage' | 'manual')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('implementationCenter.adjustment.typePercentage')}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="adjustmentType"
                  value="manual"
                  checked={adjustmentType === 'manual'}
                  onChange={(e) => setAdjustmentType(e.target.value as 'percentage' | 'manual')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('implementationCenter.adjustment.typeManual')}</span>
              </label>
            </div>
          </div>

          {adjustmentType === 'percentage' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Percentual de Reajuste (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder="Ex: 5.5 (aumento) ou -3.2 (redução)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Percent className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use valores positivos para aumento e negativos para redução
              </p>
            </div>
          )}

          {adjustmentType === 'manual' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Arquivo Excel com Novos Valores
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="manual-file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Clique para fazer upload ou arraste o arquivo aqui
                    </span>
                    <input
                      id="manual-file-upload"
                      name="manual-file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'manual');
                      }}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Apenas arquivos Excel (.xlsx, .xls)
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => downloadTemplate('template_novos_valores.xlsx')}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-900"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Template para Novos Valores
              </button>
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Transportadora
            </label>
            <select
              value={selectedCarrierAdjustment}
              onChange={(e) => setSelectedCarrierAdjustment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma transportadora...</option>
              {carriers.map(c => (
                <option key={c.id} value={c.id}>{c.razao_social} {c.fantasia ? `(${c.fantasia})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tabelas a Reajustar {isLoadingTables && <span className="text-xs text-blue-500 ml-2">(Carregando...)</span>}
            </label>
            <select 
              multiple 
              value={selectedTablesToAdjust}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                if (values.includes('all')) {
                  setSelectedTablesToAdjust(['all']);
                } else {
                  setSelectedTablesToAdjust(values.filter(v => v !== 'all'));
                }
              }}
              disabled={!selectedCarrierAdjustment || isLoadingTables || carrierTables.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
            >
              <option value="all" className="font-semibold text-blue-600 border-b border-gray-200 pb-1 mb-1">
                -- Todas as Tabelas da Transportadora --
              </option>
              {carrierTables.map(t => (
                <option key={t.id} value={t.id}>{t.nome} ({t.status})</option>
              ))}
            </select>
            <p className="text-xs text-gray-500">Pressione e segure Ctrl/Cmd para selecionar múltiplas específicas.</p>
          </div>

          <button
            onClick={handleAdjustmentSubmit}
            disabled={isUploading || (adjustmentType === 'percentage' && !adjustmentValue) || !selectedCarrierAdjustment || carrierTables.length === 0}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('implementationCenter.adjustment.submitting')}
              </>
            ) : (
              <>
                <Percent className="w-4 h-4 mr-2" />
                {t('implementationCenter.adjustment.submitBtn')}
              </>
            )}
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('implementationCenter.adjustment.instructions.title')}</h3>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">{t('implementationCenter.adjustment.instructions.percentageTitle')}</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li>• {t('implementationCenter.adjustment.instructions.percentage1')}</li>
                <li>• {t('implementationCenter.adjustment.instructions.percentage2')}</li>
                <li>• {t('implementationCenter.adjustment.instructions.percentage3')}</li>
                <li>• {t('implementationCenter.adjustment.instructions.percentage4')}</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">{t('implementationCenter.adjustment.instructions.manualTitle')}</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li>• {t('implementationCenter.adjustment.instructions.manual1')}</li>
                <li>• {t('implementationCenter.adjustment.instructions.manual2')}</li>
                <li>• {t('implementationCenter.adjustment.instructions.manual3')}</li>
                <li>• {t('implementationCenter.adjustment.instructions.manual4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handleErpConfigChange = (field: string, value: string) => {
    setErpConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveErpConfig = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const result = await implementationService.saveERPConfig({
        erp_name: selectedERP,
        service_layer_address: erpConfig.serviceLayerAddress,
        port: erpConfig.port,
        username: erpConfig.username,
        password: erpConfig.password,
        database: erpConfig.database,
        cte_integration_type: erpConfig.cteIntegrationType,
        cte_model: erpConfig.cteModel,
        invoice_model: erpConfig.invoiceModel,
        billing_nfe_item: erpConfig.billingNFeItem,
        billing_usage: erpConfig.billingUsage,
        billing_control_account: erpConfig.billingControlAccount,
        outbound_nf_item: erpConfig.outboundNFItem,
        cte_without_nf_item: erpConfig.cteWithoutNFItem,
        cte_usage: erpConfig.cteUsage,
        inbound_nf_control_account: erpConfig.inboundNFControlAccount,
        invoice_transitory_account: erpConfig.invoiceTransitoryAccount,
        nfe_xml_network_address: erpConfig.nfeXmlNetworkAddress,
        fiscal_module: erpConfig.fiscalModule,
        is_active: true,
        created_by: user.id
      });

      setImportResults(prev => [...prev, {
        success: result.success,
        message: result.success ? t('implementationCenter.messages.saveSuccess') : result.error || t('implementationCenter.messages.saveError')
      }]);
    } catch (error) {
      console.error('Erro ao salvar configuração ERP:', error);
      setImportResults(prev => [...prev, {
        success: false,
        message: t('implementationCenter.messages.saveError')
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadERPTemplate = () => {
    try {
      generateERPIntegrationTemplate();
    } catch (error) {
      console.error('Erro ao gerar template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setToast({
        type: 'error',
        message: t('implementationCenter.messages.templateError', { error: errorMessage })
      });
    }
  };

  const handleERPFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const data = await processERPIntegrationFile(file);
      setErpIntegrationData(data);
      
      // Preencher formulário com os dados do primeiro registro
      if (data.length > 0) {
        const firstRecord = data[0];
        setSelectedERP(firstRecord.erp_type || '');
        setErpConfig(prev => ({
          ...prev,
          serviceLayerAddress: firstRecord.service_layer_url || '',
          port: firstRecord.port?.toString() || '',
          username: firstRecord.username || '',
          password: firstRecord.password || '',
          database: firstRecord.database || '',
          cteIntegrationType: firstRecord.cte_integration_type || '',
          cteModel: firstRecord.cte_numeric_model_1 || '',
          invoiceModel: firstRecord.cte_numeric_model_2 || '',
          billingNFeItem: firstRecord.billing_item_code || '',
          billingUsage: firstRecord.billing_usage || '',
          billingControlAccount: firstRecord.billing_control_account || '',
          outboundNFItem: firstRecord.nf_output_series || '',
          cteWithoutNFItem: firstRecord.nf_input_series || '',
          cteUsage: firstRecord.nf_input_account || '',
          inboundNFControlAccount: firstRecord.nf_output_account || '',
          invoiceTransitoryAccount: firstRecord.xml_address || '',
          nfeXmlNetworkAddress: firstRecord.fiscal_module || '',
          fiscalModule: firstRecord.fiscal_module || ''
        }));
      }
      
      setToast({ type: 'success', message: t('implementationCenter.messages.importSuccessAlert', { count: data.length }) });
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setToast({ type: 'error', message: t('implementationCenter.messages.importErrorAlert', { error: (error as Error).message }) });
    } finally {
      setIsLoading(false);
      // Limpar input
      event.target.value = '';
    }
  };

  const tabs = [
    {
      id: 'deploy-agent',
      label: t('implementationCenter.deployAgent.title'),
      icon: Bot,
      description: t('implementationCenter.deployAgent.description')
    },
    {
      id: 'erp-integration',
      label: t('implementationCenter.erpIntegration.configTitle'),
      icon: Settings,
      description: t('implementationCenter.tabs.erpIntegration')
    },
    { id: 'carriers', label: 'Transportadoras', icon: Truck },
    { id: 'freight', label: 'Tabelas de Frete', icon: DollarSign },
    { id: 'cities', label: 'Cidades', icon: MapPin },
    { id: 'table-fees', label: 'Taxas da Tabela', icon: FileSpreadsheet },
    { id: 'restricted-ceps', label: 'CEPs Restritos', icon: Shield },
    { id: 'adjust-tables', label: 'Reajustar Tabelas', icon: Percent }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Centro de Implementação</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Importe dados e gerencie configurações em massa para acelerar a implementação
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4 flex-shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

        {/* Deploy Agent IA Tab */}
        {activeTab === 'deploy-agent' && (
          <DeployAgent />
        )}

        {/* ERP Integration Tab */}
        {activeTab === 'erp-integration' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuração de Integração ERP</h3>
              </div>

              {/* Template Download/Upload Section */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{t('implementationCenter.erpIntegration.template.title')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('implementationCenter.erpIntegration.template.description')}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadERPTemplate}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {t('implementationCenter.erpIntegration.template.downloadBtn')}
                    </button>
                    <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {t('implementationCenter.erpIntegration.template.importBtn')}
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleERPFileUpload}
                        className="hidden"
                        disabled={isLoading}
                      />
                    </label>
                  </div>
                </div>

                {isLoading && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-blue-700">{t('implementationCenter.erpIntegration.template.processing')}</span>
                    </div>
                  </div>
                )}

                {erpIntegrationData.length > 0 && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-700 font-medium">
                        {t('implementationCenter.erpIntegration.template.success')}
                      </span>
                    </div>
                    <p className="text-green-600 text-sm">
                      {t('implementationCenter.erpIntegration.template.successDesc', { count: erpIntegrationData.length })}
                    </p>
                  </div>
                )}
              </div>

              {/* ERP Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('implementationCenter.erpIntegration.selectErp')}
                </label>
                <select
                  value={selectedERP}
                  onChange={(e) => setSelectedERP(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('implementationCenter.erpIntegration.selectErpPlaceholder')}</option>
                  <option value="sap-business-one">SAP - Business One</option>
                  <option value="sap-s4hana">SAP - S/4 Hana Cloud Public Edition</option>
                  <option value="totvs-protheus">TOTVS - Protheus</option>
                  <option value="oracle-netsuite">ORACLE - NetSuite</option>
                  <option value="microsoft-dynamics-365">MICROSOFT - Dynamics 365</option>
                  <option value="senior-erp">SENIOR - Senior ERP</option>
                  <option value="sankhya-erp">SANKHYA - Sankhya ERP</option>
                </select>
              </div>

              {/* SAP Business One Configuration */}
              {selectedERP === 'sap-business-one' && (
                <div className="space-y-6">
                  {/* Connection Settings */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      Configurações de Conexão
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.connection.serviceLayerAddress')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.serviceLayerAddress}
                          onChange={(e) => handleErpConfigChange('serviceLayerAddress', e.target.value)}
                          placeholder="https://servidor:porta/b1s/v1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.connection.port')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.port}
                          onChange={(e) => handleErpConfigChange('port', e.target.value)}
                          placeholder="50000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.connection.username')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.username}
                          onChange={(e) => handleErpConfigChange('username', e.target.value)}
                          placeholder="manager"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.connection.password')}
                        </label>
                        <input
                          type="password"
                          value={erpConfig.password}
                          onChange={(e) => handleErpConfigChange('password', e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.connection.database')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.database}
                          onChange={(e) => handleErpConfigChange('database', e.target.value)}
                          placeholder="SBODEMOBR"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CT-e Configuration */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                      {t('implementationCenter.erpIntegration.cte.title')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.cte.integrationType')}
                        </label>
                        <select
                          value={erpConfig.cteIntegrationType}
                          onChange={(e) => handleErpConfigChange('cteIntegrationType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="draft">{t('implementationCenter.erpIntegration.cte.typeDraft')}</option>
                          <option value="entry">{t('implementationCenter.erpIntegration.cte.typeEntry')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.cte.cteModel')}
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="99"
                          value={erpConfig.cteModel}
                          onChange={(e) => handleErpConfigChange('cteModel', e.target.value)}
                          placeholder="57"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.cte.invoiceModel')}
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="99"
                          value={erpConfig.invoiceModel}
                          onChange={(e) => handleErpConfigChange('invoiceModel', e.target.value)}
                          placeholder="55"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Billing Configuration */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      {t('implementationCenter.erpIntegration.billing.title')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.billing.nfeItem')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.billingNFeItem}
                          onChange={(e) => handleErpConfigChange('billingNFeItem', e.target.value)}
                          placeholder="FRETE"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.billing.usage')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.billingUsage}
                          onChange={(e) => handleErpConfigChange('billingUsage', e.target.value)}
                          placeholder="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.billing.controlAccount')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.billingControlAccount}
                          onChange={(e) => handleErpConfigChange('billingControlAccount', e.target.value)}
                          placeholder="1.1.01.001"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Invoice Configuration */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                      {t('implementationCenter.erpIntegration.invoice.title')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.invoice.outboundItem')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.outboundNFItem}
                          onChange={(e) => handleErpConfigChange('outboundNFItem', e.target.value)}
                          placeholder="SERVICO"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.invoice.cteWithoutNfItem')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.cteWithoutNFItem}
                          onChange={(e) => handleErpConfigChange('cteWithoutNFItem', e.target.value)}
                          placeholder="CTE-SEM-NF"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.invoice.cteUsage')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.cteUsage}
                          onChange={(e) => handleErpConfigChange('cteUsage', e.target.value)}
                          placeholder="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.invoice.inboundControlAccount')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.inboundNFControlAccount}
                          onChange={(e) => handleErpConfigChange('inboundNFControlAccount', e.target.value)}
                          placeholder="2.1.01.001"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.invoice.transitoryAccount')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.invoiceTransitoryAccount}
                          onChange={(e) => handleErpConfigChange('invoiceTransitoryAccount', e.target.value)}
                          placeholder="1.1.02.001"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Configuration */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      {t('implementationCenter.erpIntegration.additional.title')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('implementationCenter.erpIntegration.additional.nfeXmlAddress')}
                        </label>
                        <input
                          type="text"
                          value={erpConfig.nfeXmlNetworkAddress}
                          onChange={(e) => handleErpConfigChange('nfeXmlNetworkAddress', e.target.value)}
                          placeholder="\\servidor\xmls\nfe"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Módulo Fiscal
                        </label>
                        <select
                          value={erpConfig.fiscalModule}
                          onChange={(e) => handleErpConfigChange('fiscalModule', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="skill">SKILL - Triple One</option>
                          <option value="invent">INVENT - TaxPlus</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleSaveErpConfig}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          {t('implementationCenter.erpIntegration.saveBtnLoading')}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {t('implementationCenter.erpIntegration.saveBtn')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Import Configuration */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  {t('implementationCenter.erpIntegration.importConfig.title')}
                </h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:bg-gray-700 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          {t('implementationCenter.erpIntegration.importConfig.clickToUpload')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('implementationCenter.imports.acceptedFormats')}</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'erp-integration')}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      <div className="space-y-6">
        {activeTab === 'carriers' && (
          <ImportSection
            type="carriers"
            title={t('implementationCenter.imports.carriers.title')}
            description={t('implementationCenter.imports.carriers.description')}
            icon={Truck}
            templateName="template_transportadoras.xlsx"
          />
        )}

        {activeTab === 'freight' && (
          <ImportSection
            type="freight-tables"
            title={t('implementationCenter.imports.freightTables.title')}
            description={t('implementationCenter.imports.freightTables.description')}
            icon={DollarSign}
            templateName="template_tabelas_frete.xlsx"
          />
        )}

        {activeTab === 'cities' && (
          <ImportSection
            type="cities"
            title={t('implementationCenter.imports.cities.title')}
            description={t('implementationCenter.imports.cities.description')}
            icon={MapPin}
            templateName="template_cidades.xlsx"
          />
        )}

        {activeTab === 'table-fees' && (
          <ImportSection
            type="table-fees"
            title={t('implementationCenter.imports.tableFees.title')}
            description={t('implementationCenter.imports.tableFees.description')}
            icon={FileSpreadsheet}
            templateName="template_taxas_tabela.xlsx"
          />
        )}

        {activeTab === 'restricted-ceps' && (
          <ImportSection
            type="restricted-ceps"
            title={t('implementationCenter.imports.restrictedCeps.title')}
            description={t('implementationCenter.imports.restrictedCeps.description')}
            icon={Shield}
            templateName="template_ceps_restritos.xlsx"
          />
        )}

        {activeTab === 'adjust-tables' && renderAdjustmentSection()}
      </div>

      {/* Instructions Deploy Agent*/}
      {activeTab === 'deploy-agent' && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">{t('implementationCenter.deployAgent.uploader.howItWorks.title')}</h3>
          <div className="space-y-2 text-blue-800">
            <p>• <strong>1.</strong> {t('implementationCenter.deployAgent.uploader.howItWorks.item1')}</p>
            <p>• <strong>2.</strong> {t('implementationCenter.deployAgent.uploader.howItWorks.item2')}</p>
            <p>• <strong>3.</strong> {t('implementationCenter.deployAgent.uploader.howItWorks.item3')}</p>
            <p>• <strong>4.</strong> {t('implementationCenter.deployAgent.uploader.howItWorks.item4')}</p>
            <p>• <strong>5.</strong> {t('implementationCenter.deployAgent.uploader.howItWorks.item5')}</p>
          </div>
        </div>
      )}

      {/* Toast Messages */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};


export { ImplementationCenter };