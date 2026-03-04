import { saveOccurrences, loadOccurrences } from '../services/storageService';

export interface Occurrence {
  id: number;
  codigo: string; // 3-digit code (001-999)
  descricao: string;
  criadoPor?: number;
  criadoEm?: string;
  alteradoPor?: number;
  alteradoEm?: string;
}

// Dados iniciais com os códigos padrão de ocorrências
const initialOccurrences: Occurrence[] = [
  { id: 1, codigo: '001', descricao: 'Entrega Realizada Normalmente' },
  { id: 2, codigo: '002', descricao: 'Entrega Fora da Data Programada' },
  { id: 3, codigo: '003', descricao: 'Recusa por Falta de Pedido de Compra' },
  { id: 4, codigo: '004', descricao: 'Recusa por Pedido de Compra Cancelado' },
  { id: 5, codigo: '005', descricao: 'Falta de Espaço Físico no Depósito do Cliente Destino' },
  { id: 6, codigo: '006', descricao: 'Falta de Espaço Físico no Depósito do Cliente' },
  { id: 7, codigo: '007', descricao: 'Endereço do Cliente Destino Incompleto ou Incorreto' },
  { id: 8, codigo: '008', descricao: 'Veículo Não Autorizado pelo Cliente' },
  { id: 9, codigo: '009', descricao: 'Cliente Recusou em Desacordo com Pedido de Compra' },
  { id: 10, codigo: '010', descricao: 'Mercadoria em Desacordo com o Pedido de Compra' },
  { id: 11, codigo: '011', descricao: 'Cliente Destino somente Recebe com Frete Pago' },
  { id: 12, codigo: '012', descricao: 'Recusa por Deficiência Embalagem Mercadoria' },
  { id: 13, codigo: '013', descricao: 'Redespacho não Indicado' },
  { id: 14, codigo: '014', descricao: 'Transportadora não Atende a Cidade do Cliente Destino' },
  { id: 15, codigo: '015', descricao: 'Mercadoria Sinistrada' },
  { id: 16, codigo: '016', descricao: 'Embalagem Sinistrada' },
  { id: 17, codigo: '017', descricao: 'Pedido de Compras em Duplicidade' },
  { id: 18, codigo: '018', descricao: 'Mercadoria fora da Embalagem Adequada' },
  { id: 19, codigo: '019', descricao: 'Mercadorias Trocadas' },
  { id: 20, codigo: '020', descricao: 'Retentativa Solicitada pelo Cliente' },
  { id: 21, codigo: '021', descricao: 'Entrega Prejudicada por Horário/Falta de Tempo Hábil' },
  { id: 22, codigo: '022', descricao: 'Cliente Estabelecimento Fechado' },
  { id: 23, codigo: '023', descricao: 'Cliente em Condição de Greve' },
  { id: 24, codigo: '024', descricao: 'Extravio de Mercadoria em Trânsito' },
  { id: 25, codigo: '025', descricao: 'Mercadoria Reentregue com Autorização' },
  { id: 26, codigo: '026', descricao: 'Mercadoria Devolvida com Autorização de Retorno' },
  { id: 27, codigo: '027', descricao: 'Nota Fiscal Retida ou Apreendida pela Fiscalização' },
  { id: 28, codigo: '028', descricao: 'Roubo de Carga' },
  { id: 29, codigo: '029', descricao: 'Mercadoria Retida até a Segunda Ordem' },
  { id: 30, codigo: '030', descricao: 'Problema com a Documentação (Nota Fiscal / CRTC)' },
  { id: 31, codigo: '031', descricao: 'Cliente Fechado para Balanço' },
  { id: 32, codigo: '032', descricao: 'Falta com Solicitação de Reposição' },
  { id: 33, codigo: '033', descricao: 'Falta com Busca/Reconferência' },
  { id: 34, codigo: '034', descricao: 'Cliente Fechado para Balanço' },
  { id: 35, codigo: '035', descricao: 'Quantidade de Produto em Desacordo (Nota Fiscal e/ou Pedido)' },
  { id: 36, codigo: '036', descricao: 'Pedido de Compra Incompleto' },
  { id: 37, codigo: '037', descricao: 'Nota Fiscal com Produtos de Setores Diferentes' },
  { id: 38, codigo: '038', descricao: 'Feriado Local/Nacional' },
  { id: 39, codigo: '039', descricao: 'Escolta de Veículos' },
  { id: 40, codigo: '040', descricao: 'Cliente Destino Encerrou Atividades' },
  { id: 41, codigo: '041', descricao: 'Responsável de Recebimento não Localizado' },
  { id: 42, codigo: '042', descricao: 'Cliente Destino em Greve' },
  { id: 43, codigo: '043', descricao: 'Greve nacional (geral)' },
  { id: 44, codigo: '044', descricao: 'Entrar em Contato com o Comprador' },
  { id: 45, codigo: '045', descricao: 'Troca não Disponível' },
  { id: 46, codigo: '046', descricao: 'Fins Estatísticos' },
  { id: 47, codigo: '047', descricao: 'Data de Entrega Diferente do Pedido' },
  { id: 48, codigo: '048', descricao: 'Inutilização Tributária' },
  { id: 49, codigo: '049', descricao: 'Sistema Fora do Ar' },
  { id: 50, codigo: '050', descricao: 'Cliente Destino não Recebe Pedido Parcial' },
  { id: 51, codigo: '051', descricao: 'Cliente Destino não Recebe Pedido Fracionado' },
  { id: 52, codigo: '052', descricao: 'Redespacho somente com Frete Pago' },
  { id: 53, codigo: '053', descricao: 'Funcionário não autorizado para Receber Mercadorias' },
  { id: 54, codigo: '054', descricao: 'Mercadoria Embarcada para Rota Indevida' },
  { id: 55, codigo: '055', descricao: 'Estrada/Entrada de Acesso Interditada' },
  { id: 56, codigo: '056', descricao: 'Cliente Destino Mudou de Endereço' },
  { id: 57, codigo: '057', descricao: 'Avaria Total' },
  { id: 58, codigo: '058', descricao: 'Avaria Parcial' },
  { id: 59, codigo: '059', descricao: 'Extravio Total' },
  { id: 60, codigo: '060', descricao: 'Extravio Parcial' },
  { id: 61, codigo: '061', descricao: 'Sobra de Mercadoria sem Nota Fiscal' },
  { id: 62, codigo: '062', descricao: 'Mercadoria em poder da SUFRAMA para Internação' },
  { id: 63, codigo: '063', descricao: 'Mercadoria Retirada para Conferência' },
  { id: 64, codigo: '064', descricao: 'Apreensão Fiscal' },
  { id: 65, codigo: '065', descricao: 'Excesso de Carga/Peso' },
  { id: 66, codigo: '066', descricao: 'Entrega Programada' },
  { id: 67, codigo: '091', descricao: 'Problemas Físicos' },
  { id: 68, codigo: '099', descricao: 'Outros tipos de ocorrências não especificadas acima' }
];

