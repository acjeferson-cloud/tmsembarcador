import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info, DollarSign, Users, Package, CheckCircle, AlertCircle, Save, Plus, Trash2 } from 'lucide-react';
import { ordersService, OrderDeliveryStatus, Order } from '../../services/ordersService';
import { carriersService } from '../../services/carriersService';
import { businessPartnersService } from '../../services/businessPartnersService';
import { statesService } from '../../services/statesService';
import { orderNotificationService } from '../../services/orderNotificationService';
import { useAuth } from '../../hooks/useAuth';
import { freightQuoteService } from '../../services/freightQuoteService';
import { generateTrackingCode } from '../../utils/trackingCodeGenerator';

interface OrderFormProps {
  onClose: () => void;
  onSave: () => void;
  userId: number;
  order?: any;
}

interface OrderItem {
  id?: string;
  product_code: string;
  product_description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  weight?: number;
  cubic_meters?: number;
}

export const OrderForm: React.FC<OrderFormProps> = ({ onClose, onSave, userId, order }) => {
  const { currentEstablishment, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'basic' | 'customer' | 'products' | 'values'>('basic');
  const [carriers, setCarriers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [formData, setFormData] = useState({
    order_number: '',
    serie: '',
    customer_id: '',
    customer_name: '',
    issue_date: new Date().toISOString().split('T')[0],
    entry_date: new Date().toISOString().split('T')[0],
    expected_delivery: '',
    carrier_id: '',
    carrier_name: '',
    freight_value: 0,
    order_value: 0,
    destination_city: '',
    destination_state: '',
    recipient_phone: '',
    status: 'emitido' as any,
    tracking_code: '',
    observations: '',
    weight: '',
    volume_qty: '',
    cubic_meters: '',
    freight_results: [] as any[],
    best_carrier_id: ''
  });

  const [customerData, setCustomerData] = useState({
    name: '',
    cnpj: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: ''
  });

  const [products, setProducts] = useState<OrderItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.customer-search-container')) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    console.log('customerData.state mudou para:', customerData.state);
  }, [customerData.state]);

  useEffect(() => {
    if (order) {
      console.log('=============== RECUPERANDO PEDIDO PARA EDICAO ===============');
      console.log('Order Data Props:', JSON.parse(JSON.stringify(order)));
      
      const safeDataPedido = order.issue_date ? order.issue_date.split('T')[0] : new Date().toISOString().split('T')[0];
      const safeDataEntrada = order.entry_date ? order.entry_date.split('T')[0] : new Date().toISOString().split('T')[0];
      const safePrevisao = order.expected_delivery ? order.expected_delivery.split('T')[0] : '';

      // Load existing order data for editing
      setFormData({
        order_number: order.order_number || '',
        serie: order.serie || '',
        issue_date: safeDataPedido,
        entry_date: safeDataEntrada,
        expected_delivery: safePrevisao,
        carrier_id: order.carrier_id || '',
        carrier_name: order.carrier_name || '',
        customer_id: order.customer_id || '',
        customer_name: order.customer_name || '',
        destination_city: order.destination_city || '',
        destination_state: order.destination_state || '',
        recipient_phone: order.recipient_phone || '',
        freight_value: order.freight_value || 0,
        order_value: order.order_value || 0,
        status: order.status || 'pending',
        observations: order.observations || '',
        weight: order.weight || '',
        volume_qty: order.volume_qty || '',
        cubic_meters: order.cubic_meters || '',
        tracking_code: order.tracking_code || '',
        freight_results: order.freight_results || [],
        best_carrier_id: order.best_carrier_id || ''
      });

      // Tenta recuperar do objeto populado do banco, ou fallback para os campos diretos
      const bp = order.business_partners || {};
      
      setCustomerSearchTerm(bp.razao_social || bp.nome_fantasia || order.customer_name || '');
      
      setCustomerData({
        name: bp.razao_social || bp.nome_fantasia || order.customer_name || '',
        cnpj: bp.cpf_cnpj || order.customer_id || '',
        address: bp.logradouro || order.destination_street || '',
        number: bp.numero || order.destination_number || '',
        complement: bp.complemento || order.destination_complement || '',
        neighborhood: bp.bairro || order.destination_neighborhood || '',
        city: bp.cidade || order.destination_city || '',
        state: bp.estado || order.destination_state || '',
        zip_code: bp.cep || order.destination_zip_code || '',
        phone: bp.telefone || order.recipient_phone || '',
        email: bp.email || ''
      });

      // Load order items if they exist
      if (order.items && order.items.length > 0) {
        console.log('Carregando produtos do pedido:', order.items);
        setProducts(order.items);
      }
    }
  }, [order]);

  const loadData = async () => {
    try {
      const [carriersData, customersData, statesData] = await Promise.all([
        carriersService.getAll(),
        businessPartnersService.getAll(),
        statesService.getAll()
      ]);

      setCarriers(carriersData);
      const clientList = customersData.filter((c: any) => c.type === 'customer' || c.type === 'both');
      console.log('Total de clientes carregados:', clientList.length);
      console.log('Primeiros 3 clientes:', clientList.slice(0, 3).map((c: any) => ({ name: c.name, type: c.type })));
      setCustomers(clientList);
      setFilteredCustomers(clientList);

      console.log('Estados carregados:', statesData.length);
      console.log('Primeiros 5 estados:', statesData.slice(0, 5).map((s: any) => ({ abbreviation: s.abbreviation, name: s.name })));
      setStates(statesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados do formulário');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'carrier_id') {
      const selectedCarrier = carriers.find(c => c.id === value);
      if (selectedCarrier) {
        setFormData(prev => ({
          ...prev,
          carrier_name: selectedCarrier.razao_social || selectedCarrier.fantasia || ''
        }));
      }
    }

    if (field === 'customer_id') {
      const selectedCustomer = customers.find(c => c.id === value);
      if (selectedCustomer) {
        selectCustomer(selectedCustomer);
      }
    }
  };

  const selectCustomer = (customer: any) => {
    console.log('=== SELECIONANDO CLIENTE ===');
    console.log('Cliente completo:', customer);
    console.log('Endereços do cliente:', customer.addresses);

    const primaryAddress = customer.addresses?.find((a: any) => a.is_primary) || customer.addresses?.[0] || {};
    console.log('Endereço principal:', primaryAddress);
    console.log('Estado do endereço:', primaryAddress.state);

    const customerDataToSet = {
      name: customer.name || '',
      cnpj: customer.document || '',
      address: primaryAddress.street || '',
      number: primaryAddress.number || '',
      complement: primaryAddress.complement || '',
      neighborhood: primaryAddress.neighborhood || '',
      city: primaryAddress.city || '',
      state: primaryAddress.state || '',
      zip_code: primaryAddress.zip_code || '',
      phone: customer.phone || '',
      email: customer.email || ''
    };

    console.log('Dados do cliente a serem setados:', customerDataToSet);
    console.log('Estado específico:', customerDataToSet.state);

    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      customer_name: customer.name || '',
      destination_city: primaryAddress.city || '',
      destination_state: primaryAddress.state || '',
      recipient_phone: customer.phone || ''
    }));

    setCustomerData(customerDataToSet);

    setCustomerSearchTerm(customer.name || '');
    setShowCustomerDropdown(false);
  };

  const handleCustomerSearch = (searchValue: string) => {
    setCustomerSearchTerm(searchValue);
    setShowCustomerDropdown(true);

    console.log('=== BUSCA DE CLIENTES ===');
    console.log('Termo de busca:', searchValue);
    console.log('Total de clientes disponíveis:', customers.length);

    if (searchValue.trim() === '') {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter((customer: any) => {
      const searchLower = searchValue.toLowerCase();
      const name = (customer.name || '').toLowerCase();
      const document = (customer.document || '').replace(/[^\d]/g, '');
      const searchClean = searchValue.replace(/[^\d]/g, '');

      const primaryAddress = customer.addresses?.find((a: any) => a.is_primary) || customer.addresses?.[0];
      const city = (primaryAddress?.city || '').toLowerCase();

      return name.includes(searchLower) ||
             (searchClean && document.includes(searchClean)) ||
             city.includes(searchLower);
    });

    console.log('Clientes filtrados:', filtered.length);
    console.log('Primeiros 3 resultados:', filtered.slice(0, 3).map(c => c.name));
    setFilteredCustomers(filtered);
  };

  const handleCustomerDataChange = (field: string, value: any) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'name') {
      setFormData(prev => ({ ...prev, customer_name: value }));
    }
    if (field === 'city') {
      setFormData(prev => ({ ...prev, destination_city: value }));
    }
    if (field === 'state') {
      setFormData(prev => ({ ...prev, destination_state: value }));
    }
    if (field === 'phone') {
      setFormData(prev => ({ ...prev, recipient_phone: value }));
    }
  };

  const addProduct = () => {
    setProducts([...products, {
      product_code: '',
      product_description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      weight: 0,
      cubic_meters: 0
    }]);
  };

  const removeProduct = (index: number) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
    
    const totalProductsValue = newProducts.reduce((sum, p) => sum + p.total_price, 0);
    const totalWeight = newProducts.reduce((sum, p) => sum + (Number(p.weight) || 0), 0);
    const totalVolume = newProducts.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
    const totalCubicMeters = newProducts.reduce((sum, p) => sum + (Number(p.cubic_meters) || 0), 0);
    
    setFormData(prev => ({ 
      ...prev, 
      order_value: totalProductsValue,
      weight: String(totalWeight),
      volume_qty: String(totalVolume || 1),
      cubic_meters: String(totalCubicMeters)
    }));
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const updatedProducts = [...products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value
    };

    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? parseFloat(value) || 0 : updatedProducts[index].quantity;
      const unitPrice = field === 'unit_price' ? parseFloat(value) || 0 : updatedProducts[index].unit_price;
      updatedProducts[index].total_price = quantity * unitPrice;
    }

    setProducts(updatedProducts);

    const totalProductsValue = updatedProducts.reduce((sum, p) => sum + p.total_price, 0);
    const totalWeight = updatedProducts.reduce((sum, p) => sum + (Number(p.weight) || 0), 0);
    const totalVolume = updatedProducts.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
    const totalCubicMeters = updatedProducts.reduce((sum, p) => sum + (Number(p.cubic_meters) || 0), 0);

    setFormData(prev => ({ 
      ...prev, 
      order_value: totalProductsValue,
      weight: String(totalWeight),
      volume_qty: String(totalVolume || 1),
      cubic_meters: String(totalCubicMeters)
    }));
  };

  const handleSubmit = async () => {
    console.log('=== INICIANDO SALVAMENTO DO PEDIDO ===');

    if (!formData.order_number) {
      setError('Por favor, informe o número do pedido.');
      setActiveTab('basic');
      return;
    }

    if (!formData.customer_name) {
      setError('Por favor, informe o cliente.');
      setActiveTab('customer');
      return;
    }

    if (!formData.destination_city || !formData.destination_state) {
      setError('Por favor, informe a cidade e estado de destino.');
      setActiveTab('customer');
      return;
    }

    if (products.length === 0) {
      setError('Por favor, adicione pelo menos um item.');
      setActiveTab('products');
      return;
    }

    console.log('Dados do formulário:', formData);
    console.log('Produtos:', products);

    setIsSubmitting(true);
    setError('');

    try {
      let finalFreightValue = Number(formData.freight_value) || 0;
      let freightResults = formData.freight_results || [];
      let bestCarrierId = formData.best_carrier_id || null;
      let carrierName = formData.carrier_name || 'Sem transportador';
      let carrierId = formData.carrier_id || null;

      // Executar automaticamente o cálculo de custo de frete se tivermos peso e valor
      if (Number(formData.weight) > 0 && products.length > 0) {
        // Tentar usar o zip_code de customerData, ou destination_city caso zip_code esteja vazio
        console.log('Calculando cotação de frete no pedido...');
        try {
          const results = await freightQuoteService.calculateQuote(
            {
              destinationZipCode: customerData.zip_code ? customerData.zip_code.replace(/\D/g, '') : undefined,
              destinationCityId: undefined, // Poderia buscar o IBGE pela cidade, mas o service usa o zipCode primeiro se passado
              weight: Number(formData.weight),
              volumeQty: Number(formData.volume_qty) || 1,
              cubicMeters: Number(formData.cubic_meters) || 0,
              cargoValue: totalProductsValue,
              establishmentId: currentEstablishment?.id?.toString(),
              selectedModals: ['rodoviario', 'aereo', 'aquaviario', 'ferroviario']
            },
            user?.supabaseUser?.id,
            user?.name,
            user?.email
          );

          if (results && results.length > 0) {
            freightResults = results;
            bestCarrierId = results[0].carrierId;
            finalFreightValue = results[0].totalValue;
            carrierId = bestCarrierId;
            carrierName = results[0].carrierName;
            console.log('Cotação Calculada Com Sucesso. Transportadora Vencedora:', carrierName, finalFreightValue);
          }
        } catch (calcError) {
          console.error('Erro ao calcular frete no pedido. Isso não impede de salvar o pedido.', calcError);
        }
      }

      let finalTrackingCode = formData.tracking_code;
      if (!finalTrackingCode && currentEstablishment) {
        finalTrackingCode = generateTrackingCode(
          formData.order_number,
          new Date(formData.issue_date || new Date()),
          currentEstablishment.codigo,
          currentEstablishment.trackingPrefix || 'TGL'
        );
      } else if (!finalTrackingCode) {
        finalTrackingCode = `TMS-${formData.order_number}`;
      }

      const orderData = {
        order_number: formData.order_number,
        serie: formData.serie || null,
        customer_id: formData.customer_id || null,
        issue_date: formData.issue_date,
        entry_date: formData.entry_date,
        expected_delivery: formData.expected_delivery || null,
        carrier_id: carrierId,
        freight_value: finalFreightValue,
        order_value: totalProductsValue,
        status: formData.status || 'pending',
        tracking_code: finalTrackingCode,
        observations: formData.observations || null,
        weight: Number(formData.weight) || 0,
        volume_qty: Number(formData.volume_qty) || 1,
        cubic_meters: Number(formData.cubic_meters) || 0,
        destination_zip_code: customerData.zip_code,
        destination_street: customerData.address,
        destination_number: customerData.number,
        destination_complement: customerData.complement,
        destination_neighborhood: customerData.neighborhood,
        destination_city: customerData.city,
        destination_state: customerData.state,
        freight_results: freightResults,
        best_carrier_id: bestCarrierId,
        created_by: userId
      };

      console.log('Dados do pedido preparados:', orderData);

      if (order && order.id) {
        // Update existing order
        console.log('Atualizando pedido existente:', order.id);
        const previousStatus = order.status;
        const result = await ordersService.update(order.id, orderData as Partial<Order>);
        console.log('Resultado da atualização:', result);

        if (result.success) {
          // Update order items
          console.log('Atualizando itens do pedido...');
          const itemsResult = await ordersService.updateItems(order.id, products);
          console.log('Resultado da atualização dos itens:', itemsResult);

          if (!itemsResult.success) {
            console.error('Erro ao atualizar itens:', itemsResult.error);
            setError('Pedido atualizado, mas houve erro ao atualizar os itens.');
            return;
          }

          // Verificar se o status mudou para "emitido"
          if (previousStatus !== 'emitido' && orderData.status === 'emitido') {
            console.log('Status alterado para EMITIDO - disparando notificações...');
            const notificationResult = await orderNotificationService.sendOrderCreatedNotifications(order.id);
            if (notificationResult.success) {
              console.log('Notificações enviadas com sucesso!');
            } else {
              console.error('Erro ao enviar notificações:', notificationResult.error);
            }
          }

          setSuccess('Pedido atualizado com sucesso!');
          setTimeout(() => {
            onSave();
          }, 1500);
        } else {
          setError(result.error || 'Erro ao atualizar pedido.');
        }
      } else {
        // Create new order
        console.log('Criando novo pedido...');
        const result = await ordersService.create(orderData as any);
        console.log('Resultado da criação:', result);

        if (result.success && result.id) {
          console.log('Pedido criado com ID:', result.id);

          if (products.length > 0) {
            console.log('Adicionando itens ao pedido...');
            const itemsResult = await ordersService.addItems(result.id, products);
            console.log('Resultado dos itens:', itemsResult);

            if (!itemsResult.success) {
              console.error('Erro ao adicionar itens:', itemsResult.error);
            }
          }

          // Verificar se o status é "emitido" na criação
          if (orderData.status === 'emitido') {
            console.log('Pedido criado com status EMITIDO - disparando notificações...');
            const notificationResult = await orderNotificationService.sendOrderCreatedNotifications(result.id);
            if (notificationResult.success) {
              console.log('Notificações enviadas com sucesso!');
            } else {
              console.error('Erro ao enviar notificações:', notificationResult.error);
            }
          }

          setSuccess('Pedido criado com sucesso!');
          setTimeout(() => {
            onSave();
          }, 1500);
        } else {
          console.error('Erro no resultado:', result);
          setError(result.error || 'Erro ao criar pedido.');
        }
      }
    } catch (err: any) {
      console.error('Erro capturado no catch:', err);
      console.error('Stack trace:', err.stack);
      setError(err.message || 'Erro ao ' + (order ? 'atualizar' : 'criar') + ' pedido.');
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

  const totalProductsValue = products.reduce((sum, p) => sum + p.total_price, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{order ? 'Editar Pedido' : 'Novo Pedido'}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Preencha os dados do pedido</p>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Pedido'}</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
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
                    <span>Itens ({products.length})</span>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Série
                      </label>
                      <input
                        type="text"
                        value={formData.serie || ''}
                        onChange={(e) => handleInputChange('serie', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: 1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Número do Pedido *
                      </label>
                      <input
                        type="text"
                        value={formData.order_number}
                        onChange={(e) => handleInputChange('order_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: PED-2024-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Código de Rastreamento
                      </label>
                      <input
                        type="text"
                        value={formData.tracking_code}
                        onChange={(e) => handleInputChange('tracking_code', e.target.value)}
                        readOnly
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                        placeholder="Gerado automaticamente"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status *
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="emitido">Emitido</option>
                        <option value="coletado">Coletado</option>
                        <option value="em_transito">Em Trânsito</option>
                        <option value="saiu_entrega">Saiu p/Entrega</option>
                        <option value="entregue">Entregue</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data de Emissão *
                      </label>
                      <input
                        type="date"
                        value={formData.issue_date}
                        onChange={(e) => handleInputChange('issue_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data de Entrada *
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
                        value={formData.expected_delivery}
                        onChange={(e) => handleInputChange('expected_delivery', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Transportadora
                      </label>
                      <select
                        value={formData.carrier_id}
                        onChange={(e) => handleInputChange('carrier_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione uma transportadora</option>
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
                        placeholder="Observações adicionais sobre o pedido..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'customer' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      <strong>Selecione um cliente existente</strong> ou preencha os dados manualmente abaixo.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-3 relative customer-search-container">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Selecionar Cliente Cadastrado
                      </label>
                      <input
                        type="text"
                        value={customerSearchTerm}
                        onChange={(e) => handleCustomerSearch(e.target.value)}
                        onFocus={() => setShowCustomerDropdown(true)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Digite para buscar cliente por nome, CNPJ ou cidade..."
                      />
                      {showCustomerDropdown && filteredCustomers.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredCustomers.map((customer) => {
                            const primaryAddress = customer.addresses?.find((a: any) => a.is_primary) || customer.addresses?.[0];
                            return (
                              <button
                                key={customer.id}
                                type="button"
                                onClick={() => selectCustomer(customer)}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                              >
                                <div className="font-medium text-gray-900 dark:text-white">{customer.name}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {customer.document && <span>CNPJ: {customer.document}</span>}
                                  {primaryAddress?.city && primaryAddress?.state && (
                                    <span className="ml-3">{primaryAddress.city} - {primaryAddress.state}</span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {showCustomerDropdown && filteredCustomers.length === 0 && customerSearchTerm && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 dark:text-gray-400">
                          Nenhum cliente encontrado
                        </div>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome / Razão Social *
                      </label>
                      <input
                        type="text"
                        value={customerData.name}
                        onChange={(e) => handleCustomerDataChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Digite o nome do cliente"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CNPJ / CPF
                      </label>
                      <input
                        type="text"
                        value={customerData.cnpj}
                        onChange={(e) => handleCustomerDataChange('cnpj', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Endereço
                      </label>
                      <input
                        type="text"
                        value={customerData.address}
                        onChange={(e) => handleCustomerDataChange('address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Rua, Avenida..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Número
                      </label>
                      <input
                        type="text"
                        value={customerData.number}
                        onChange={(e) => handleCustomerDataChange('number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="123"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={customerData.complement}
                        onChange={(e) => handleCustomerDataChange('complement', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Apto, Sala, Bloco..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={customerData.neighborhood}
                        onChange={(e) => handleCustomerDataChange('neighborhood', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Centro"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cidade *
                      </label>
                      <input
                        type="text"
                        value={customerData.city}
                        onChange={(e) => handleCustomerDataChange('city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="São Paulo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estado *
                      </label>
                      <select
                        value={customerData.state}
                        onChange={(e) => handleCustomerDataChange('state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione o estado</option>
                        {states.map((state: any) => (
                          <option key={state.abbreviation} value={state.abbreviation}>
                            {state.abbreviation} - {state.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={customerData.zip_code}
                        onChange={(e) => handleCustomerDataChange('zip_code', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="00000-000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={customerData.phone}
                        onChange={(e) => handleCustomerDataChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={customerData.email}
                        onChange={(e) => handleCustomerDataChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="cliente@email.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Adicione os itens deste pedido
                    </p>
                    <button
                      onClick={addProduct}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus size={16} />
                      <span>Adicionar Item</span>
                    </button>
                  </div>

                  {products.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">Nenhum item adicionado</p>
                      <button
                        onClick={addProduct}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={16} />
                        <span>Adicionar Primeiro Item</span>
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Código</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Descrição</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Qtd</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Peso (kg)</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Cubagem (m³)</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Valor Unit.</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Valor Total</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ações</th>
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
                                  placeholder="Código"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={product.product_description}
                                  onChange={(e) => updateProduct(index, 'product_description', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="Descrição do item"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  value={product.quantity}
                                  onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                  min="0"
                                  step="1"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  value={product.weight || 0}
                                  onChange={(e) => updateProduct(index, 'weight', e.target.value)}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                  min="0"
                                  step="0.001"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  value={product.cubic_meters || 0}
                                  onChange={(e) => updateProduct(index, 'cubic_meters', e.target.value)}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                  min="0"
                                  step="0.0001"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  value={product.unit_price}
                                  onChange={(e) => updateProduct(index, 'unit_price', e.target.value)}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td className="py-3 px-4 text-sm font-semibold text-right">
                                {formatCurrency(product.total_price)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => removeProduct(index)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Remover item"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-300 bg-gray-50 dark:bg-gray-900">
                            <td colSpan={6} className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                              Total dos Itens:
                            </td>
                            <td className="py-3 px-4 text-sm font-bold text-gray-900 dark:text-white text-right">
                              {formatCurrency(totalProductsValue)}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          Valor Total do Pedido
                        </label>
                        <div className="text-3xl font-bold text-blue-900">
                          {formatCurrency(formData.order_value + formData.freight_value)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor dos Itens
                      </label>
                      <input
                        type="text"
                        value={formatCurrency(totalProductsValue)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900 font-semibold"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Calculado automaticamente</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor do Frete Estimado
                      </label>
                      <input
                        type="number"
                        value={formData.freight_value}
                        onChange={(e) => handleInputChange('freight_value', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-900"
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Será sobrescrito pelo cálculo automático se o peso for preenchido</p>
                    </div>

                    <div className="col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Dados da Carga (para cálculo de frete automático)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Peso Total (kg)
                          </label>
                          <input
                            type="text"
                            value={formData.weight || 0}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Quantidade de Volumes
                          </label>
                          <input
                            type="text"
                            value={formData.volume_qty || 1}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Cubagem (m³)
                          </label>
                          <input
                            type="text"
                            value={formData.cubic_meters || 0}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900 font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 mt-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-900">Valor do Pedido (sem frete):</span>
                          <span className="text-lg font-bold text-green-900">{formatCurrency(formData.order_value)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium text-green-900">Valor do Frete:</span>
                          <span className="text-lg font-bold text-green-900">{formatCurrency(formData.freight_value)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-300">
                          <span className="text-base font-semibold text-green-900">Total Geral:</span>
                          <span className="text-2xl font-bold text-green-900">
                            {formatCurrency(formData.order_value + formData.freight_value)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
