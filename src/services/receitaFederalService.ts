import { validarCNPJ, normalizarCNPJ, formatarCNPJ } from '../utils/cnpj';

interface ReceitaFederalResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: string;
  data_situacao_cadastral: string;
  cnae_fiscal: string;
  cnae_fiscal_descricao: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  email: string;
}

enum SituacaoCadastral {
  ATIVA = 'ATIVA',
  BAIXADA = 'BAIXADA',
  INAPTA = 'INAPTA',
  SUSPENSA = 'SUSPENSA',
  NULA = 'NULA'
}

interface StatusInfo {
  emoji: string;
  status: SituacaoCadastral;
  descricao: string;
  permiteImportar: boolean;
}

const STATUS_CADASTRAL: Record<SituacaoCadastral, StatusInfo> = {
  [SituacaoCadastral.ATIVA]: {
    emoji: '🟢',
    status: SituacaoCadastral.ATIVA,
    descricao: 'Empresa em situação regular, com atividades em andamento',
    permiteImportar: true
  },
  [SituacaoCadastral.BAIXADA]: {
    emoji: '🔴',
    status: SituacaoCadastral.BAIXADA,
    descricao: 'Empresa encerrada oficialmente',
    permiteImportar: false
  },
  [SituacaoCadastral.INAPTA]: {
    emoji: '🟠',
    status: SituacaoCadastral.INAPTA,
    descricao: 'Empresa omissa em declarações ou irregular perante o Fisco',
    permiteImportar: false
  },
  [SituacaoCadastral.SUSPENSA]: {
    emoji: '🟣',
    status: SituacaoCadastral.SUSPENSA,
    descricao: 'Empresa temporariamente impedida de operar',
    permiteImportar: false
  },
  [SituacaoCadastral.NULA]: {
    emoji: '⚫',
    status: SituacaoCadastral.NULA,
    descricao: 'CNPJ anulado por fraude, duplicidade ou erro cadastral grave',
    permiteImportar: false
  }
};