// Carregar dados do localStorage ou usar os dados iniciais
export let occurrences: Occurrence[] = loadOccurrences(initialOccurrences);

// Function to generate next sequential code
export const getNextOccurrenceCode = (): string => {
  if (occurrences.length === 0) {
    return '001';
  }
  
  // Get all numeric codes and find the highest
  const numericCodes = occurrences
    .map(o => parseInt(o.codigo))
    .filter(code => !isNaN(code))
    .sort((a, b) => b - a);
  
  const nextCode = numericCodes.length > 0 ? numericCodes[0] + 1 : 1;
  
  // Format with leading zeros (3 digits)
  return nextCode.toString().padStart(3, '0');
};

// Functions to manage occurrences
const addOccurrence = (occurrence: Omit<Occurrence, 'id' | 'codigo' | 'criadoEm'>) => {
  const newId = Math.max(...occurrences.map(o => o.id), 0) + 1;
  const newCode = getNextOccurrenceCode();
  const newOccurrence = { 
    ...occurrence, 
    id: newId,
    codigo: newCode,
    criadoEm: new Date().toISOString()
  };
  occurrences.push(newOccurrence);
  saveOccurrences(occurrences);
  return newOccurrence;
};

const updateOccurrence = (id: number, updatedOccurrence: Partial<Occurrence>) => {
  const index = occurrences.findIndex(o => o.id === id);
  if (index !== -1) {
    occurrences[index] = { 
      ...occurrences[index], 
      ...updatedOccurrence,
      alteradoEm: new Date().toISOString()
    };
    saveOccurrences(occurrences);
    return occurrences[index];
  }
  return null;
};

const deleteOccurrence = (id: number) => {
  const index = occurrences.findIndex(o => o.id === id);
  if (index !== -1) {
    occurrences.splice(index, 1);
    saveOccurrences(occurrences);
    return true;
  }
  return false;
};

const getOccurrenceById = (id: number) => {
  return occurrences.find(o => o.id === id) || null;
};

const getOccurrenceByCode = (codigo: string) => {
  return occurrences.find(o => o.codigo === codigo) || null;
};

// Validation function for occurrence code
export const isValidOccurrenceCode = (codigo: string): boolean => {
  // Check if it's a 3-digit numeric string
  const numericRegex = /^\d{3}$/;
  return numericRegex.test(codigo);
};

// Function to check if code already exists
export const isOccurrenceCodeUnique = (codigo: string, excludeId?: number): boolean => {
  return !occurrences.some(o => o.codigo === codigo && o.id !== excludeId);
};

// Reactive data functions
const getAllOccurrences = () => {
  return occurrences;
};

const refreshOccurrences = () => {
  occurrences = [...occurrences];
  saveOccurrences(occurrences);
  return occurrences;
};