import { CNPJ } from './cnpj';
import { normalizarCNPJ } from './formatter';

/**
 * Calcula o Dígito Verificador (DV) de uma base de CNPJ alfanumérico ou numérico.
 * A base deve conter exatamente 12 caracteres.
 * 
 * @param cnpjBase Base do CNPJ (12 caracteres, com ou sem máscara)
 * @returns Os dois dígitos verificadores (string)
 */
export function calcularDV(cnpjBase: string): string {
  const normalizado = normalizarCNPJ(cnpjBase);
  
  if (normalizado.length !== 12) {
    throw new Error('A base do CNPJ para cálculo do DV deve conter exatamente 12 caracteres.');
  }

  // Utiliza a classe oficial para o cálculo
  return CNPJ.calculaDV(normalizado);
}
