/**
 * Normaliza o CNPJ mantendo apenas caracteres alfanuméricos.
 * Remove espaços, pontuação e converte para maiúsculas se houver letras.
 *
 * @param cnpj CNPJ a ser normalizado
 * @returns CNPJ contendo apenas letras e números
 */
export function normalizarCNPJ(cnpj: string): string {
  if (!cnpj) return '';
  return cnpj.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Formata um CNPJ (numérico ou alfanumérico) aplicando a máscara padrão:
 * XX.XXX.XXX/XXXX-XX
 *
 * Se o CNPJ não tiver 14 caracteres, retorna o valor normalizado sem máscara.
 *
 * @param cnpj CNPJ a ser formatado
 * @returns CNPJ formatado com a máscara
 */
export function formatarCNPJ(cnpj: string): string {
  const normalizado = normalizarCNPJ(cnpj);
  
  if (normalizado.length !== 14) {
    return normalizado;
  }

  return normalizado.replace(/^([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{4})([0-9]{2})$/, '$1.$2.$3/$4-$5');
}
