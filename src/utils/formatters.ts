// Formatadores para uso em toda a aplicação
import { normalizarCNPJ, formatarCNPJ as formatarCNPJCentral } from './cnpj/formatter';

// Formata CNPJ: 00.000.000/0000-00 (e Alfanumérico)
export const formatCNPJ = (cnpj: string): string => {
  return formatarCNPJCentral(cnpj);
};

// Formata CPF: 000.000.000-00
const formatCPF = (cpf: string): string => {
  if (!cpf) return '';
  
  // Remove caracteres não numéricos
  const numericCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (numericCPF.length !== 11) return cpf;
  
  // Formata como 000.000.000-00
  return numericCPF.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    '$1.$2.$3-$4'
  );
};

// Formata CEP: 00000-000
const formatCEP = (cep: string): string => {
  if (!cep) return '';
  
  // Remove caracteres não numéricos
  const numericCEP = cep.replace(/\D/g, '');
  
  // Verifica se tem 8 dígitos
  if (numericCEP.length !== 8) return cep;
  
  // Formata como 00000-000
  return numericCEP.replace(/^(\d{5})(\d{3})$/, '$1-$2');
};

// Formata telefone: (00) 00000-0000 ou (00) 0000-0000
export const formatPhone = (phone: string): string => {
  if (!phone) return '';

  // Remove caracteres não numéricos
  const numericPhone = phone.replace(/\D/g, '');

  // Permite digitação progressiva
  if (numericPhone.length <= 2) {
    return numericPhone;
  }

  if (numericPhone.length <= 6) {
    return `(${numericPhone.slice(0, 2)}) ${numericPhone.slice(2)}`;
  }

  // Celular com 11 dígitos (com 9 na frente)
  if (numericPhone.length === 11) {
    return numericPhone.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      '($1) $2-$3'
    );
  }

  // Telefone fixo com 10 dígitos
  if (numericPhone.length === 10) {
    return numericPhone.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      '($1) $2-$3'
    );
  }

  // Durante digitação (parcial)
  if (numericPhone.length > 6 && numericPhone.length < 10) {
    return `(${numericPhone.slice(0, 2)}) ${numericPhone.slice(2, 6)}-${numericPhone.slice(6)}`;
  }

  // Celular parcial
  if (numericPhone.length > 6) {
    return `(${numericPhone.slice(0, 2)}) ${numericPhone.slice(2, 7)}-${numericPhone.slice(7, 11)}`;
  }

  return phone;
};

// Formata valor monetário: R$ 0.000,00
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

// Formata data: DD/MM/YYYY
const formatDate = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('pt-BR');
};

// Formata data e hora: DD/MM/YYYY HH:MM
const formatDateTime = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleString('pt-BR');
};

// Formata percentual: 00,00%
const formatPercentage = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Formata número com separador de milhares: 1.000.000
const formatNumber = (value: number): string => {
  return value.toLocaleString('pt-BR');
};

// Formata peso: 0.000,00 kg
const formatWeight = (value: number): string => {
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} kg`;
};

// Formata chave de acesso NFe/CTe com espaços a cada 4 dígitos
export const formatAccessKey = (key: string): string => {
  if (!key) return '';

  // Remove caracteres não numéricos
  const numericKey = key.replace(/\D/g, '');

  // Verifica se tem 44 dígitos
  if (numericKey.length !== 44) return key;

  // Formata com espaços a cada 4 dígitos
  return numericKey.replace(/(\d{4})(?=\d)/g, '$1 ');
};

// Formata texto em Title Case (Primeira Letra Maiúscula de Cada Palavra)
export const formatTitleCase = (text: string): string => {
  if (!text) return '';

  // Palavras que devem permanecer em minúsculo (conectivos, preposições, artigos)
  const minorWords = [
    'a', 'o', 'e', 'de', 'da', 'do', 'das', 'dos',
    'em', 'no', 'na', 'nos', 'nas', 'por', 'para',
    'com', 'sem', 'sob', 'sobre', 'ao', 'aos', 'à', 'às'
  ];

  return text
    .toLowerCase()
    .trim()
    .split(' ')
    .map((word, index) => {
      // Sempre capitaliza a primeira palavra
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }

      // Verifica se é uma palavra menor (preposição, artigo, etc)
      if (minorWords.includes(word)) {
        return word;
      }

      // Capitaliza as demais palavras
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

// Formata nomes de empresas com tratamento especial para siglas
export const formatCompanyName = (text: string): string => {
  if (!text) return '';

  // Lista de siglas empresariais que devem permanecer em maiúsculo
  const companySuffixes = [
    'LTDA', 'ME', 'EPP', 'MEI', 'EIRELI', 'SA', 'S/A', 'S.A.',
    'CIA', 'CIA.', 'SS', 'S.S.', 'LTDA.', 'LDA', 'LDA.'
  ];

  // Palavras que devem permanecer em minúsculo
  const minorWords = [
    'a', 'o', 'e', 'de', 'da', 'do', 'das', 'dos',
    'em', 'no', 'na', 'nos', 'nas', 'por', 'para',
    'com', 'sem', 'sob', 'sobre', 'ao', 'aos', 'à', 'às'
  ];

  // Converte para uppercase para comparação e depois trabalha com lowercase
  const upperText = text.toUpperCase();

  return text
    .toLowerCase()
    .trim()
    .split(' ')
    .map((word, index) => {
      const upperWord = word.toUpperCase();

      // Verifica se é uma sigla empresarial
      if (companySuffixes.includes(upperWord.replace(/\./g, ''))) {
        return upperWord;
      }

      // Verifica se é uma sigla genérica (2-6 letras maiúsculas sem pontos)
      // mas apenas se no texto original estava em maiúsculo
      const originalWord = text.trim().split(' ')[index];
      if (originalWord && originalWord === originalWord.toUpperCase() &&
          /^[A-Z]{2,6}$/.test(originalWord)) {
        return upperWord;
      }

      // Sempre capitaliza a primeira palavra
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }

      // Verifica se é uma palavra menor
      if (minorWords.includes(word)) {
        return word;
      }

      // Capitaliza as demais palavras
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

// Formata CNPJ durante digitação (com formatação progressiva)
export const formatCNPJInput = (value: string): string => {
  if (!value) return '';

  // Remove caracteres não alfanuméricos
  const numericValue = normalizarCNPJ(value);

  // Limita a 14 caracteres
  const limited = numericValue.slice(0, 14);

  // Aplica formatação progressiva
  if (limited.length <= 2) {
    return limited;
  }
  if (limited.length <= 5) {
    return `${limited.slice(0, 2)}.${limited.slice(2)}`;
  }
  if (limited.length <= 8) {
    return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5)}`;
  }
  if (limited.length <= 12) {
    return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8)}`;
  }

  return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8, 12)}-${limited.slice(12, 14)}`;
};

// Remove formatação de CNPJ (retorna apenas números e letras permitidas)
export const unformatCNPJ = (cnpj: string): string => {
  return normalizarCNPJ(cnpj);
};

// Remove formatação de telefone (retorna apenas números)
export const unformatPhone = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};