import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Info, DollarSign, Users, FileText, Package, Upload, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { parseNFeXml, importNFeToDatabase, NFeXmlData } from '../../services/nfeXmlService';
import { carriersService } from '../../services/carriersService';
import { freightQuoteService } from '../../services/freightQuoteService';
import { invoicesCostService } from '../../services/invoicesCostService';
import { TenantContextHelper } from '../../utils/tenantContext';
import { normalizarCNPJ } from '../../utils/cnpj';
import { useAuth } from '../../hooks/useAuth';

interface InvoiceFormProps {
  invoice?: any;
  onBack: () => void;
  onSave: () => void;
  establishmentId: string;
  establishmentName: string;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  onBack,
  onSave,
  establishmentId,
  establishmentName
}) => {
  const { t } = useTranslation();

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'basic' | 'customer' | 'products' | 'values'>('basic');
  const [carriers, setCarriers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [xmlData, setXmlData] = useState<NFeXmlData | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [formData, setFormData] = useState({
    establishment_id: establishmentId,
    carrier_id: invoice?.carrier_id || '',
    invoice_type: invoice?.invoice_type || 'Saída',
    number: invoice?.number || invoice?.numero || '',
    series: invoice?.series || invoice?.serie || '',
    access_key: invoice?.access_key || invoice?.chave_acesso || '',
    issue_date: invoice?.issue_date ? new Date(invoice.issue_date).toISOString().split('T')[0] : (invoice?.data_emissao ? new Date(invoice.data_emissao).toISOString().split('T')[0] : ''),
    entry_date: invoice?.created_at ? new Date(invoice.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    delivery_forecast_date: invoice?.data_prevista_entrega ? invoice.data_prevista_entrega.split('T')[0] : '',
    operation_nature: invoice?.operation_nature || invoice?.natureza_operacao || '',
    order_serie: invoice?.order_serie || '',
    order_number: invoice?.order_number || invoice?.numero_pedido || '',
    weight: invoice?.weight || 0,
    volumes: invoice?.volumes || 1,
    cubic_meters: invoice?.cubic_meters || 0,
    total_value: invoice?.total_value || invoice?.valor_total || 0,
    invoice_value: invoice?.invoice_value || invoice?.valor_produtos || 0,
    freight_value: 0,
    pis_value: invoice?.pis_value || invoice?.valor_pis || 0,
    cofins_value: invoice?.cofins_value || invoice?.valor_cofins || 0,
    icms_value: invoice?.icms_value || invoice?.valor_icms || 0,
    status: invoice?.status || invoice?.situacao || 'Emitida',
    observations: invoice?.observations || invoice?.observacoes || ''
  });

  const [customerData, setCustomerData] = useState({
    name: invoice?.customer?.razao_social || '',
    cnpj: invoice?.customer?.cnpj_cpf || '',
    state_registration: invoice?.customer?.inscricao_estadual || '',
    address: invoice?.customer?.logradouro || '',
    number: invoice?.customer?.numero || '',
    complement: invoice?.customer?.complemento || '',
    neighborhood: invoice?.customer?.bairro || '',
    city: invoice?.customer?.cidade || '',
    state: invoice?.customer?.estado || '',
    zip_code: invoice?.customer?.cep || '',
    country: 'Brasil',
    phone: invoice?.customer?.telefone || '',
    email: invoice?.customer?.email || ''
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
  }>>(invoice?.products ? invoice.products.map((p: any, idx: number) => ({
    item_order: idx + 1,
    product_code: p.product_code || p.codigo_produto || '',
    description: p.description || p.descricao || '',
    quantity: p.quantity || p.quantidade || 0,
    unit: p.unit || p.unidade || '',
    unit_value: p.unit_value || p.valor_unitario || 0,
    total_value: p.total_value || p.valor_total || 0,
    weight: p.weight || p.peso || 0,
    cubic_meters: p.cubic_meters || p.cubagem || 0,
    ncm: '',
    ean: ''
  })) : []);

  useEffect(() => {
    loadCarriers();
  }, []);

  const loadCarriers = async () => {
    try {
      const data = await carriersService.getAll();
      setCarriers(data);
    } catch (error) {
// null
    }
  };

  useEffect(() => {
    if (xmlData) {
      let matchedCarrierId = '';
      if (xmlData.carrier?.cnpj && carriers.length > 0) {
        const cnpjClean = normalizarCNPJ(xmlData.carrier.cnpj);
        let matched = carriers.find((c: any) => c.cnpj && normalizarCNPJ(c.cnpj) === cnpjClean);
        
        // Se não encontrou o CNPJ exato, tenta pela RAIZ do CNPJ (8 primeiros dígitos)
        if (!matched && cnpjClean.length >= 8) {
          const rootCnpj = cnpjClean.substring(0, 8);
          matched = carriers.find((c: any) => c.cnpj && normalizarCNPJ(c.cnpj).substring(0, 8) === rootCnpj);
        }
        
        if (matched) {
          matchedCarrierId = matched.id;
        }
      }

      setFormData({
        establishment_id: establishmentId,
        carrier_id: matchedCarrierId,
        invoice_type: xmlData.invoiceType,
        number: xmlData.number,
        series: xmlData.series,
        access_key: xmlData.accessKey,
        issue_date: xmlData.issueDate.split('T')[0],
        entry_date: new Date().toISOString().split('T')[0],
        delivery_forecast_date: xmlData.deliveryForecastDate ? xmlData.deliveryForecastDate.split('T')[0] : '',
        operation_nature: xmlData.operationNature,
        order_serie: '',
        order_number: xmlData.orderNumber || '',
        weight: xmlData.weight,
        volumes: xmlData.volumes,
        cubic_meters: 0,
        total_value: xmlData.totalValue,
        invoice_value: xmlData.totalValue,
        freight_value: 0,
        pis_value: xmlData.pisValue,
        cofins_value: xmlData.cofinsValue,
        icms_value: xmlData.icmsValue,
        status: xmlData.status || 'Emitida',
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
        weight: p.weight || 0,
        cubic_meters: p.cubicMeters || 0,
        ncm: p.ncm || '',
        ean: p.ean || ''
      })));
    }
  }, [xmlData, establishmentId, carriers]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const xmlString = e.target?.result as string;
      try {
        const parsed = parseNFeXml(xmlString);
        if (parsed) {
          setXmlData(parsed);
          setSuccess(t('invoices.form.messages.xmlImportSuccess'));
          setError('');
          setActiveTab('basic');
        } else {
          setError(t('invoices.form.messages.xmlImportError'));
          setSuccess('');
        }
      } catch (err: any) {
        setError(err.message || t('invoices.form.messages.xmlImportError'));
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

  const addProduct = () => {
    setProducts([...products, {
      item_order: products.length + 1,
      product_code: '',
      description: '',
      quantity: 1,
      unit: 'UN',
      weight: 0,
      cubic_meters: 0,
      unit_value: 0,
      total_value: 0,
      ncm: '',
      ean: ''
    } as any]);
  };

  const removeProduct = (index: number) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const newProducts = [...products];
    const product = { ...newProducts[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_value') {
      const quantity = field === 'quantity' ? Number(value) : Number(product.quantity || 0);
      const unitValue = field === 'unit_value' ? Number(value) : Number(product.unit_value || 0);
      product.total_value = quantity * unitValue;
    }
    
    newProducts[index] = product;
    setProducts(newProducts);
  };

  const handleSubmit = async () => {
    if (!xmlData && !invoice) {
      setError(t('invoices.form.messages.missingXml'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const context = await TenantContextHelper.getCurrentContext();
      if (!context || !context.organizationId || !context.environmentId) {
        throw new Error('Você perdeu o acesso à sessão atual. Atualize a página e tente novamente.');
      }

      if (invoice) {
        // Modo Edição
        const { supabase } = await import('../../lib/supabase');
        const updateData: any = {};
        if (formData.status !== invoice.situacao && formData.status !== invoice.status) {
            updateData.situacao = formData.status;
        }
        if (formData.carrier_id !== invoice.carrier_id) {
            updateData.carrier_id = formData.carrier_id || null;
        }
        if (formData.delivery_forecast_date) {
            updateData.data_prevista_entrega = formData.delivery_forecast_date;
            updateData.expected_delivery_date = formData.delivery_forecast_date;
        }
        if (formData.order_serie !== invoice.order_serie) {
            updateData.order_serie = formData.order_serie || null;
        }
        if (formData.order_number !== invoice.order_number) {
            updateData.order_number = formData.order_number || null;
        }

        const inputWeight = parseFloat(String(formData.weight).replace(',', '.')) || 0;
        const inputVolumes = parseInt(String(formData.volumes)) || 1;
        const inputCubage = parseFloat(String((formData as any).cubic_meters).replace(',', '.')) || 0;

        if (inputWeight !== (invoice.peso_total || 0)) {
            updateData.peso_total = inputWeight;
        }
        if (inputVolumes !== (invoice.quantidade_volumes || 1)) {
            updateData.quantidade_volumes = inputVolumes;
        }
        if (inputCubage !== (invoice.cubagem_total || 0)) {
            updateData.cubagem_total = inputCubage;
        }
        if (Object.keys(updateData).length > 0) {
            updateData.updated_at = new Date().toISOString();
            if (updateData.situacao) {
              updateData.status_updated_at = new Date().toISOString();
            }
            const { error: updateError } = await (supabase as any)
              .from('invoices_nfe')
              .update(updateData)
              .eq('id', invoice.id);
              
            if (updateError) throw updateError;
        }

        // Recalcular frete se houver produtos e peso (apenas se peso ou valores mudaram, mas faremos sempre no save conforme Pedidos)
        let finalFreightValue = formData.freight_value || 0;
        let bestCarrierId = formData.carrier_id || null;
        let finalFreightResults = invoice.freight_results || [];
        
        const invoiceTotalValue = Number(formData.invoice_value) || Number(formData.total_value) || 0;
        const totalWeight = parseFloat(String(formData.weight).replace(',', '.')) || 0;
        const totalVolume = parseInt(String(formData.volumes)) || 1;
        
        if (totalWeight > 0 && products.length > 0) {
          try {
            if (formData.carrier_id) {
              try {
                const invoiceData = {
                  weight: totalWeight,
                  value: invoiceTotalValue,
                  volume: totalVolume,
                  m3: parseFloat(String((formData as any).cubic_meters).replace(',', '.')) || 0,
                  destinationCity: customerData.city || '',
                  destinationState: customerData.state || '',
                  issueDate: formData.issue_date
                };
                
                const carrierData = await invoicesCostService.getCarrierData(formData.carrier_id);
                if (carrierData) {
                  const calculation = await invoicesCostService.calculateInvoiceCost(invoiceData, formData.carrier_id, formData.issue_date);
                  await invoicesCostService.saveCostsToInvoice(invoice.id, formData.carrier_id, calculation, carrierData);
                  
                  finalFreightValue = calculation.valorTotal;
                  finalFreightResults = [{
                    carrierId: formData.carrier_id,
                    carrierName: carrierData.razao_social,
                    totalValue: calculation.valorTotal,
                    calculationDetails: calculation
                  }];
                  
                  const { error: fError } = await (supabase as any)
                    .from('invoices_nfe')
                    .update({ 
                      carrier_id: formData.carrier_id, 
                      valor_frete: finalFreightValue,
                      freight_results: finalFreightResults
                    })
                    .eq('id', invoice.id);
// /* handled by next rule */
                }
              } catch (err: any) {
// null
                const { TenantContextHelper } = await import('../../utils/tenantContext');
                const context = await TenantContextHelper.getCurrentContext();
                setError(`Aviso de Cálculo: Falha ao associar tabela do transportador. Motivo: ${err.message || JSON.stringify(err)} | Org: ${context?.organizationId} | Env: ${context?.environmentId}`);
                
                finalFreightValue = 0;
                finalFreightResults = [];
                
                await (supabase as any)
                  .from('invoices_nfe')
                  .update({ 
                    carrier_id: formData.carrier_id, 
                    valor_frete: 0,
                    freight_results: []
                  })
                  .eq('id', invoice.id);
              }
            } else {
              const results = await freightQuoteService.calculateQuote(
                {
                  destinationZipCode: customerData.zip_code ? customerData.zip_code.replace(/\D/g, '') : undefined,
                  weight: totalWeight,
                  volumeQty: totalVolume,
                  cubicMeters: parseFloat(String((formData as any).cubic_meters).replace(',', '.')) || 0,
                  cargoValue: invoiceTotalValue,
                  establishmentId: establishmentId,
                  selectedModals: ['rodoviario', 'aereo', 'aquaviario', 'ferroviario']
                },
                user?.supabaseUser?.id,
                user?.name || user?.email,
                user?.email
              );
              
              if (results && results.length > 0) {
                finalFreightResults = results;
                bestCarrierId = results[0].carrierId;
                finalFreightValue = results[0].totalValue;
                
                const { error: fError } = await (supabase as any)
                  .from('invoices_nfe')
                  .update({ 
                    carrier_id: bestCarrierId, 
                    valor_frete: finalFreightValue,
                    freight_results: finalFreightResults
                  })
                  .eq('id', invoice.id);
                  
// /* handled by next rule */
              }
            }
          } catch (freightError) {
// null
          }
        }

        // Atualizar produtos
        if (products.length > 0) {
          // Deleta antigos
          await (supabase as any).from('invoices_nfe_products').delete().eq('invoice_nfe_id', invoice.id);
          // Insere novos
          const productsToInsert = products.map((p, idx) => ({
            invoice_nfe_id: invoice.id,
            organization_id: invoice.organization_id || context.organizationId,
            environment_id: invoice.environment_id || context.environmentId,
            numero_item: idx + 1,
            codigo_produto: p.product_code,
            descricao: p.description,
            quantidade: p.quantity,
            unidade: p.unit,
            peso: Number((p as any).weight) || 0,
            cubagem: Number((p as any).cubic_meters) || 0,
            valor_unitario: Number(p.unit_value) || 0,
            valor_total: p.total_value
          }));
          const { error: prodError } = await (supabase as any).from('invoices_nfe_products').insert(productsToInsert);
          if (prodError) throw prodError;
        }

        // Atualizar Cliente
        if (invoice.customer && invoice.customer.id) {
          const { error: custError } = await (supabase as any)
            .from('invoices_nfe_customers')
            .update({
              razao_social: customerData.name,
              cnpj_cpf: customerData.cnpj,
              inscricao_estadual: customerData.state_registration,
              logradouro: customerData.address,
              numero: customerData.number,
              complemento: customerData.complement,
              bairro: customerData.neighborhood,
              cidade: customerData.city,
              estado: customerData.state,
              cep: customerData.zip_code,
              telefone: customerData.phone,
              email: customerData.email
            })
            .eq('id', invoice.customer.id);
            
          if (custError) throw custError;
        }

        setSuccess(t('invoices.form.messages.updateSuccess'));
        setTimeout(() => onSave(), 1500);
      } else if (xmlData) {
        // Modo Nova (Importação)
        const result = await importNFeToDatabase(
          xmlData, 
          establishmentId, 
          context.organizationId, 
          context.environmentId,
          formData.carrier_id || undefined
        );

        if (result.success) {
          setSuccess(t('invoices.form.messages.importSuccess'));
          setTimeout(() => onSave(), 1500);
        } else {
          setError(result.error || t('invoices.form.messages.saveError'));
        }
      }
    } catch (err: any) {
      setError(err.message || t('invoices.form.messages.saveError'));
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {invoice ? `${t('invoices.form.titleEdit')} ${invoice.numero || ''}` : t('invoices.form.titleNew')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{establishmentName}</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (!xmlData && !invoice)}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Save className="w-5 h-5" />
          <span>{isSubmitting ? t('invoices.form.saving') : t('invoices.form.save')}</span>
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('invoices.form.importXmlTitle')}</h3>
        </div>

        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <FileText className="w-10 h-10 text-gray-400 mb-3" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">{t("invoices.form.clickToSelect")}</span> {t("invoices.form.orDragXml")}
            </p>
            <p className="text-xs text-gray-400">{t("invoices.form.xmlFormatHelper")}</p>
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
                    <span>{t('invoices.form.tabBasic')}</span>
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
                    <span>{t('invoices.form.tabCustomer')}</span>
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
                    <span>{t('invoices.form.tabItems', { count: products.length })}</span>
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
                    <span>{t('invoices.form.tabValues')}</span>
                  </div>
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  {!xmlData && !invoice && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-800">
                        <strong>{t('invoices.form.waitingXml')}:</strong> {t('invoices.form.waitingXmlBasic')}
                      </p>
                    </div>
                  )}
                  {(xmlData || invoice) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.establishment')}
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
                        {t('invoices.form.fields.nfeType')} *
                      </label>
                      <input
                        type="text"
                        value={formData.invoice_type}
                        onChange={(e) => handleInputChange('invoice_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.number')} *
                      </label>
                      <input
                        type="text"
                        value={formData.number}
                        onChange={(e) => handleInputChange('number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.serie')} *
                      </label>
                      <input
                        type="text"
                        value={formData.series}
                        onChange={(e) => handleInputChange('series', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.accessKey')}
                      </label>
                      <input
                        type="text"
                        value={formData.access_key}
                        onChange={(e) => handleInputChange('access_key', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.issueDate')}
                      </label>
                      <input
                        type="date"
                        value={formData.issue_date}
                        onChange={(e) => handleInputChange('issue_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.entryDate')}
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
                        {t('invoices.form.fields.expectedDelivery')}
                      </label>
                      <input
                        type="date"
                        value={formData.delivery_forecast_date}
                        onChange={(e) => handleInputChange('delivery_forecast_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.operationNature')}
                      </label>
                      <input
                        type="text"
                        value={formData.operation_nature}
                        onChange={(e) => handleInputChange('operation_nature', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.orderSerie')}
                      </label>
                      <input
                        type="text"
                        value={formData.order_serie}
                        onChange={(e) => handleInputChange('order_serie', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                        placeholder="Ex: 1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.orderNumber')}
                      </label>
                      <input
                        type="text"
                        value={formData.order_number}
                        onChange={(e) => handleInputChange('order_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                        placeholder="Ex: 123456"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.weightKg')}
                      </label>
                      <input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.volumes')}
                      </label>
                      <input
                        type="number"
                        value={formData.volumes}
                        onChange={(e) => handleInputChange('volumes', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.table.status')}
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Emitida">Emitida</option>
                        <option value="Coletada">Em Coleta</option>
                        <option value="Em trânsito">Em trânsito</option>
                        <option value="Saiu p/ Entrega">Saiu p/ Entrega</option>
                        <option value="Entregue">Entregue</option>
                        <option value="Cancelada">Cancelada</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.carrier')}
                      </label>
                      <select
                        value={formData.carrier_id}
                        onChange={(e) => handleInputChange('carrier_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">{t('invoices.form.selectCarrier')}</option>
                        {carriers.map((carrier) => (
                          <option key={carrier.id} value={carrier.id}>
                            {carrier.codigo} - {carrier.razao_social}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.observations')}
                      </label>
                      <textarea
                        value={formData.observations}
                        onChange={(e) => handleInputChange('observations', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={t("invoices.form.observationsPlaceholder")}
                      />
                    </div>
                  </div>
                  )}
                </div>
              )}

              {activeTab === 'customer' && (
                <div className="space-y-6">
                  {!xmlData && !invoice && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-800">
                        <strong>{t('invoices.form.waitingXml')}:</strong> {t('invoices.form.waitingXmlCustomer')}
                      </p>
                    </div>
                  )}
                  {(xmlData || invoice) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.customerName')} *
                      </label>
                      <input
                        type="text"
                        value={customerData.name}
                        onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={t("invoices.form.placeholders.customerName")}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CNPJ
                      </label>
                      <input
                        type="text"
                        value={customerData.cnpj}
                        onChange={(e) => setCustomerData({...customerData, cnpj: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.stateReg')}
                      </label>
                      <input
                        type="text"
                        value={customerData.state_registration}
                        onChange={(e) => setCustomerData({...customerData, state_registration: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.address')}
                      </label>
                      <input
                        type="text"
                        value={customerData.address}
                        onChange={(e) => setCustomerData({...customerData, address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.addressNumber')}
                      </label>
                      <input
                        type="text"
                        value={customerData.number}
                        onChange={(e) => setCustomerData({...customerData, number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.complement')}
                      </label>
                      <input
                        type="text"
                        value={customerData.complement}
                        onChange={(e) => setCustomerData({...customerData, complement: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.neighborhood')}
                      </label>
                      <input
                        type="text"
                        value={customerData.neighborhood}
                        onChange={(e) => setCustomerData({...customerData, neighborhood: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.city')}
                      </label>
                      <input
                        type="text"
                        value={customerData.city}
                        onChange={(e) => setCustomerData({...customerData, city: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.state')}
                      </label>
                      <input
                        type="text"
                        value={customerData.state}
                        onChange={(e) => setCustomerData({...customerData, state: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.zipCode')}
                      </label>
                      <input
                        type="text"
                        value={customerData.zip_code}
                        onChange={(e) => setCustomerData({...customerData, zip_code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.country')}
                      </label>
                      <input
                        type="text"
                        value={customerData.country}
                        onChange={(e) => setCustomerData({...customerData, country: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.phone')}
                      </label>
                      <input
                        type="text"
                        value={customerData.phone}
                        onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.email')}
                      </label>
                      <input
                        type="text"
                        value={customerData.email}
                        onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  )}
                </div>
              )}

              {activeTab === 'products' && (
                <div className="space-y-4">
                  {!xmlData && !invoice && products.length === 0 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-800">
                        <strong>{t('invoices.form.waitingXml')}:</strong> {t('invoices.form.waitingXmlItems')}
                      </p>
                    </div>
                  ) : (
                  <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('invoices.form.itemsTitle')}</h3>
                    <button
                      onClick={addProduct}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
                    >
                      <span>+ {t('invoices.form.addItem')}</span>
                    </button>
                  </div>

                  {products.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{t('invoices.form.noItemsAdded')}</p>
                      <button
                        onClick={addProduct}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <span>+ {t('invoices.form.addFirstItem')}</span>
                      </button>
                    </div>
                  ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-32">{t('invoices.details.code')}</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[250px]">{t('invoices.details.description')}</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">{t('invoices.details.quantity')}</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">{t('invoices.form.fields.weightKg')}</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-28">{t('invoices.form.fields.cubageM3')}</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-32">{t('invoices.details.unitValue')}</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-32">{t('invoices.details.totalValue')}</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-16">{t('invoices.table.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product, index) => (
                          <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={product.product_code}
                                onChange={(e) => updateProduct(index, 'product_code', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder={t("invoices.details.code")}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={product.description}
                                onChange={(e) => updateProduct(index, 'description', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder={t("invoices.form.placeholders.itemDescription")}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                value={product.quantity}
                                onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                min="0"
                                step="1"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                value={(product as any).weight || 0}
                                onChange={(e) => updateProduct(index, 'weight', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                min="0"
                                step="0.001"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                value={(product as any).cubic_meters || 0}
                                onChange={(e) => updateProduct(index, 'cubic_meters', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                min="0"
                                step="0.0001"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                value={product.unit_value}
                                onChange={(e) => updateProduct(index, 'unit_value', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold text-right">
                              {formatCurrency(product.total_value)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => removeProduct(index)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 bg-gray-50 dark:bg-gray-900">
                          <td colSpan={6} className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                            {t('invoices.details.itemsTotal')}:
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
                  </>
                  )}
                </div>
              )}

              {activeTab === 'values' && (
                <div className="space-y-6">
                  {!xmlData && !invoice && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-800">
                        <strong>{t('invoices.form.waitingXml')}:</strong> {t('invoices.form.waitingXmlValues')}
                      </p>
                    </div>
                  )}
                  {(xmlData || invoice) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          {t('invoices.form.fields.totalNfeValue')}
                        </label>
                        <div className="text-3xl font-bold text-blue-900">
                          {formatCurrency((Number(formData.total_value) || Number(formData.invoice_value) || 0) + Number(formData.freight_value))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.productsValue')}
                      </label>
                      <input
                        type="text"
                        value={formatCurrency(products.reduce((sum, p) => sum + p.total_value, 0))}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900 font-semibold"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('invoices.form.autoCalculated')}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.freightValue')}
                      </label>
                      <input
                        type="number"
                        value={formData.freight_value}
                        onChange={(e) => handleInputChange('freight_value', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">{t('invoices.form.cargoDataFreightLabel')}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('invoices.form.fields.totalWeightKg')}
                          </label>
                          <input
                            type="text"
                            value={formData.weight || ''}
                            onChange={(e) => handleInputChange('weight', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('invoices.form.fields.volumesQty')}
                          </label>
                          <input
                            type="text"
                            value={formData.volumes || ''}
                            onChange={(e) => handleInputChange('volumes', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('invoices.form.fields.cubageM3')}
                          </label>
                          <input
                            type="text"
                            value={(formData as any).cubic_meters || ''}
                            onChange={(e) => handleInputChange('cubic_meters', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 mt-4 mb-2 border-t border-gray-200 pt-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('invoices.details.taxes')}</h4>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('invoices.form.fields.icmsValue')}
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
                        {t('invoices.form.fields.pisValue')}
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
                        {t('invoices.form.fields.cofinsValue')}
                      </label>
                      <input
                        type="text"
                        value={formatCurrency(formData.cofins_value)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                      />
                    </div>
                  </div>
                  )}
                </div>
              )}
            </div>
      </div>
    </div>
  );
};
