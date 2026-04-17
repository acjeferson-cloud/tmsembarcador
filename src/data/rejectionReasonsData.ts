import { saveRejectionReasons, loadRejectionReasons } from '../services/storageService';

export interface RejectionReason {
  id: number;
  codigo: string; // 3-digit code (001-999)
  categoria: string;
  descricao: string;
  ativo: boolean;
  criadoPor?: number;
  criadoEm?: string;
  alteradoPor?: number;
  alteradoEm?: string;
}

// Dados iniciais com os códigos padrão de motivos de rejeição
const initialRejectionReasons: RejectionReason[] = [
  // Categoria: Inconsistências com Dados do Documento
  { id: 1, codigo: '001', categoria: 'Inconsistências com Dados do Documento', descricao: 'Transportador divergente do contrato homologado', ativo: true },
  { id: 2, codigo: '002', categoria: 'Inconsistências com Dados do Documento', descricao: 'CT-e emitido com CNPJ incorreto do remetente ou destinatário', ativo: true },
  { id: 3, codigo: '003', categoria: 'Inconsistências com Dados do Documento', descricao: 'CT-e com tomador divergente do informado no pedido ou contrato', ativo: true },
  { id: 4, codigo: '004', categoria: 'Inconsistências com Dados do Documento', descricao: 'Tipo de serviço não autorizado (normal, redespacho, subcontratação)', ativo: true },
  { id: 5, codigo: '005', categoria: 'Inconsistências com Dados do Documento', descricao: 'Classificação fiscal do frete (CFOP) incorreta', ativo: true },
  { id: 6, codigo: '006', categoria: 'Inconsistências com Dados do Documento', descricao: 'Número do pedido de compra não informado ou inválido', ativo: true },
  { id: 7, codigo: '007', categoria: 'Inconsistências com Dados do Documento', descricao: 'Duplicidade de CT-e para a mesma nota fiscal', ativo: true },
  { id: 8, codigo: '008', categoria: 'Inconsistências com Dados do Documento', descricao: 'Número da NF não existente ou não autorizado para embarque', ativo: true },
  { id: 9, codigo: '009', categoria: 'Inconsistências com Dados do Documento', descricao: 'Fatura sem correspondência com os CT-es entregues', ativo: true },
  { id: 10, codigo: '010', categoria: 'Inconsistências com Dados do Documento', descricao: 'Valor do ICMS divergente do parametrizado', ativo: true },
  
  // Categoria: Inconsistências de Valor
  { id: 11, codigo: '011', categoria: 'Inconsistências de Valor', descricao: 'Valor do CT-e superior ao previsto em tabela ou simulação', ativo: true },
  { id: 12, codigo: '012', categoria: 'Inconsistências de Valor', descricao: 'Diferença no valor de pedágios ou taxas adicionais', ativo: true },
  { id: 13, codigo: '013', categoria: 'Inconsistências de Valor', descricao: 'Cobrança indevida de GRIS, TDE, TRT ou taxa de retorno', ativo: true },
  { id: 14, codigo: '014', categoria: 'Inconsistências de Valor', descricao: 'Desconto não aplicado conforme política comercial', ativo: true },
  { id: 15, codigo: '015', categoria: 'Inconsistências de Valor', descricao: 'Diferença de peso ou cubagem em relação ao pedido original', ativo: true },
  { id: 16, codigo: '016', categoria: 'Inconsistências de Valor', descricao: 'Frete mínimo desrespeitado', ativo: true },
  { id: 17, codigo: '017', categoria: 'Inconsistências de Valor', descricao: 'Cobrança por redespacho sem justificativa operacional', ativo: true },
  { id: 18, codigo: '018', categoria: 'Inconsistências de Valor', descricao: 'Cobrança de taxa de devolução não autorizada', ativo: true },
  { id: 19, codigo: '019', categoria: 'Inconsistências de Valor', descricao: 'Cobrança por KM rodado sem validação de rota', ativo: true },
  
  // Categoria: Inconsistências Temporais e Operacionais
  { id: 20, codigo: '020', categoria: 'Inconsistências Temporais e Operacionais', descricao: 'Data de entrega fora do SLA contratual', ativo: true },
  { id: 21, codigo: '021', categoria: 'Inconsistências Temporais e Operacionais', descricao: 'Emissão do CT-e posterior à entrega (sem justificativa)', ativo: true },
  { id: 22, codigo: '022', categoria: 'Inconsistências Temporais e Operacionais', descricao: 'CT-e emitido antes da coleta física', ativo: true },
  { id: 23, codigo: '023', categoria: 'Inconsistências Temporais e Operacionais', descricao: 'Fatura gerada antes da conclusão da entrega', ativo: true },
  { id: 24, codigo: '024', categoria: 'Inconsistências Temporais e Operacionais', descricao: 'Entrega com ocorrência crítica registrada no EDI', ativo: true },
  { id: 25, codigo: '025', categoria: 'Inconsistências Temporais e Operacionais', descricao: 'Entregas com status pendente (não confirmado via EDI)', ativo: true },
  
  // Categoria: Inconsistências com Integrações e Sistemas
  { id: 26, codigo: '026', categoria: 'Inconsistências com Integrações e Sistemas', descricao: 'EDI com dados faltantes, divergentes ou fora de layout', ativo: true },
  { id: 27, codigo: '027', categoria: 'Inconsistências com Integrações e Sistemas', descricao: 'Ausência de evento EDI de entrega realizada', ativo: true },
  { id: 28, codigo: '028', categoria: 'Inconsistências com Integrações e Sistemas', descricao: 'EDI enviado fora do prazo acordado', ativo: true },
  { id: 29, codigo: '029', categoria: 'Inconsistências com Integrações e Sistemas', descricao: 'XML do CT-e não recebido ou inválido', ativo: true },
  { id: 30, codigo: '030', categoria: 'Inconsistências com Integrações e Sistemas', descricao: 'DANFE da fatura inválida ou sem XML vinculado', ativo: true },
  { id: 31, codigo: '031', categoria: 'Inconsistências com Integrações e Sistemas', descricao: 'CT-e ou NF sem registro no Portal da SEFAZ', ativo: true },
  
  // Categoria: Inconsistências Contratuais / Regulatórias
  { id: 32, codigo: '032', categoria: 'Inconsistências Contratuais / Regulatórias', descricao: 'Modal de transporte não autorizado para a rota', ativo: true },
  { id: 33, codigo: '033', categoria: 'Inconsistências Contratuais / Regulatórias', descricao: 'Transportadora sem seguro ou com apólice vencida', ativo: true },
  { id: 34, codigo: '034', categoria: 'Inconsistências Contratuais / Regulatórias', descricao: 'Transportadora inativa ou com pendências fiscais', ativo: true },
  { id: 35, codigo: '035', categoria: 'Inconsistências Contratuais / Regulatórias', descricao: 'Rota utilizada não corresponde à rota homologada', ativo: true },
  { id: 36, codigo: '036', categoria: 'Inconsistências Contratuais / Regulatórias', descricao: 'Regime tributário divergente do contratado (ex: SN vs LP)', ativo: true },
  { id: 37, codigo: '037', categoria: 'Inconsistências Contratuais / Regulatórias', descricao: 'Veículo utilizado não autorizado no contrato', ativo: true },
  { id: 38, codigo: '038', categoria: 'Inconsistências Contratuais / Regulatórias', descricao: 'Motorista não homologado ou com documentação vencida', ativo: true },
  
  // Categoria: Outros Motivos Técnicos ou Operacionais
  { id: 39, codigo: '039', categoria: 'Outros Motivos Técnicos ou Operacionais', descricao: 'Informações obrigatórias ausentes no CT-e', ativo: true },
  { id: 40, codigo: '040', categoria: 'Outros Motivos Técnicos ou Operacionais', descricao: 'Notas fiscais sem chave de acesso válida', ativo: true },
  { id: 41, codigo: '041', categoria: 'Outros Motivos Técnicos ou Operacionais', descricao: 'Falta de comprovante de entrega (POD)', ativo: true },
  { id: 42, codigo: '042', categoria: 'Outros Motivos Técnicos ou Operacionais', descricao: 'Faturas com CT-es de diferentes centros de custo', ativo: true },
  { id: 43, codigo: '043', categoria: 'Outros Motivos Técnicos ou Operacionais', descricao: 'Faturas emitidas fora da janela de corte', ativo: true },
  { id: 44, codigo: '044', categoria: 'Outros Motivos Técnicos ou Operacionais', descricao: 'Inconsistência de CFOP entre origem e destino', ativo: true },
  { id: 45, codigo: '045', categoria: 'Outros Motivos Técnicos ou Operacionais', descricao: 'Tentativa de faturamento de CT-e já rejeitado ou estornado', ativo: true },
  { id: 46, codigo: '046', categoria: 'Outros Motivos Técnicos ou Operacionais', descricao: 'Cobrança por serviços não contratados (armazenagem, estadia etc.)', ativo: true }
];

