import { Order } from '../types';

// Mock shipments data
const shipments = [
  // Página 1 (registros 1-10) - Todos os 4 status devem aparecer
  {
    id: '1',
    reference: 'ENV-001',
    origin: 'São Paulo - SP',
    destination: 'Rio de Janeiro - RJ',
    status: 'em_transito',
    carrier: 'Transportadora ABC',
    value: 1500,
    weight: 250.5,
    createdAt: '2025-01-15T10:00:00Z',
    deliveryDate: null
  },
  {
    id: '2',
    reference: 'ENV-002',
    origin: 'Belo Horizonte - MG',
    destination: 'Salvador - BA',
    status: 'entregue',
    carrier: 'Transportadora XYZ',
    value: 2200,
    weight: 180.3,
    createdAt: '2025-01-16T14:30:00Z',
    deliveryDate: '2025-01-19T16:45:00Z'
  },
  {
    id: '3',
    reference: 'ENV-003',
    origin: 'Porto Alegre - RS',
    destination: 'Curitiba - PR',
    status: 'pendente',
    carrier: 'Transportadora DEF',
    value: 800,
    weight: 95.7,
    createdAt: '2025-01-17T09:15:00Z',
    deliveryDate: null
  },
  {
    id: '4',
    reference: 'ENV-004',
    origin: 'Recife - PE',
    destination: 'Fortaleza - CE',
    status: 'em_transito',
    carrier: 'Transportadora GHI',
    value: 1800,
    weight: 320.8,
    createdAt: '2025-01-18T11:20:00Z',
    deliveryDate: null
  },
  {
    id: '5',
    reference: 'ENV-005',
    origin: 'Brasília - DF',
    destination: 'Goiânia - GO',
    status: 'cancelado',
    carrier: 'Transportadora JKL',
    value: 650,
    weight: 75.2,
    createdAt: '2025-01-19T13:45:00Z',
    deliveryDate: null
  },
  {
    id: '6',
    reference: 'ENV-006',
    origin: 'Manaus - AM',
    destination: 'Belém - PA',
    status: 'pendente',
    carrier: 'Transportadora Norte',
    value: 2100,
    weight: 340.2,
    createdAt: '2025-01-20T08:00:00Z',
    deliveryDate: null
  },
  {
    id: '7',
    reference: 'ENV-007',
    origin: 'Florianópolis - SC',
    destination: 'Joinville - SC',
    status: 'entregue',
    carrier: 'Transportadora Sul',
    value: 950,
    weight: 125.8,
    createdAt: '2025-01-21T11:30:00Z',
    deliveryDate: '2025-01-22T14:20:00Z'
  },
  {
    id: '8',
    reference: 'ENV-008',
    origin: 'São Luís - MA',
    destination: 'Teresina - PI',
    status: 'em_transito',
    carrier: 'Transportadora Nordeste',
    value: 1350,
    weight: 198.4,
    createdAt: '2025-01-22T09:45:00Z',
    deliveryDate: null
  },
  {
    id: '9',
    reference: 'ENV-009',
    origin: 'Vitória - ES',
    destination: 'Campos - RJ',
    status: 'cancelado',
    carrier: 'Transportadora Leste',
    value: 780,
    weight: 89.6,
    createdAt: '2025-01-23T15:20:00Z',
    deliveryDate: null
  },
  {
    id: '10',
    reference: 'ENV-010',
    origin: 'Campo Grande - MS',
    destination: 'Cuiabá - MT',
    status: 'pendente',
    carrier: 'Transportadora Centro-Oeste',
    value: 1620,
    weight: 267.3,
    createdAt: '2025-01-24T10:15:00Z',
    deliveryDate: null
  },
  // Página 2 (registros 11-20)
  {
    id: '11',
    reference: 'ENV-011',
    origin: 'Aracaju - SE',
    destination: 'Maceió - AL',
    status: 'em_transito',
    carrier: 'Transportadora Litoral',
    value: 890,
    weight: 112.7,
    createdAt: '2025-01-25T08:30:00Z',
    deliveryDate: null
  },
  {
    id: '12',
    reference: 'ENV-012',
    origin: 'Natal - RN',
    destination: 'João Pessoa - PB',
    status: 'entregue',
    carrier: 'Transportadora Praias',
    value: 1150,
    weight: 156.9,
    createdAt: '2025-01-26T12:00:00Z',
    deliveryDate: '2025-01-27T16:30:00Z'
  },
  {
    id: '13',
    reference: 'ENV-013',
    origin: 'Palmas - TO',
    destination: 'Araguaína - TO',
    status: 'pendente',
    carrier: 'Transportadora Tocantins',
    value: 720,
    weight: 95.3,
    createdAt: '2025-01-27T14:20:00Z',
    deliveryDate: null
  },
  {
    id: '14',
    reference: 'ENV-014',
    origin: 'Porto Velho - RO',
    destination: 'Rio Branco - AC',
    status: 'cancelado',
    carrier: 'Transportadora Amazônia',
    value: 1980,
    weight: 289.5,
    createdAt: '2025-01-28T09:40:00Z',
    deliveryDate: null
  },
  {
    id: '15',
    reference: 'ENV-015',
    origin: 'Boa Vista - RR',
    destination: 'Macapá - AP',
    status: 'em_transito',
    carrier: 'Transportadora Norte Extremo',
    value: 2450,
    weight: 378.2,
    createdAt: '2025-01-29T11:10:00Z',
    deliveryDate: null
  },
  {
    id: '16',
    reference: 'ENV-016',
    origin: 'Campinas - SP',
    destination: 'Ribeirão Preto - SP',
    status: 'entregue',
    carrier: 'Transportadora Interior',
    value: 680,
    weight: 78.4,
    createdAt: '2025-01-30T13:50:00Z',
    deliveryDate: '2025-01-31T10:25:00Z'
  },
  {
    id: '17',
    reference: 'ENV-017',
    origin: 'Uberlândia - MG',
    destination: 'Uberaba - MG',
    status: 'pendente',
    carrier: 'Transportadora Triângulo',
    value: 540,
    weight: 67.8,
    createdAt: '2025-02-01T08:15:00Z',
    deliveryDate: null
  },
  {
    id: '18',
    reference: 'ENV-018',
    origin: 'Londrina - PR',
    destination: 'Maringá - PR',
    status: 'em_transito',
    carrier: 'Transportadora Paraná',
    value: 820,
    weight: 102.6,
    createdAt: '2025-02-02T10:30:00Z',
    deliveryDate: null
  },
  {
    id: '19',
    reference: 'ENV-019',
    origin: 'Caxias do Sul - RS',
    destination: 'Santa Maria - RS',
    status: 'cancelado',
    carrier: 'Transportadora Gaúcha',
    value: 1120,
    weight: 145.3,
    createdAt: '2025-02-03T14:45:00Z',
    deliveryDate: null
  },
  {
    id: '20',
    reference: 'ENV-020',
    origin: 'Blumenau - SC',
    destination: 'Itajaí - SC',
    status: 'entregue',
    carrier: 'Transportadora Vale',
    value: 750,
    weight: 88.9,
    createdAt: '2025-02-04T09:20:00Z',
    deliveryDate: '2025-02-05T11:40:00Z'
  },
  // Página 3 (registros 21-27)
  {
    id: '21',
    reference: 'ENV-021',
    origin: 'Juiz de Fora - MG',
    destination: 'Volta Redonda - RJ',
    status: 'pendente',
    carrier: 'Transportadora Zona da Mata',
    value: 890,
    weight: 115.7,
    createdAt: '2025-02-05T12:35:00Z',
    deliveryDate: null
  },
  {
    id: '22',
    reference: 'ENV-022',
    origin: 'Santos - SP',
    destination: 'Guarujá - SP',
    status: 'em_transito',
    carrier: 'Transportadora Litoral SP',
    value: 420,
    weight: 52.3,
    createdAt: '2025-02-06T08:50:00Z',
    deliveryDate: null
  },
  {
    id: '23',
    reference: 'ENV-023',
    origin: 'Feira de Santana - BA',
    destination: 'Ilhéus - BA',
    status: 'entregue',
    carrier: 'Transportadora Bahia',
    value: 1340,
    weight: 187.5,
    createdAt: '2025-02-07T11:25:00Z',
    deliveryDate: '2025-02-08T15:10:00Z'
  },
  {
    id: '24',
    reference: 'ENV-024',
    origin: 'Mossoró - RN',
    destination: 'Caicó - RN',
    status: 'cancelado',
    carrier: 'Transportadora Potiguar',
    value: 670,
    weight: 79.8,
    createdAt: '2025-02-08T13:15:00Z',
    deliveryDate: null
  },
  {
    id: '25',
    reference: 'ENV-025',
    origin: 'Imperatriz - MA',
    destination: 'Caxias - MA',
    status: 'pendente',
    carrier: 'Transportadora Maranhão',
    value: 1150,
    weight: 156.2,
    createdAt: '2025-02-09T09:40:00Z',
    deliveryDate: null
  },
  {
    id: '26',
    reference: 'ENV-026',
    origin: 'Petrolina - PE',
    destination: 'Juazeiro - BA',
    status: 'em_transito',
    carrier: 'Transportadora São Francisco',
    value: 980,
    weight: 128.4,
    createdAt: '2025-02-10T10:55:00Z',
    deliveryDate: null
  },
  {
    id: '27',
    reference: 'ENV-027',
    origin: 'Dourados - MS',
    destination: 'Três Lagoas - MS',
    status: 'entregue',
    carrier: 'Transportadora MS',
    value: 1460,
    weight: 201.9,
    createdAt: '2025-02-11T14:20:00Z',
    deliveryDate: '2025-02-12T16:45:00Z'
  }
];

