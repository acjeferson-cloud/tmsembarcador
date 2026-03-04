import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info, DollarSign, Users, FileText, Package, Upload, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { parseNFeXml, importNFeToDatabase, NFeXmlData } from '../../services/nfeXmlService';
import { carriersService } from '../../services/carriersService';

interface InvoiceFormProps {
  onBack: () => void;
  onSave: () => void;
  establishmentId: string;
  establishmentName: string;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  onBack,
  onSave,
  establishmentId,
  establishmentName
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'customer' | 'products' | 'values'>('basic');
  const [carriers, setCarriers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [xmlData, setXmlData] = useState<NFeXmlData | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [formData, setFormData] = useState({
    establishment_id: establishmentId,
    carrier_id: '',
    invoice_type: 'Saída',
    number: '',
    series: '',
    access_key: '',
    issue_date: '',
    entry_date: new Date().toISOString().split('T')[0],
    delivery_forecast_date: '',
    operation_nature: '',
    order_number: '',
    weight: 0,
    volumes: 0,
    total_value: 0,
    invoice_value: 0,
    freight_value: 0,
    pis_value: 0,
    cofins_value: 0,
    icms_value: 0,
    status: 'Validada',
    observations: ''
  });

  const [customerData, setCustomerData] = useState({
    name: '',
    cnpj: '',
    state_registration: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Brasil',
    phone: '',
    email: ''
  });

  const [products, setProducts] = useState<Array<{
    item_order: number;
    product_code: string;
    description: string;
    quantity: number;
    unit: string;
    unit_value: number;
    total_value: number;
    ncm: string;
    ean: string;
  }>>([]);

  useEffect(() => {
    loadCarriers();
  }, []);

  const loadCarriers = async () => {
    try {
      const data = await carriersService.getAll();
      setCarriers(data);
    } catch (error) {
      console.error('Erro ao carregar transportadores:', error);
    }
  };

  useEffect(() => {
    if (xmlData) {
      setFormData({
        establishment_id: establishmentId,
        carrier_id: '',
        invoice_type: xmlData.invoiceType,
        number: xmlData.number,
        series: xmlData.series,
        access_key: xmlData.accessKey,
        issue_date: xmlData.issueDate.split('T')[0],
        entry_date: new Date().toISOString().split('T')[0],
        delivery_forecast_date: xmlData.deliveryForecastDate ? xmlData.deliveryForecastDate.split('T')[0] : '',
        operation_nature: xmlData.operationNature,
        order_number: xmlData.orderNumber || '',
        weight: xmlData.weight,
        volumes: xmlData.volumes,
        total_value: xmlData.totalValue,
        invoice_value: xmlData.totalValue,
        freight_value: 0,
        pis_value: xmlData.pisValue,
        cofins_value: xmlData.cofinsValue,
        icms_value: xmlData.icmsValue,
        status: xmlData.status,
        observations: ''
      });

      setCustomerData({
        name: xmlData.customer.name,
        cnpj: xmlData.customer.cnpj,
        state_registration: xmlData.customer.stateRegistration || '',
        address: xmlData.customer.address,
        number: xmlData.customer.number,
        complement: xmlData.customer.complement || '',
        neighborhood: xmlData.customer.neighborhood,
        city: xmlData.customer.city,
        state: xmlData.customer.state,
        zip_code: xmlData.customer.zipCode,
        country: xmlData.customer.country,
        phone: xmlData.customer.phone || '',
        email: xmlData.customer.email || ''
      });

      setProducts(xmlData.products.map(p => ({
        item_order: p.itemOrder,
        product_code: p.productCode,
        description: p.description,
        quantity: p.quantity,
        unit: p.unit,
        unit_value: p.unitValue,
        total_value: p.totalValue,
        ncm: p.ncm,
        ean: p.ean
      })));
    }
  }, [xmlData, establishmentId]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const xmlString = e.target?.result as string;
      const parsed = parseNFeXml(xmlString);

      if (parsed) {
        setXmlData(parsed);
        setSuccess('XML importado com sucesso!');
        setError('');
        setActiveTab('basic');
      } else {
        setError('Erro ao importar XML. Verifique o formato do arquivo.');
        setSuccess('');
      }
    };
    reader.readAsText(file);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!xmlData) {
      setError('Por favor, importe um XML antes de salvar.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await importNFeToDatabase(xmlData, establishmentId);

      if (result.success) {
        setSuccess('Nota Fiscal importada com sucesso!');
        setTimeout(() => onSave(), 1500);
      } else {
        setError(result.error || 'Erro ao salvar nota fiscal.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar nota fiscal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nova Nota Fiscal</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{establishmentName}</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !xmlData}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>{isSubmitting ? 'Salvando...' : 'Salvar Nota Fiscal'}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Upload className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Importar XML da NF-e</h3>
        </div>

        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <FileText className="w-10 h-10 text-gray-400 mb-3" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Clique para selecionar</span> ou arraste o arquivo XML
            </p>
            <p className="text-xs text-gray-400">XML da NF-e (formato padrão da SEFAZ)</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".xml"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'basic'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Info size={16} />
                    <span>Dados Básicos</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('customer')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'customer'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Users size={16} />
                    <span>Cliente</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'products'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Package size={16} />
                    <span>Produtos ({products.length})</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('values')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'values'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <DollarSign size={16} />
                    <span>Valores</span>
                  </div>
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  {!xmlData && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-800">
                        <strong>Aguardando importação do XML:</strong> Faça upload do arquivo XML da NF-e acima para preencher automaticamente os campos.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estabelecimento
                      </label>
                      <input
                        type="text"
                        value={establishmentName}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo da NF-e *
                      </label>
                      <input
                        type="text"
                        value={formData.invoice_type}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Número *
                      </label>
                      <input
                        type="text"
                        value={formData.number}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Série *
                      </label>
                      <input
                        type="text"
                        value={formData.series}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Chave de Acesso
                      </label>
                      <input
                        type="text"
                        value={formData.access_key}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data de Emissão
                      </label>
                      <input
                        type="date"
                        value={formData.issue_date}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data de Entrada
                      </label>
                      <input
                        type="date"
                        value={formData.entry_date}
                        onChange={(e) => handleInputChange('entry_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Previsão de Entrega
                      </label>
                      <input
                        type="date"
                        value={formData.delivery_forecast_date}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Natureza da Operação
                      </label>
                      <input
                        type="text"
                        value={formData.operation_nature}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Número do Pedido
                      </label>
                      <input
                        type="text"
                        value={formData.order_number}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        value={formData.weight}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Volumes
                      </label>
                      <input
                        type="number"
                        value={formData.volumes}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <input
                        type="text"
                        value={formData.status}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Transportador
                      </label>
                      <select
                        value={formData.carrier_id}
                        onChange={(e) => handleInputChange('carrier_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione um transportador</option>
                        {carriers.map((carrier) => (
                          <option key={carrier.id} value={carrier.id}>
                            {carrier.codigo} - {carrier.razao_social}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Observações
                      </label>
                      <textarea
                        value={formData.observations}
                        onChange={(e) => handleInputChange('observations', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Observações adicionais sobre a nota fiscal..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'customer' && (
                <div className="space-y-6">
                  {!xmlData && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-800">
                        <strong>Aguardando importação do XML:</strong> Os dados do cliente serão preenchidos automaticamente após o upload do XML.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome / Razão Social
                      </label>
                      <input
                        type="text"
                        value={customerData.name}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CNPJ
                      </label>
                      <input
                        type="text"
                        value={customerData.cnpj}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Inscrição Estadual
                      </label>
                      <input
                        type="text"
                        value={customerData.state_registration}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Endereço
                      </label>
                      <input
                        type="text"
                        value={customerData.address}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Número
                      </label>
                      <input
                        type="text"
                        value={customerData.number}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={customerData.complement}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={customerData.neighborhood}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={customerData.city}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estado
                      </label>
                      <input
                        type="text"
                        value={customerData.state}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={customerData.zip_code}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        País
                      </label>
                      <input
                        type="text"
                        value={customerData.country}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={customerData.phone}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="text"
                        value={customerData.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div className="space-y-4">
                  {!xmlData ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Aguardando importação do XML:</strong> A lista de produtos será exibida após o upload do XML da NF-e.
                      </p>
                    </div>
                  ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ordem</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Código</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Descrição</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Qtd</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Unid.</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Valor Unit.</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Valor Total</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">NCM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product, index) => (
                          <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-900">
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{product.item_order}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{product.product_code}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{product.description}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white text-right">{product.quantity}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white text-center">{product.unit}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white text-right">{formatCurrency(product.unit_value)}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-semibold text-right">{formatCurrency(product.total_value)}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white text-center">{product.ncm}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 bg-gray-50 dark:bg-gray-900">
                          <td colSpan={6} className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                            Total dos Produtos:
                          </td>
                          <td className="py-3 px-4 text-sm font-bold text-gray-900 dark:text-white text-right">
                            {formatCurrency(products.reduce((sum, p) => sum + p.total_value, 0))}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  )}
                </div>
              )}

              {activeTab === 'values' && (
                <div className="space-y-6">
                  {!xmlData && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-800">
                        <strong>Aguardando importação do XML:</strong> Os valores e impostos da NF-e serão preenchidos após o upload do XML.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          Valor Total da NF-e
                        </label>
                        <div className="text-3xl font-bold text-blue-900">
                          {formatCurrency(formData.total_value)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor dos Produtos
                      </label>
                      <input
                        type="text"
                        value={formatCurrency(formData.invoice_value)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor do Frete
                      </label>
                      <input
                        type="number"
                        value={formData.freight_value}
                        onChange={(e) => handleInputChange('freight_value', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Peso Total (kg)
                      </label>
                      <input
                        type="text"
                        value={formData.weight}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div className="col-span-3">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 mt-4">Impostos</h4>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor de ICMS
                      </label>
                      <input
                        type="text"
                        value={formatCurrency(formData.icms_value)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor de PIS
                      </label>
                      <input
                        type="text"
                        value={formatCurrency(formData.pis_value)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor de COFINS
                      </label>
                      <input
                        type="text"
                        value={formatCurrency(formData.cofins_value)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
      </div>
    </div>
  );
};