// Carregar dados do localStorage ou usar os dados iniciais
export let rejectionReasons: RejectionReason[] = loadRejectionReasons(initialRejectionReasons);

// Function to generate next sequential code
export const getNextRejectionReasonCode = (): string => {
  if (rejectionReasons.length === 0) {
    return '001';
  }
  
  // Get all numeric codes and find the highest
  const numericCodes = rejectionReasons
    .map(r => parseInt(r.codigo))
    .filter(code => !isNaN(code))
    .sort((a, b) => b - a);
  
  const nextCode = numericCodes.length > 0 ? numericCodes[0] + 1 : 1;
  
  // Format with leading zeros (3 digits)
  return nextCode.toString().padStart(3, '0');
};

// Functions to manage rejection reasons
const addRejectionReason = (reason: Omit<RejectionReason, 'id' | 'codigo' | 'criadoEm'>) => {
  const newId = Math.max(...rejectionReasons.map(r => r.id), 0) + 1;
  const newCode = getNextRejectionReasonCode();
  const newReason = { 
    ...reason, 
    id: newId,
    codigo: newCode,
    criadoEm: new Date().toISOString()
  };
  rejectionReasons.push(newReason);
  saveRejectionReasons(rejectionReasons);
  return newReason;
};

const updateRejectionReason = (id: number, updatedReason: Partial<RejectionReason>) => {
  const index = rejectionReasons.findIndex(r => r.id === id);
  if (index !== -1) {
    rejectionReasons[index] = { 
      ...rejectionReasons[index], 
      ...updatedReason,
      alteradoEm: new Date().toISOString()
    };
    saveRejectionReasons(rejectionReasons);
    return rejectionReasons[index];
  }
  return null;
};