// Function to get all shipments
const getAllShipments = () => {
  return shipments;
};

// Function to refresh shipments data
const refreshShipments = () => {
  return shipments;
};

// Mock orders data
export const ordersData: Order[] = [
  {
    id: '1',
    number: '9622',
    issueDate: '2024-01-15',
    entryDate: '2024-01-15',
    expectedDelivery: '2024-01-18',
    carrier: 'Transportadora ABC',
    freightValue: 1500.00,
    client: 'Cliente A',
    destinationCity: 'Rio de Janeiro',
    destinationState: 'RJ',
    orderValue: 1500.00,
    status: 'Em Trânsito',
    recipientPhone: '+55 12 99113 0594',
    deliveryStatus: [
      {
        status: 'Em trânsito',
        date: '2024-01-16T10:30:00Z',
        location: 'São Paulo - SP',
        observation: 'Mercadoria saiu para entrega'
      },
      {
        status: 'Coletado',
        date: '2024-01-15T08:00:00Z',
        location: 'São Paulo - SP'
      }
    ]
  },
  {
    id: '2',
    number: '7245',
    issueDate: '2024-01-16',
    entryDate: '2024-01-16',
    expectedDelivery: '2024-01-19',
    carrier: 'Transportadora XYZ',
    freightValue: 2200.00,
    client: 'Cliente B',
    destinationCity: 'Salvador',
    destinationState: 'BA',
    orderValue: 2200.00,
    status: 'Entregue',
    recipientPhone: '+55 12 99113 0594',
    deliveryStatus: [
      {
        status: 'Entregue',
        date: '2024-01-19T15:20:00Z',
        location: 'Salvador - BA',
        observation: 'Entrega realizada com sucesso'
      },
      {
        status: 'Em trânsito',
        date: '2024-01-17T09:00:00Z',
        location: 'Belo Horizonte - MG'
      },
      {
        status: 'Coletado',
        date: '2024-01-16T14:00:00Z',
        location: 'Belo Horizonte - MG'
      }
    ]
  },
  {
    id: '3',
    number: '1848',
    issueDate: '2024-01-17',
    entryDate: '2024-01-17',
    expectedDelivery: '2024-01-20',
    carrier: 'Transportadora DEF',
    freightValue: 800.00,
    client: 'Cliente C',
    destinationCity: 'Curitiba',
    destinationState: 'PR',
    orderValue: 800.00,
    status: 'Pendente',
    recipientPhone: '+55 12 99113 0594',
    deliveryStatus: [
      {
        status: 'Aguardando coleta',
        date: '2024-01-17T09:15:00Z',
        location: 'Porto Alegre - RS'
      }
    ]
  },
  {
    id: '4',
    number: '004',
    issueDate: '2024-01-18',
    entryDate: '2024-01-18',
    expectedDelivery: '2024-01-21',
    carrier: 'Transportadora GHI',
    freightValue: 1800.00,
    client: 'Cliente D',
    destinationCity: 'Fortaleza',
    destinationState: 'CE',
    orderValue: 1800.00,
    status: 'Em Trânsito',
    recipientPhone: '+55 12 99113 0594',
    deliveryStatus: [
      {
        status: 'Em trânsito',
        date: '2024-01-19T11:00:00Z',
        location: 'Recife - PE',
        observation: 'Mercadoria em rota para destino'
      },
      {
        status: 'Coletado',
        date: '2024-01-18T11:20:00Z',
        location: 'Recife - PE'
      }
    ]
  },
  {
    id: '5',
    number: '005',
    issueDate: '2024-01-19',
    entryDate: '2024-01-19',
    expectedDelivery: '2024-01-22',
    carrier: 'Transportadora JKL',
    freightValue: 650.00,
    client: 'Cliente E',
    destinationCity: 'Goiânia',
    destinationState: 'GO',
    orderValue: 650.00,
    status: 'Coletado',
    recipientPhone: '+55 12 99113 0594',
    deliveryStatus: [
      {
        status: 'Coletado',
        date: '2024-01-19T13:45:00Z',
        location: 'Brasília - DF',
        observation: 'Aguardando saída para transporte'
      }
    ]
  }
];

