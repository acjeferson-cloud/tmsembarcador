import { ReverseLogistics } from '../types';

const reverseLogisticsData: ReverseLogistics[] = [
  {
    id: '1',
    reverseOrderNumber: 'REV-2024-001',
    originalOrderId: '1',
    originalOrderNumber: 'PED-2024-001',
    customerId: '1',
    customerName: 'João Silva',
    type: 'return',
    reason: 'Produto não atendeu às expectativas',
    status: 'pending',
    priority: 'medium',
    requestDate: '2024-01-15',
    expectedReturnDate: '2024-01-22',
    items: [
      {
        id: '1',
        productId: '1',
        productName: 'Smartphone Galaxy S23',
        sku: 'SGS23-128GB',
        quantity: 1,
        unitPrice: 2500.00,
        totalPrice: 2500.00,
        condition: 'new',
        reason: 'Não gostou do produto',
        action: 'refund'
      }
    ],
    pickupAddress: {
      street: 'Rua das Flores, 123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      country: 'Brasil'
    },
    returnAddress: {
      street: 'Av. Paulista, 1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      country: 'Brasil'
    },
    refundAmount: 2500.00,
    notes: 'Cliente solicitou devolução dentro do prazo de 7 dias',
    createdBy: 'admin',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    reverseOrderNumber: 'REV-2024-002',
    originalOrderId: '2',
    originalOrderNumber: 'PED-2024-002',
    customerId: '2',
    customerName: 'Maria Santos',
    type: 'exchange',
    reason: 'Tamanho incorreto',
    status: 'approved',
    priority: 'high',
    requestDate: '2024-01-16',
    expectedReturnDate: '2024-01-23',
    items: [
      {
        id: '2',
        productId: '2',
        productName: 'Notebook Dell Inspiron',
        sku: 'DI-15-I5',
        quantity: 1,
        unitPrice: 3200.00,
        totalPrice: 3200.00,
        condition: 'new',
        reason: 'Especificação diferente do pedido',
        action: 'exchange'
      }
    ],
    pickupAddress: {
      street: 'Rua dos Pinheiros, 456',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05422-001',
      country: 'Brasil'
    },
    returnAddress: {
      street: 'Av. Paulista, 1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      country: 'Brasil'
    },
    carrier: 'Correios',
    trackingCode: 'BR123456789BR',
    exchangeOrderId: '15',
    notes: 'Troca aprovada - novo produto será enviado',
    createdBy: 'admin',
    createdAt: '2024-01-16T14:30:00Z',
    updatedAt: '2024-01-16T16:45:00Z'
  },
  {
    id: '3',
    reverseOrderNumber: 'REV-2024-003',
    originalOrderId: '3',
    originalOrderNumber: 'PED-2024-003',
    customerId: '3',
    customerName: 'Pedro Costa',
    type: 'warranty',
    reason: 'Defeito de fabricação',
    status: 'in_transit',
    priority: 'urgent',
    requestDate: '2024-01-17',
    expectedReturnDate: '2024-01-24',
    actualReturnDate: '2024-01-20',
    items: [
      {
        id: '3',
        productId: '3',
        productName: 'Smart TV 55" LG',
        sku: 'LG-55-OLED',
        quantity: 1,
        unitPrice: 4500.00,
        totalPrice: 4500.00,
        condition: 'defective',
        reason: 'Tela com defeito',
        action: 'repair'
      }
    ],
    pickupAddress: {
      street: 'Av. Brasil, 789',
      neighborhood: 'Copacabana',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '22070-011',
      country: 'Brasil'
    },
    returnAddress: {
      street: 'Rua da Assembleia, 100',
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '20011-901',
      country: 'Brasil'
    },
    carrier: 'Transportadora Express',
    trackingCode: 'EXP987654321',
    notes: 'Produto em garantia - será reparado e devolvido',
    attachments: ['foto_defeito.jpg', 'nota_fiscal.pdf'],
    createdBy: 'admin',
    createdAt: '2024-01-17T09:15:00Z',
    updatedAt: '2024-01-20T11:30:00Z'
  }
];

export const reverseLogisticsReasons = [
  'Produto não atendeu às expectativas',
  'Tamanho incorreto',
  'Cor diferente do pedido',
  'Defeito de fabricação',
  'Produto danificado no transporte',
  'Especificação diferente do anunciado',
  'Arrependimento da compra',
  'Produto com defeito',
  'Entrega em atraso',
  'Produto não compatível'
];

export const reverseLogisticsTypes = [
  { value: 'return', label: 'Devolução' },
  { value: 'exchange', label: 'Troca' },
  { value: 'warranty', label: 'Garantia' },
  { value: 'defect', label: 'Defeito' }
];

export const reverseLogisticsStatuses = [
  { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Aprovado', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_transit', label: 'Em Trânsito', color: 'bg-purple-100 text-purple-800' },
  { value: 'received', label: 'Recebido', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'processed', label: 'Processado', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'completed', label: 'Concluído', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
];

export const itemConditions = [
  { value: 'new', label: 'Novo' },
  { value: 'used', label: 'Usado' },
  { value: 'damaged', label: 'Danificado' },
  { value: 'defective', label: 'Defeituoso' }
];

export const itemActions = [
  { value: 'refund', label: 'Reembolso' },
  { value: 'exchange', label: 'Troca' },
  { value: 'repair', label: 'Reparo' },
  { value: 'discard', label: 'Descarte' }
];