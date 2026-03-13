import { CNPJ } from './cnpj';
import { normalizarCNPJ } from './formatter';

/**
 * Valida se um CNPJ (numérico ou alfanumérico) é válido.
 * 
 * O fluxo de validação inclui normalizar a entrada, verificar o tamanho,
 * e validar os dígitos verificadores calculados em relação à base informada.
 * 
 * @param cnpj CNPJ a ser validado
 * @returns true se for um CNPJ válido, false caso contrário
 */
export function validarCNPJ(cnpj: string | null | undefined): boolean {
  if (!cnpj) return false;

  // 1. normalizar entrada
  const normalizado = normalizarCNPJ(cnpj);

  // 2. validar tamanho
  if (normalizado.length !== 14) {
    return false;
  }

  // A validação completa (separar DV, calcular, etc) ocorre dentro da classe CNPJ.isValid
  // usando a lógica homologada da Receita Federal.
  return CNPJ.isValid(normalizado);
}