const mockOrders: Order[] = [
  {
    id: '1',
    number: 'PED-9622',
    issueDate: '2025-12-26',
    entryDate: '2025-12-21',
    expectedDelivery: '2025-02-21',
    carrier: 'Rápido Entregas',
    freightValue: 633.00,
    client: 'Distribuidora E Ltda',
    destinationCity: 'Fortaleza',
    destinationState: 'SP',
    orderValue: 1686.00,
    status: 'Chegada Destino',
    recipientPhone: '+55 12 99113 0594',
    deliveryStatus: [
      {
        status: 'Chegada ao destino',
        date: '2025-01-22T14:30:00Z',
        location: 'Fortaleza - SP',
        observation: 'Mercadoria chegou ao centro de distribuição'
      },
      {
        status: 'Em trânsito',
        date: '2025-01-21T09:15:00Z',
        location: 'São Paulo - SP',
        observation: 'Saiu para entrega'
      },
      {
        status: 'Coletado',
        date: '2025-01-20T08:00:00Z',
        location: 'São Paulo - SP'
      }
    ]
  },
  {
    id: '2',
    number: 'PED-7245',
    issueDate: '2025-12-20',
    entryDate: '2025-06-24',
    expectedDelivery: '2026-01-08',
    carrier: 'Transportadora ABC',
    freightValue: 964.00,
    client: 'Cliente A Ltda',
    destinationCity: 'Salvador',
    destinationState: 'BA',
    orderValue: 1246.00,
    status: 'Em Trânsito - Origem',
    recipientPhone: '+55 12 99113 0594',
    deliveryStatus: [
      {
        status: 'Em trânsito - Origem',
        date: '2025-01-22T10:00:00Z',
        location: 'São Paulo - SP',
        observation: 'Mercadoria em trânsito'
      },
      {
        status: 'Coletado',
        date: '2025-01-20T14:00:00Z',
        location: 'São Paulo - SP'
      }
    ]
  },
  {
    id: '3',
    number: 'PED-1848',
    issueDate: '2025-12-05',
    entryDate: '2025-06-07',
    expectedDelivery: '2025-06-23',
    carrier: 'Rápido Entregas',
    freightValue: 617.00,
    client: 'Distribuidora E Ltda',
    destinationCity: 'Recife',
    destinationState: 'MG',
    orderValue: 7061.00,
    status: 'Coletado',
    recipientPhone: '+55 12 99113 0594',
    deliveryStatus: [
      {
        status: 'Coletado',
        date: '2025-01-22T08:30:00Z',
        location: 'São Paulo - SP',
        observation: 'Aguardando saída para transporte'
      }
    ]
  }
];

