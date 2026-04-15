import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react';
import { ReverseLogistics, ReverseLogisticsItem } from '../../types';
import { reverseLogisticsReasons, reverseLogisticsTypes, itemConditions, itemActions } from '../../data/reverseLogisticsData';
import { ordersData } from '../../data/mockData';
import { carriersService, Carrier } from '../../services/carriersService';
import { businessPartnersService, BusinessPartner } from '../../services/businessPartnersService';
import { AutocompleteSelect } from '../common/AutocompleteSelect';

interface ReverseLogisticsFormProps {
  order?: ReverseLogistics | null;
  onSave: (order: Partial<ReverseLogistics>) => void;
  onCancel: () => void;
}

const ReverseLogisticsForm: React.FC<ReverseLogisticsFormProps> = ({
  order,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<ReverseLogistics>>({
    reverseOrderNumber: '',
    originalOrderId: '',
    originalOrderNumber: '',
    customerId: '',
    customerName: '',
    type: 'return',
    reason: '',
    status: 'pending',
    priority: 'medium',
    requestDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    items: [],
    pickupAddress: {
      street: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Brasil'
    },
    returnAddress: {
      street: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Brasil'
    },
    carrier: '',
    trackingCode: '',
    refundAmount: 0,
    notes: '',
    createdBy: 'admin'
  });

  const [showOrderSearch, setShowOrderSearch] = useState(false);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);

  useEffect(() => {
    loadCarriers();
    loadBusinessPartners();
  }, []);

  const loadBusinessPartners = async () => {
    try {
      const data = await businessPartnersService.getAll();
      setBusinessPartners(data || []);
    } catch (error) {
      console.error('Error loading business partners:', error);
    }
  };

  const loadCarriers = async () => {
    try {
      const data = await carriersService.getAll();
      setCarriers(data);
    } catch (error) {
      console.error('Error loading carriers:', error);
    }
  };

  useEffect(() => {
    if (order) {
      setFormData(order);
    } else {
      // Generate new reverse order number
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const time = String(now.getTime()).slice(-4);
      
      setFormData(prev => ({
        ...prev,
        reverseOrderNumber: `REV-${year}${month}${day}-${time}`
      }));
    }
  }, [order]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (addressType: 'pickupAddress' | 'returnAddress', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [addressType]: {
        ...prev[addressType],
        [field]: value
      }
    }));
  };

  const handleSelectOriginalOrder = (selectedOrder: any) => {
    setFormData(prev => ({
      ...prev,
      originalOrderId: selectedOrder.id,
      originalOrderNumber: selectedOrder.orderNumber,
      customerId: selectedOrder.customerId,
      customerName: selectedOrder.customerName,
      pickupAddress: selectedOrder.deliveryAddress || prev.pickupAddress,
      items: selectedOrder.items?.map((item: any) => ({
        id: Date.now().toString() + Math.random(),
        productId: item.productId || item.id,
        productName: item.productName || item.name,
        sku: item.sku || item.code,
        quantity: 1,
        unitPrice: item.unitPrice || item.price,
        totalPrice: item.unitPrice || item.price,
        condition: 'new',
        reason: '',
        action: 'refund'
      })) || []
    }));
    setShowOrderSearch(false);
    setOrderSearchTerm('');
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...(formData.items || [])];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
      ...(field === 'quantity' || field === 'unitPrice' ? {
        totalPrice: (field === 'quantity' ? value : updatedItems[index].quantity) * 
                   (field === 'unitPrice' ? value : updatedItems[index].unitPrice)
      } : {})
    };
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleAddItem = () => {
    const newItem: ReverseLogisticsItem = {
      id: Date.now().toString(),
      productId: '',
      productName: '',
      sku: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      condition: 'new',
      reason: '',
      action: 'refund'
    };
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = (formData.items || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate total refund amount
    const totalRefund = (formData.items || []).reduce((sum, item) => {
      return item.action === 'refund' ? sum + item.totalPrice : sum;
    }, 0);
    
    onSave({
      ...formData,
      refundAmount: totalRefund
    });
  };

  const filteredOrders = ordersData.filter(order =>
    order.orderNumber.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(orderSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {order ? 'Editar Solicitação' : 'Nova Solicitação de Logística Reversa'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {order ? 'Atualize as informações da solicitação' : 'Crie uma nova solicitação de devolução, troca ou garantia'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Básicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número da Solicitação
              </label>
              <input
                type="text"
                value={formData.reverseOrderNumber}
                onChange={(e) => handleInputChange('reverseOrderNumber', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Solicitação
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {reverseLogisticsTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prioridade
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Original Order */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pedido Original</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número do Pedido Original
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.originalOrderNumber}
                  onChange={(e) => handleInputChange('originalOrderNumber', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite ou busque o pedido"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOrderSearch(!showOrderSearch)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cliente
              </label>
              <AutocompleteSelect
                options={businessPartners.map(bp => ({
                  value: bp.id || '',
                  label: `${bp.codigo} - ${bp.name}`
                }))}
                value={formData.customerId || ''}
                onChange={(value) => {
                  const selected = businessPartners.find(p => p.id === value);
                  if (selected) {
                    setFormData(prev => ({
                      ...prev,
                      customerId: selected.id,
                      customerName: selected.name
                    }));
                  }
                }}
                placeholder="Pesquisar cliente..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data da Solicitação
              </label>
              <input
                type="date"
                value={formData.requestDate}
                onChange={(e) => handleInputChange('requestDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Order Search */}
          {showOrderSearch && (
            <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Buscar pedido por número ou cliente..."
                  value={orderSearchTerm}
                  onChange={(e) => setOrderSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {filteredOrders.slice(0, 5).map(order => (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOriginalOrder(order)}
                    className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{order.customerName}</div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.orderDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reason */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Motivo da Solicitação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Motivo Principal
              </label>
              <select
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione um motivo</option>
                {reverseLogisticsReasons.map(reason => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Esperada de Retorno
              </label>
              <input
                type="date"
                value={formData.expectedReturnDate}
                onChange={(e) => handleInputChange('expectedReturnDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações Adicionais
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descreva detalhes adicionais sobre a solicitação..."
            />
          </div>
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Itens para Devolução/Troca</h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Item</span>
            </button>
          </div>

          <div className="space-y-4">
            {(formData.items || []).map((item, index) => (
              <div key={item.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Produto
                    </label>
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={item.sku}
                      onChange={(e) => handleItemChange(index, 'sku', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valor Unitário
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Condição
                    </label>
                    <select
                      value={item.condition}
                      onChange={(e) => handleItemChange(index, 'condition', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {itemConditions.map(condition => (
                        <option key={condition.value} value={condition.value}>
                          {condition.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Motivo Específico
                    </label>
                    <input
                      type="text"
                      value={item.reason}
                      onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Motivo específico para este item"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ação
                    </label>
                    <select
                      value={item.action}
                      onChange={(e) => handleItemChange(index, 'action', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {itemActions.map(action => (
                        <option key={action.value} value={action.value}>
                          {action.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pickup Address */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Endereço de Coleta</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Logradouro
                </label>
                <input
                  type="text"
                  value={formData.pickupAddress?.street}
                  onChange={(e) => handleAddressChange('pickupAddress', 'street', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={formData.pickupAddress?.neighborhood}
                    onChange={(e) => handleAddressChange('pickupAddress', 'neighborhood', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={formData.pickupAddress?.zipCode}
                    onChange={(e) => handleAddressChange('pickupAddress', 'zipCode', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.pickupAddress?.city}
                    onChange={(e) => handleAddressChange('pickupAddress', 'city', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={formData.pickupAddress?.state}
                    onChange={(e) => handleAddressChange('pickupAddress', 'state', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Return Address */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Endereço de Retorno</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Logradouro
                </label>
                <input
                  type="text"
                  value={formData.returnAddress?.street}
                  onChange={(e) => handleAddressChange('returnAddress', 'street', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={formData.returnAddress?.neighborhood}
                    onChange={(e) => handleAddressChange('returnAddress', 'neighborhood', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={formData.returnAddress?.zipCode}
                    onChange={(e) => handleAddressChange('returnAddress', 'zipCode', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.returnAddress?.city}
                    onChange={(e) => handleAddressChange('returnAddress', 'city', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={formData.returnAddress?.state}
                    onChange={(e) => handleAddressChange('returnAddress', 'state', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logistics Information */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Logísticas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Transportadora
              </label>
              <select
                value={formData.carrier}
                onChange={(e) => handleInputChange('carrier', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione a transportadora</option>
                {carriers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.codigo} - {c.razao_social}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código de Rastreamento
              </label>
              <input
                type="text"
                value={formData.trackingCode}
                onChange={(e) => handleInputChange('trackingCode', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Código de rastreamento"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {order ? 'Atualizar Solicitação' : 'Criar Solicitação'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReverseLogisticsForm;