export const receitaFederalService = {
  async consultarCNPJ(cnpj: string): Promise<ReceitaFederalResponse> {
    const cnpjLimpo = normalizarCNPJ(cnpj);

    if (cnpjLimpo.length !== 14) {
      throw new Error('CNPJ inválido. Deve conter 14 caracteres.');
    }

    if (!validarCNPJ(cnpjLimpo)) {
      throw new Error('CNPJ inválido. Dígitos verificadores incorretos.');
    }

    let isNotFound = true;

    const apis = [
      {
        name: 'brasilapi',
        fetch: () => fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`),
        map: (data: any) => ({
          cnpj: formatarCNPJ(data.cnpj),
          razao_social: data.razao_social || '',
          nome_fantasia: data.nome_fantasia || data.razao_social || '',
          situacao_cadastral: data.descricao_situacao_cadastral || '',
          data_situacao_cadastral: data.data_situacao_cadastral || '',
          cnae_fiscal: data.cnae_fiscal_principal?.codigo?.toString() || data.cnae_fiscal?.toString() || '',
          cnae_fiscal_descricao: data.cnae_fiscal_principal?.descricao || data.cnae_fiscal_descricao || '',
          logradouro: data.logradouro || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          municipio: data.municipio || '',
          uf: data.uf || '',
          cep: data.cep ? this.formatarCEP(data.cep) : '',
          ddd_telefone_1: data.ddd_telefone_1 || '',
          ddd_telefone_2: data.ddd_telefone_2 || '',
          email: data.email || '',
        })
      },
      {
        name: 'cnpjws',
        fetch: () => fetch(`https://publica.cnpj.ws/cnpj/${cnpjLimpo}`),
        map: (data: any) => {
          const estab = data.estabelecimento || {};
          const atividade = estab.atividade_principal || {};
          return {
            cnpj: formatarCNPJ(estab.cnpj || cnpjLimpo),
            razao_social: data.razao_social || '',
            nome_fantasia: estab.nome_fantasia || data.razao_social || '',
            situacao_cadastral: estab.situacao_cadastral || '',
            data_situacao_cadastral: estab.data_situacao_cadastral || '',
            cnae_fiscal: atividade.id || '',
            cnae_fiscal_descricao: atividade.descricao || '',
            logradouro: estab.logradouro || '',
            numero: estab.numero || '',
            complemento: estab.complemento || '',
            bairro: estab.bairro || '',
            municipio: estab.cidade?.nome || '',
            uf: estab.estado?.sigla || '',
            cep: estab.cep ? this.formatarCEP(estab.cep) : '',
            ddd_telefone_1: estab.ddd1 || '',
            ddd_telefone_2: estab.ddd2 || '',
            email: estab.email || '',
          };
        }
      },
      {
        name: 'minhareceita',
        fetch: () => fetch(`https://minhareceita.org/${cnpjLimpo}`),
        map: (data: any) => ({
          cnpj: formatarCNPJ(data.cnpj),
          razao_social: data.razao_social || data.nome_empresarial || '',
          nome_fantasia: data.nome_fantasia || data.razao_social || '',
          situacao_cadastral: data.descricao_situacao_cadastral || data.situacao_cadastral || '',
          data_situacao_cadastral: data.data_situacao_cadastral || '',
          cnae_fiscal: data.cnae_fiscal || '',
          cnae_fiscal_descricao: data.cnae_fiscal_descricao || '',
          logradouro: data.logradouro || data.descricao_tipo_de_logradouro || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          municipio: data.municipio || '',
          uf: data.uf || '',
          cep: data.cep ? this.formatarCEP(data.cep) : '',
          ddd_telefone_1: data.ddd_telefone_1 || '',
          ddd_telefone_2: data.ddd_telefone_2 || '',
          email: data.email || '',
        })
      }
    ];

    for (const api of apis) {
      try {
        const response = await api.fetch();
        if (response.ok) {
          const data = await response.json();
          return api.map(data);
        }
        if (response.status !== 404) {
          isNotFound = false; // Falhou por erro de servidor ou rate limit, não porque o CNPJ não existe
        }
      } catch (error) {
        // Falha de rede, CORS, bloqueio de adblocker, etc.
        isNotFound = false; 
      }
    }

    if (isNotFound) {
      throw new Error('CNPJ não encontrado na base da Receita Federal.');
    } else {
      throw new Error('Não foi possível realizar a consulta. Verifique possíveis bloqueios em sua infraestrutura interna de rede (Firewall, Proxy Corporativo ou Extensões/AdBlock).');
    }
  },



  formatarCEP(cep: string): string {
    cep = cep.replace(/\D/g, '');
    return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  },

  getStatusInfo(situacaoCadastral: string): StatusInfo | null {
    const statusNormalizado = situacaoCadastral.toUpperCase().trim();

    // Buscar correspondência exata
    const statusEnum = Object.values(SituacaoCadastral).find(
      s => s === statusNormalizado
    );

    if (statusEnum) {
      return STATUS_CADASTRAL[statusEnum];
    }

    // Se não encontrou, retornar null
    return null;
  },

  permiteImportacao(situacaoCadastral: string): boolean {
    const statusInfo = this.getStatusInfo(situacaoCadastral);
    return statusInfo?.permiteImportar || false;
  },

  getMensagemStatus(situacaoCadastral: string): string {
    const statusInfo = this.getStatusInfo(situacaoCadastral);

    if (!statusInfo) {
      return `Status cadastral "${situacaoCadastral}" não reconhecido. Por segurança, a importação não será permitida.`;
    }

    if (statusInfo.permiteImportar) {
      return `${statusInfo.emoji} ${statusInfo.status} - ${statusInfo.descricao}`;
    }

    return `${statusInfo.emoji} ${statusInfo.status} - ${statusInfo.descricao}. Importação não permitida.`;
  },
};