const mockShipments = [
  {
    id: 'Pedido #2024-001',
    orderNumber: '2024-001',
    trackingCode: 'TRK-2024-001',
    origin: 'São Paulo - SP',
    destination: 'Rio de Janeiro - RJ',
    status: 'Em Trânsito',
    carrier: 'Transportadora ABC',
    value: 1500.00,
    weight: 250.5,
    createdAt: '2024-01-15T10:00:00Z',
    estimatedDelivery: '2024-01-20'
  },
  {
    id: 'Pedido #2024-002',
    orderNumber: '2024-002',
    trackingCode: 'TRK-2024-002',
    origin: 'Belo Horizonte - MG',
    destination: 'Salvador - BA',
    status: 'Entregue',
    carrier: 'Transportadora XYZ',
    value: 2200.00,
    weight: 180.3,
    createdAt: '2024-01-16T14:30:00Z',
    estimatedDelivery: '2024-01-19'
  },
  {
    id: 'Pedido #2024-003',
    orderNumber: '2024-003',
    trackingCode: 'TRK-2024-003',
    origin: 'Porto Alegre - RS',
    destination: 'Curitiba - PR',
    status: 'Pendente',
    carrier: 'Transportadora DEF',
    value: 800.00,
    weight: 95.7,
    createdAt: '2024-01-17T09:15:00Z',
    estimatedDelivery: '2024-01-22'
  },
  {
    id: 'Pedido #2024-004',
    orderNumber: '2024-004',
    trackingCode: 'TRK-2024-004',
    origin: 'Recife - PE',
    destination: 'Fortaleza - CE',
    status: 'Em Trânsito',
    carrier: 'Transportadora GHI',
    value: 1800.00,
    weight: 320.8,
    createdAt: '2024-01-18T11:20:00Z',
    estimatedDelivery: '2024-01-21'
  },
  {
    id: 'Pedido #2024-005',
    orderNumber: '2024-005',
    trackingCode: 'TRK-2024-005',
    origin: 'Brasília - DF',
    destination: 'Goiânia - GO',
    status: 'Cancelado',
    carrier: 'Transportadora JKL',
    value: 650.00,
    weight: 75.2,
    createdAt: '2024-01-19T13:45:00Z',
    estimatedDelivery: '2024-01-23'
  }
];

