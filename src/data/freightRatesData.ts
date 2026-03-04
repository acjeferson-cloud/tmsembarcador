import { saveFreightRates, loadFreightRates } from '../services/storageService';

export interface FreightRate {
  id: number;
  codigo: string;
  descricao: string;
  tipoAplicacao: 'cidade' | 'cliente' | 'produto';
  prazoEntrega: number; // em dias
  valor: number;
  observacoes?: string;
}

export interface FreightRateTable {
  id: number;
  transportadorId: number;
  transportadorNome: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  status: 'ativo' | 'inativo';
  tarifas: FreightRate[];
  criadoPor: number;
  criadoEm: string;
  alteradoPor?: number;
  alteradoEm?: string;
}

// Dados iniciais
const initialFreightRateTables: FreightRateTable[] = [
  {
    id: 1,
    transportadorId: 1,
    transportadorNome: 'Transportadora ABC',
    nome: 'Tabela Padrão 2025',
    dataInicio: '2025-01-01',
    dataFim: '2025-12-31',
    status: 'ativo',
    tarifas: [
      {
        id: 1,
        codigo: '0001',
        descricao: 'Frete São Paulo → Rio de Janeiro',
        tipoAplicacao: 'cidade',
        prazoEntrega: 2,
        valor: 1500.00,
        observacoes: 'Entrega em dias úteis'
      },
      {
        id: 2,
        codigo: '0002',
        descricao: 'Frete São Paulo → Belo Horizonte',
        tipoAplicacao: 'cidade',
        prazoEntrega: 3,
        valor: 1800.00,
        observacoes: 'Entrega em dias úteis'
      },
      {
        id: 3,
        codigo: '0003',
        descricao: 'Frete para Cliente Premium',
        tipoAplicacao: 'cliente',
        prazoEntrega: 1,
        valor: 2200.00,
        observacoes: 'Entrega expressa para clientes premium'
      }
    ],
    criadoPor: 1,
    criadoEm: '2024-12-15T10:30:00'
  },
  {
    id: 2,
    transportadorId: 2,
    transportadorNome: 'Logística XYZ',
    nome: 'Tabela Promocional Q1 2025',
    dataInicio: '2025-01-01',
    dataFim: '2025-03-31',
    status: 'ativo',
    tarifas: [
      {
        id: 4,
        codigo: '0001',
        descricao: 'Frete Rio de Janeiro → São Paulo',
        tipoAplicacao: 'cidade',
        prazoEntrega: 2,
        valor: 1450.00,
        observacoes: 'Promoção primeiro trimestre'
      },
      {
        id: 5,
        codigo: '0002',
        descricao: 'Frete para Produtos Eletrônicos',
        tipoAplicacao: 'produto',
        prazoEntrega: 4,
        valor: 1200.00,
        observacoes: 'Seguro incluso para produtos eletrônicos'
      }
    ],
    criadoPor: 1,
    criadoEm: '2024-12-20T14:45:00'
  }
];

// Carregar dados do localStorage ou usar os dados iniciais
let freightRateTables: FreightRateTable[] = loadFreightRates(initialFreightRateTables);

// Function to generate next sequential code for rates
const getNextRateCode = (tableId: number): string => {
  const table = freightRateTables.find(t => t.id === tableId);
  if (!table || table.tarifas.length === 0) {
    return '0001';
  }
  
  // Get all numeric codes and find the highest
  const numericCodes = table.tarifas
    .map(r => parseInt(r.codigo))
    .filter(code => !isNaN(code))
    .sort((a, b) => b - a);
  
  const nextCode = numericCodes.length > 0 ? numericCodes[0] + 1 : 1;
  
  // Format with leading zeros (4 digits)
  return nextCode.toString().padStart(4, '0');
};

// Functions to manage freight rate tables
const addFreightRateTable = (table: Omit<FreightRateTable, 'id' | 'criadoEm'>) => {
  const newId = Math.max(...freightRateTables.map(t => t.id), 0) + 1;
  const newTable = { 
    ...table, 
    id: newId,
    criadoEm: new Date().toISOString()
  };
  freightRateTables.push(newTable);
  saveFreightRates(freightRateTables);
  return newTable;
};

const updateFreightRateTable = (id: number, updatedTable: Partial<FreightRateTable>) => {
  const index = freightRateTables.findIndex(t => t.id === id);
  if (index !== -1) {
    freightRateTables[index] = { 
      ...freightRateTables[index], 
      ...updatedTable,
      alteradoEm: new Date().toISOString()
    };
    saveFreightRates(freightRateTables);
    return freightRateTables[index];
  }
  return null;
};

const deleteFreightRateTable = (id: number) => {
  const index = freightRateTables.findIndex(t => t.id === id);
  if (index !== -1) {
    freightRateTables.splice(index, 1);
    saveFreightRates(freightRateTables);
    return true;
  }
  return false;
};

const getFreightRateTableById = (id: number) => {
  return freightRateTables.find(t => t.id === id) || null;
};

export const getFreightRateTablesByCarrier = (carrierId: number) => {
  return freightRateTables.filter(t => t.transportadorId === carrierId);
};

const getActiveFreightRateTables = () => {
  const today = new Date().toISOString().split('T')[0];
  return freightRateTables.filter(t => 
    t.status === 'ativo' && 
    t.dataInicio <= today && 
    t.dataFim >= today
  );
};

// Functions to manage rates within tables
export const addFreightRate = (tableId: number, rate: Omit<FreightRate, 'id' | 'codigo'>) => {
  const table = freightRateTables.find(t => t.id === tableId);
  if (!table) return null;
  
  const newId = Math.max(...table.tarifas.map(r => r.id), 0) + 1;
  const newCode = getNextRateCode(tableId);
  const newRate = { ...rate, id: newId, codigo: newCode };
  
  table.tarifas.push(newRate);
  table.alteradoEm = new Date().toISOString();
  
  saveFreightRates(freightRateTables);
  return newRate;
};

export const updateFreightRate = (tableId: number, rateId: number, updatedRate: Partial<FreightRate>) => {
  const table = freightRateTables.find(t => t.id === tableId);
  if (!table) return null;
  
  const rateIndex = table.tarifas.findIndex(r => r.id === rateId);
  if (rateIndex === -1) return null;
  
  table.tarifas[rateIndex] = { ...table.tarifas[rateIndex], ...updatedRate };
  table.alteradoEm = new Date().toISOString();
  
  saveFreightRates(freightRateTables);
  return table.tarifas[rateIndex];
};

export const deleteFreightRate = (tableId: number, rateId: number) => {
  const table = freightRateTables.find(t => t.id === tableId);
  if (!table) return false;
  
  const rateIndex = table.tarifas.findIndex(r => r.id === rateId);
  if (rateIndex === -1) return false;
  
  table.tarifas.splice(rateIndex, 1);
  table.alteradoEm = new Date().toISOString();
  
  saveFreightRates(freightRateTables);
  return true;
};

// Reactive data functions
const getAllFreightRateTables = () => {
  return freightRateTables;
};

const refreshFreightRateTables = () => {
  freightRateTables = [...freightRateTables];
  saveFreightRates(freightRateTables);
  return freightRateTables;
};