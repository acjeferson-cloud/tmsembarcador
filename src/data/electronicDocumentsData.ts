import { saveDocuments, loadDocuments } from '../services/storageService';

export type DocumentType = 'NFe' | 'CTe';
export type DocumentStatus = 'autorizado' | 'cancelado' | 'rejeitado' | 'processando';

export interface Emitente {
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual?: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
}

export interface Destinatario {
  razaoSocial: string;
  cnpjCpf: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
}

export interface ElectronicDocument {
  id: number;
  tipo: DocumentType;
  modelo: string; // '55' for NFe, '57' for CTe
  numeroDocumento: string;
  serie: string;
  chaveAcesso: string;
  protocoloAutorizacao: string;
  dataAutorizacao: string; // ISO date string from SEFAZ
  dataImportacao: string; // ISO date string when imported to system
  status: DocumentStatus;
  emitente: Emitente;
  destinatario?: Destinatario; // Optional for some CTe cases
  valorTotal: number;
  valorIcms?: number;
  valorFrete?: number;
  pesoTotal?: number; // For CTe
  modalTransporte?: string; // For CTe
  xmlContent?: string; // Base64 encoded XML content
}

// Dados iniciais
const initialDocuments: ElectronicDocument[] = [
  {
    id: 1,
    tipo: 'NFe',
    modelo: '55',
    numeroDocumento: '000000001',
    serie: '001',
    chaveAcesso: '35250112345678000199550010000000011123456789',
    protocoloAutorizacao: '135250000123456',
    dataAutorizacao: '2025-01-15T08:30:15',
    dataImportacao: '2025-01-15T09:15:22',
    status: 'autorizado',
    emitente: {
      razaoSocial: 'Empresa ABC Comércio Ltda',
      cnpj: '12.345.678/0001-99',
      inscricaoEstadual: '123.456.789.012',
      endereco: 'Av. Paulista, 1000 - Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
      cep: '01310-100'
    },
    destinatario: {
      razaoSocial: 'Cliente XYZ Distribuidora S.A.',
      cnpjCpf: '98.765.432/0001-11',
      endereco: 'Rua da Assembleia, 500 - Centro',
      cidade: 'Rio de Janeiro',
      uf: 'RJ',
      cep: '20011-000'
    },
    valorTotal: 15750.80,
    valorIcms: 2835.14,
    valorFrete: 450.00
  },
  {
    id: 2,
    tipo: 'CTe',
    modelo: '57',
    numeroDocumento: '000000001',
    serie: '001',
    chaveAcesso: '35250112345678000199570010000000011987654321',
    protocoloAutorizacao: '135250000987654',
    dataAutorizacao: '2025-01-15T10:45:30',
    dataImportacao: '2025-01-15T11:20:18',
    status: 'autorizado',
    emitente: {
      razaoSocial: 'Transportadora Rápida Ltda',
      cnpj: '11.222.333/0001-44',
      inscricaoEstadual: '234.567.890.123',
      endereco: 'Rod. Presidente Dutra, Km 180',
      cidade: 'Guarulhos',
      uf: 'SP',
      cep: '07034-911'
    },
    destinatario: {
      razaoSocial: 'Recebedor Final Ltda',
      cnpjCpf: '55.666.777/0001-88',
      endereco: 'Av. Atlântica, 2000',
      cidade: 'Rio de Janeiro',
      uf: 'RJ',
      cep: '22021-001'
    },
    valorTotal: 850.00,
    valorFrete: 850.00,
    pesoTotal: 2500,
    modalTransporte: 'Rodoviário'
  }
];

// Carregar dados do localStorage ou usar os dados iniciais
let electronicDocuments: ElectronicDocument[] = loadDocuments(initialDocuments);

// Functions to manage electronic documents
export const addElectronicDocument = (document: Omit<ElectronicDocument, 'id' | 'dataImportacao'>) => {
  const newId = Math.max(...electronicDocuments.map(d => d.id), 0) + 1;
  const newDocument = { 
    ...document, 
    id: newId,
    dataImportacao: new Date().toISOString()
  };
  electronicDocuments.push(newDocument);
  saveDocuments(electronicDocuments);
  return newDocument;
};

const updateElectronicDocument = (id: number, updatedDocument: Partial<ElectronicDocument>) => {
  const index = electronicDocuments.findIndex(d => d.id === id);
  if (index !== -1) {
    electronicDocuments[index] = { ...electronicDocuments[index], ...updatedDocument };
    saveDocuments(electronicDocuments);
    return electronicDocuments[index];
  }
  return null;
};

const deleteElectronicDocument = (id: number) => {
  const index = electronicDocuments.findIndex(d => d.id === id);
  if (index !== -1) {
    electronicDocuments.splice(index, 1);
    saveDocuments(electronicDocuments);
    return true;
  }
  return false;
};

const getElectronicDocumentById = (id: number) => {
  return electronicDocuments.find(d => d.id === id) || null;
};

const getElectronicDocumentByChaveAcesso = (chaveAcesso: string) => {
  return electronicDocuments.find(d => d.chaveAcesso === chaveAcesso) || null;
};

const getElectronicDocumentsByType = (tipo: DocumentType) => {
  return electronicDocuments.filter(d => d.tipo === tipo);
};

const getElectronicDocumentsByStatus = (status: DocumentStatus) => {
  return electronicDocuments.filter(d => d.status === status);
};

const getElectronicDocumentsByEmitente = (cnpj: string) => {
  return electronicDocuments.filter(d => d.emitente.cnpj === cnpj);
};

// Validation functions
export const isValidChaveAcesso = (chaveAcesso: string): boolean => {
  // Brazilian electronic document access key has 44 digits
  const numericRegex = /^\d{44}$/;
  return numericRegex.test(chaveAcesso);
};

export const isChaveAcessoUnique = (chaveAcesso: string, excludeId?: number): boolean => {
  return !electronicDocuments.some(d => d.chaveAcesso === chaveAcesso && d.id !== excludeId);
};

// Statistics functions
const getDocumentStats = () => {
  const total = electronicDocuments.length;
  const nfe = electronicDocuments.filter(d => d.tipo === 'NFe').length;
  const cte = electronicDocuments.filter(d => d.tipo === 'CTe').length;
  
  const autorizado = electronicDocuments.filter(d => d.status === 'autorizado').length;
  const cancelado = electronicDocuments.filter(d => d.status === 'cancelado').length;
  const rejeitado = electronicDocuments.filter(d => d.status === 'rejeitado').length;
  const processando = electronicDocuments.filter(d => d.status === 'processando').length;
  
  const totalValue = electronicDocuments
    .filter(d => d.status === 'autorizado')
    .reduce((sum, d) => sum + d.valorTotal, 0);
  
  return {
    total,
    types: { nfe, cte },
    status: { autorizado, cancelado, rejeitado, processando },
    totalValue
  };
};

// Reactive data functions
const getAllElectronicDocuments = () => {
  return electronicDocuments;
};

const refreshElectronicDocuments = () => {
  electronicDocuments = [...electronicDocuments];
  saveDocuments(electronicDocuments);
  return electronicDocuments;
};