// Establishments data
const establishments = [
  { id: '1', name: 'Estabelecimento A', code: 'EST001' },
  { id: '2', name: 'Estabelecimento B', code: 'EST002' },
  { id: '3', name: 'Estabelecimento C', code: 'EST003' }
];

// Carriers data
export const carriers = [
  {
    id: '1',
    codigo: '0001',
    razaoSocial: 'Transportadora ABC Ltda',
    fantasia: 'ABC Transportes',
    cnpj: '12.345.678/0001-90',
    inscricaoEstadual: '123.456.789.012',
    pais: '1',
    estado: '1',
    cidade: '1',
    email: 'contato@abctransportes.com.br',
    phone: '(11) 1234-5678',
    status: 'ativo',
    name: 'ABC Transportes',
    rating: 4.5,
    activeShipments: 12
  },
  {
    id: '2',
    codigo: '0002',
    razaoSocial: 'Transportadora XYZ S.A.',
    fantasia: 'XYZ Logística',
    cnpj: '98.765.432/0001-10',
    inscricaoEstadual: '987.654.321.098',
    pais: '1',
    estado: '2',
    cidade: '4',
    email: 'contato@xyzlogistica.com.br',
    phone: '(21) 9876-5432',
    status: 'ativo',
    name: 'XYZ Logística',
    rating: 4.2,
    activeShipments: 8
  }
];

// Function to get next carrier code
const getNextCarrierCode = (): string => {
  if (carriers.length === 0) {
    return '0001';
  }
  
  const maxCode = Math.max(...carriers.map(carrier => parseInt(carrier.codigo)));
  const nextCode = maxCode + 1;
  return nextCode.toString().padStart(4, '0');
};

// Function to validate carrier code format
const isValidCarrierCode = (codigo: string): boolean => {
  if (!codigo) return false;
  return /^\d{4}$/.test(codigo);
};

// Function to check if carrier code is unique
const isCarrierCodeUnique = (codigo: string, excludeId?: string): boolean => {
  return !carriers.some(carrier => 
    carrier.codigo === codigo && carrier.id !== excludeId
  );
};

// Function to add a new carrier
const addCarrier = (carrierData: any) => {
  const newCarrier = {
    ...carrierData,
    id: (carriers.length + 1).toString()
  };
  carriers.push(newCarrier);
  return newCarrier;
};

// Function to update an existing carrier
const updateCarrier = (id: string, carrierData: any) => {
  const index = carriers.findIndex(carrier => carrier.id === id);
  if (index !== -1) {
    carriers[index] = { ...carriers[index], ...carrierData };
    return carriers[index];
  }
  return null;
};

