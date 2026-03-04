import { saveEstablishments, loadEstablishments } from '../services/storageService';

export interface EmailConfig {
  email: string;
  username: string;
  password: string;
  authType: 'LOGIN' | 'OAuth2';
  protocol: 'IMAP' | 'POP3';
  host: string;
  port: string;
  useSSL: boolean;
}

export interface Establishment {
  id: number;
  codigo: string; // Changed to string to support leading zeros
  cnpj: string;
  inscricaoEstadual?: string;3
  razaoSocial: string;
  fantasia?: string;
  endereco: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
  tipo: 'matriz' | 'filial';
  trackingPrefix: string;
  emailConfig?: EmailConfig;
}

// Dados iniciais
const initialEstablishments: Establishment[] = [
  {
    id: 1,
    codigo: '0001',
    cnpj: '12.345.678/0001-99',
    inscricaoEstadual: '123.456.789.012',
    razaoSocial: 'TMS Gestor Logística Ltda',
    fantasia: 'TMS Gestor',
    endereco: 'Av. Paulista, 1000 - Conj. 101',
    bairro: 'Bela Vista',
    cep: '01310-100',
    cidade: 'São Paulo',
    estado: 'SP',
    tipo: 'matriz',
    trackingPrefix: 'TMS',
    emailConfig: {
      email: 'matriz@tmsgestor.com.br',
      username: 'matriz',
      password: 'senha123',
      authType: 'LOGIN',
      protocol: 'IMAP',
      host: 'imap.tmsgestor.com.br',
      port: '993',
      useSSL: true
    }
  },
  {
    id: 2,
    codigo: '0002',
    cnpj: '12.345.678/0002-80',
    inscricaoEstadual: '234.567.890.123',
    razaoSocial: 'TMS Gestor Logística Ltda',
    fantasia: 'TMS Gestor - Filial RJ',
    endereco: 'Rua da Assembleia, 500 - Sala 201',
    bairro: 'Centro',
    cep: '20011-000',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    tipo: 'filial',
    trackingPrefix: 'TMS'
  },
  {
    id: 3,
    codigo: '0003',
    cnpj: '12.345.678/0003-71',
    inscricaoEstadual: '345.678.901.234',
    razaoSocial: 'TMS Gestor Logística Ltda',
    fantasia: 'TMS Gestor - Filial BH',
    endereco: 'Av. Afonso Pena, 1500 - 8º andar',
    bairro: 'Centro',
    cep: '30130-002',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    tipo: 'filial',
    trackingPrefix: 'TMS'
  }
];

const establishmentsData: Establishment[] = [
]

// Carrega os estabelecimentos do localStorage ou usa os dados iniciais
export let establishments: Establishment[] = loadEstablishments(initialEstablishments);

// Se não houver dados salvos, salva os dados iniciais
if (establishments.length === 0 || (establishments.length === initialEstablishments.length &&
    establishments.every((e, i) => e.id === initialEstablishments[i].id))) {
  establishments = [...initialEstablishments];
  saveEstablishments(establishments);
}

// Function to generate next sequential code
const getNextEstablishmentCode = (): string => {
  if (establishments.length === 0) {
    return '0001';
  }
  
  // Get all numeric codes and find the highest
  const numericCodes = establishments
    .map(e => parseInt(e.codigo))
    .filter(code => !isNaN(code))
    .sort((a, b) => b - a);
  
  const nextCode = numericCodes.length > 0 ? numericCodes[0] + 1 : 1;
  
  // Format with leading zeros (4 digits)
  return nextCode.toString().padStart(4, '0');
};

// Functions to manage establishments data
const addEstablishment = (establishment: Omit<Establishment, 'id' | 'codigo'>) => {
  const newId = Math.max(...establishments.map(e => e.id), 0) + 1;
  const newCode = getNextEstablishmentCode();
  const newEstablishment = { 
    ...establishment, 
    id: newId,
    codigo: newCode
  };
  establishments.push(newEstablishment);
  saveEstablishments(establishments);
  return newEstablishment;
};

const updateEstablishment = (id: number, updatedEstablishment: Partial<Establishment>) => {
  const index = establishments.findIndex(e => e.id === id);
  if (index !== -1) {
    establishments[index] = { ...establishments[index], ...updatedEstablishment };
    saveEstablishments(establishments);
    return establishments[index];
  }
  return null;
};

const deleteEstablishment = (id: number) => {
  const index = establishments.findIndex(e => e.id === id);
  if (index !== -1) {
    establishments.splice(index, 1);
    saveEstablishments(establishments);
    return true;
  }
  return false;
};

const getEstablishmentById = (id: number) => {
  return establishments.find(e => e.id === id) || null;
};

const getEstablishmentByCode = (codigo: string) => {
  return establishments.find(e => e.codigo === codigo) || null;
};

const getEstablishmentsByCNPJ = (cnpj: string) => {
  return establishments.filter(e => e.cnpj.startsWith(cnpj.substring(0, 14)));
};

// Validation function for establishment code
const isValidEstablishmentCode = (codigo: string): boolean => {
  // Check if it's a 4-digit numeric string
  const numericRegex = /^\d{4}$/;
  return numericRegex.test(codigo);
};

// Function to check if code already exists
const isEstablishmentCodeUnique = (codigo: string, excludeId?: number): boolean => {
  return !establishments.some(e => e.codigo === codigo && e.id !== excludeId);
};

// Function to get all establishments (for reactive updates)
const getAllEstablishments = () => {
  // Sempre recarrega do localStorage para garantir dados atualizados
  establishments = loadEstablishments(initialEstablishments);
  return establishments;
};

// Function to force re-render by updating the array reference
const refreshEstablishments = () => {
  establishments = [...establishments];
  saveEstablishments(establishments);
  return establishments;
};