interface Country {
  id: number;
  code: string;
  trackingPrefix: string;
  name: string;
}

interface Shipment {
  id: number;
  reference: string;
  orderNumber?: string;
  origin: string;
  destination: string;
  carrier: string;
  status: 'pendente' | 'em_transito' | 'entregue' | 'cancelado';
  createdAt: string;
  deliveryDate?: string;
  value: number;
  weight: number;
}

interface Carrier {
  id: number;
  codigo: string; // 4-digit sequential code
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  rating: number;
  activeShipments: number;
  razaoSocial: string;
  fantasia: string;
  logotipo: string | null;
  pais: string;
  estado: string;
  cidade: string;
  toleranciaValorCte: string;
  toleranciaPercentualCte: string;
  toleranciaValorFatura: string;
  toleranciaPercentualFatura: string;
  status: 'ativo' | 'inativo';
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  foto_perfil_url?: string;
  perfil?: 'administrador' | 'gerente' | 'operador' | 'visualizador' | 'personalizado';
  permissoes?: string[];
  estabelecimentosPermitidos?: number[];
}

export interface Order {
  id: string;
  orderNumber?: string;
  number: string;
  issueDate: string;
  entryDate: string;
  expectedDelivery: string;
  carrier: string;
  freightValue: number;
  client: string;
  destinationCity: string;
  destinationState: string;
  orderValue: number;
  status: string;
  recipientPhone?: string;
  deliveryStatus?: Array<{
    status: string;
    date: string;
    location?: string;
    observation?: string;
  }>;
}

interface FreightRate {
  id: string;
  origin: string;
  destination: string;
  rate: number;
  carrier: string;
  validFrom: string;
  validTo: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessPartner {
  id: string;
  name: string;
  document: string;
  documentType: 'cpf' | 'cnpj';
  email: string;
  phone: string;
  type: 'customer' | 'supplier' | 'both';
  status: 'active' | 'inactive';
  contacts: BusinessPartnerContact[];
  addresses: BusinessPartnerAddress[];
  observations: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessPartnerContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  isPrimary: boolean;
  receiveEmailNotifications: boolean;
  receiveWhatsappNotifications: boolean;
  // Notification preferences for email
  emailNotifyOrderCreated?: boolean;
  emailNotifyOrderInvoiced?: boolean;
  emailNotifyAwaitingPickup?: boolean;
  emailNotifyPickedUp?: boolean;
  emailNotifyInTransit?: boolean;
  emailNotifyOutForDelivery?: boolean;
  emailNotifyDelivered?: boolean;
  // Notification preferences for WhatsApp
  whatsappNotifyOrderCreated?: boolean;
  whatsappNotifyOrderInvoiced?: boolean;
  whatsappNotifyAwaitingPickup?: boolean;
  whatsappNotifyPickedUp?: boolean;
  whatsappNotifyInTransit?: boolean;
  whatsappNotifyOutForDelivery?: boolean;
  whatsappNotifyDelivered?: boolean;
}

export interface BusinessPartnerAddress {
  id?: string;
  partner_id?: string;
  organization_id?: string;
  environment_id?: string;
  type: 'billing' | 'delivery' | 'correspondence' | 'commercial';
  address_type?: 'billing' | 'delivery' | 'correspondence' | 'commercial';
  street: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
  is_primary: boolean;
  city_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Contact {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  receiveWhatsAppNotifications?: boolean;
}

export interface ReverseLogistics {
  id: string;
  reverseOrderNumber: string;
  originalOrderId: string;
  originalOrderNumber: string;
  customerId: string;
  customerName: string;
  type: 'exchange' | 'return' | 'warranty' | 'defect';
  reason: string;
  status: 'pending' | 'approved' | 'in_transit' | 'received' | 'processed' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  items: ReverseLogisticsItem[];
  pickupAddress: Address;
  returnAddress: Address;
  carrier?: string;
  trackingCode?: string;
  refundAmount?: number;
  exchangeOrderId?: string;
  notes?: string;
  attachments?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReverseLogisticsItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  condition: 'new' | 'used' | 'damaged' | 'defective';
  reason: string;
  action: 'refund' | 'exchange' | 'repair' | 'discard';
}