// Function to get all carriers
const getAllCarriers = () => {
  return carriers;
};

// Function to delete a carrier
const deleteCarrier = (id: string | number) => {
  const index = carriers.findIndex(carrier => carrier.id === id.toString());
  if (index !== -1) {
    carriers.splice(index, 1);
    return true;
  }
  return false;
};

// Function to get a carrier by ID
const getCarrierById = (id: string | number) => {
  return carriers.find(carrier => carrier.id === id.toString()) || null;
};

export const billsData = [
  {
    id: 'BILL-001',
    number: 'FAT-2024-001',
    clientId: 'CLI-001',
    clientName: 'Empresa ABC Ltda',
    carrierId: 'CAR-001',
    carrierName: 'Transportadora Rápida',
    issueDate: '2024-01-15',
    dueDate: '2024-02-15',
    amount: 25000.00,
    status: 'pending' as const,
    cteIds: ['CTE-001', 'CTE-002'],
    invoiceIds: ['INV-001', 'INV-002']
  },
  {
    id: 'BILL-002',
    number: 'FAT-2024-002',
    clientId: 'CLI-002',
    clientName: 'Indústria XYZ S.A.',
    carrierId: 'CAR-002',
    carrierName: 'Logística Express',
    issueDate: '2024-01-20',
    dueDate: '2024-02-20',
    amount: 18500.00,
    status: 'approved' as const,
    cteIds: ['CTE-003'],
    invoiceIds: ['INV-003']
  }
];

export const invoicesData = [
  {
    id: 'INV-001',
    number: 'NF-2024-001',
    clientId: 'CLI-001',
    clientName: 'Empresa ABC Ltda',
    issueDate: '2024-01-15',
    amount: 15000.00,
    status: 'issued' as const,
    items: [
      { description: 'Produto A', quantity: 10, unitPrice: 1000.00, total: 10000.00 },
      { description: 'Produto B', quantity: 5, unitPrice: 1000.00, total: 5000.00 }
    ]
  },
  {
    id: 'INV-002',
    number: 'NF-2024-002',
    clientId: 'CLI-001',
    clientName: 'Empresa ABC Ltda',
    issueDate: '2024-01-16',
    amount: 10000.00,
    status: 'issued' as const,
    items: [
      { description: 'Produto C', quantity: 8, unitPrice: 1250.00, total: 10000.00 }
    ]
  },
  {
    id: 'INV-003',
    number: 'NF-2024-003',
    clientId: 'CLI-002',
    clientName: 'Indústria XYZ S.A.',
    issueDate: '2024-01-20',
    amount: 18500.00,
    status: 'issued' as const,
    items: [
      { description: 'Produto D', quantity: 15, unitPrice: 1233.33, total: 18500.00 }
    ]
  }
];

export const ctesData = [
  {
    id: 'CTE-001',
    number: '35240114200166000187570010000000011123456789',
    clientId: 'CLI-001',
    clientName: 'Empresa ABC Ltda',
    carrierId: 'CAR-001',
    carrierName: 'Transportadora Rápida',
    issueDate: '2024-01-15',
    origin: 'São Paulo - SP',
    destination: 'Rio de Janeiro - RJ',
    freightValue: 12500.00,
    status: 'issued' as const,
    invoiceIds: ['INV-001']
  },
  {
    id: 'CTE-002',
    number: '35240114200166000187570010000000021123456790',
    clientId: 'CLI-001',
    clientName: 'Empresa ABC Ltda',
    carrierId: 'CAR-001',
    carrierName: 'Transportadora Rápida',
    issueDate: '2024-01-16',
    origin: 'São Paulo - SP',
    destination: 'Rio de Janeiro - RJ',
    freightValue: 12500.00,
    status: 'issued' as const,
    invoiceIds: ['INV-002']
  },
  {
    id: 'CTE-003',
    number: '35240114200166000187570010000000031123456791',
    clientId: 'CLI-002',
    clientName: 'Indústria XYZ S.A.',
    carrierId: 'CAR-002',
    carrierName: 'Logística Express',
    issueDate: '2024-01-20',
    origin: 'Belo Horizonte - MG',
    destination: 'Salvador - BA',
    freightValue: 18500.00,
    status: 'issued' as const,
    invoiceIds: ['INV-003']
  }
];