const deleteRejectionReason = (id: number) => {
  const index = rejectionReasons.findIndex(r => r.id === id);
  if (index !== -1) {
    rejectionReasons.splice(index, 1);
    saveRejectionReasons(rejectionReasons);
    return true;
  }
  return false;
};

const getRejectionReasonById = (id: number) => {
  return rejectionReasons.find(r => r.id === id) || null;
};

const getRejectionReasonByCode = (codigo: string) => {
  return rejectionReasons.find(r => r.codigo === codigo) || null;
};

// Get all unique categories
const getAllCategories = () => {
  return Array.from(new Set(rejectionReasons.map(r => r.categoria))).sort();
};

// Validation function for rejection reason code
export const isValidRejectionReasonCode = (codigo: string): boolean => {
  // Check if it's a 3-digit numeric string
  const numericRegex = /^\d{3}$/;
  return numericRegex.test(codigo);
};

// Function to check if code already exists
export const isRejectionReasonCodeUnique = (codigo: string, excludeId?: number): boolean => {
  return !rejectionReasons.some(r => r.codigo === codigo && r.id !== excludeId);
};

// Reactive data functions
export const getAllRejectionReasons = () => {
  return rejectionReasons;
};

const refreshRejectionReasons = () => {
  rejectionReasons = [...rejectionReasons];
  saveRejectionReasons(rejectionReasons);
  return rejectionReasons;
};

// Get statistics about rejection reasons
const getRejectionReasonStats = () => {
  const total = rejectionReasons.length;
  const active = rejectionReasons.filter(r => r.ativo).length;
  const inactive = total - active;
  
  // Count by category
  const byCategory: Record<string, number> = {};
  rejectionReasons.forEach(reason => {
    if (!byCategory[reason.categoria]) {
      byCategory[reason.categoria] = 0;
    }
    byCategory[reason.categoria]++;
  });
  
  return {
    total,
    active,
    inactive,
    byCategory
  };
};
