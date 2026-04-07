import * as XLSX from 'xlsx';

export interface ERPIntegrationTemplate {
  // Configurações Gerais
  erp_type: string;
  company_name: string;
  
  // Configurações SAP Business One
  service_layer_url: string;
  port: number;
  username: string;
  password: string;
  database: string;
  
  // Configurações CT-e
  cte_integration_type: string;
  cte_numeric_model_1: string;
  cte_numeric_model_2: string;
  cte_numeric_model_3: string;
  
  // Configurações de Faturamento
  billing_item_code: string;
  billing_usage: string;
  billing_control_account: string;
  
  // Configurações de Notas Fiscais
  nf_input_series: string;
  nf_output_series: string;
  nf_input_account: string;
  nf_output_account: string;
  
  // Configurações Adicionais
  xml_address: string;
  fiscal_module: string;
  integration_frequency: string;
  auto_sync: boolean;
  
  // Configurações de Mapeamento
  customer_mapping: string;
  supplier_mapping: string;
  product_mapping: string;
  
  // Configurações de Validação
  validate_documents: boolean;
  error_handling: string;
  notification_email: string;
}

export const generateERPIntegrationTemplate = (): void => {
  // Dados de exemplo para o template
  const templateData: ERPIntegrationTemplate[] = [
    {
      // Configurações Gerais
      erp_type: 'SAP Business One',
      company_name: 'Exemplo Empresa Ltda',
      
      // Configurações SAP Business One
      service_layer_url: 'https://servidor:50000/b1s/v1/',
      port: 50000,
      username: 'usuario_sap',
      password: 'senha_sap',
      database: 'EMPRESA_DB',
      
      // Configurações CT-e
      cte_integration_type: 'Automática',
      cte_numeric_model_1: '57',
      cte_numeric_model_2: '67',
      cte_numeric_model_3: '',
      
      // Configurações de Faturamento
      billing_item_code: 'FRETE001',
      billing_usage: 'Frete Rodoviário',
      billing_control_account: '3.1.01.001',
      
      // Configurações de Notas Fiscais
      nf_input_series: '1',
      nf_output_series: '1',
      nf_input_account: '1.1.03.001',
      nf_output_account: '1.1.01.001',
      
      // Configurações Adicionais
      xml_address: '/xmls/importacao/',
      fiscal_module: 'Ativo',
      integration_frequency: 'Tempo Real',
      auto_sync: true,
      
      // Configurações de Mapeamento
      customer_mapping: 'Por CNPJ',
      supplier_mapping: 'Por CNPJ',
      product_mapping: 'Por Código',
      
      // Configurações de Validação
      validate_documents: true,
      error_handling: 'Log e Notificação',
      notification_email: 'admin@empresa.com'
    }
  ];

  // Criar workbook
  const wb = XLSX.utils.book_new();
  
  // Criar worksheet com os dados
  const ws = XLSX.utils.json_to_sheet(templateData);
  
  // Definir larguras das colunas
  const colWidths = [
    { wch: 20 }, // erp_type
    { wch: 25 }, // company_name
    { wch: 30 }, // service_layer_url
    { wch: 10 }, // port
    { wch: 15 }, // username
    { wch: 15 }, // password
    { wch: 15 }, // database
    { wch: 20 }, // cte_integration_type
    { wch: 20 }, // cte_numeric_model_1
    { wch: 20 }, // cte_numeric_model_2
    { wch: 20 }, // cte_numeric_model_3
    { wch: 15 }, // billing_item_code
    { wch: 20 }, // billing_usage
    { wch: 20 }, // billing_control_account
    { wch: 15 }, // nf_input_series
    { wch: 15 }, // nf_output_series
    { wch: 20 }, // nf_input_account
    { wch: 20 }, // nf_output_account
    { wch: 25 }, // xml_address
    { wch: 15 }, // fiscal_module
    { wch: 20 }, // integration_frequency
    { wch: 12 }, // auto_sync
    { wch: 20 }, // customer_mapping
    { wch: 20 }, // supplier_mapping
    { wch: 20 }, // product_mapping
    { wch: 18 }, // validate_documents
    { wch: 20 }, // error_handling
    { wch: 25 }  // notification_email
  ];
  
  ws['!cols'] = colWidths;
  
  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Integração ERP');
  
  // Criar segunda aba com instruções
  const instructionsData = [
    {
      Campo: 'erp_type',
      Descrição: 'Tipo do ERP (SAP Business One, SAP S/4Hana Cloud Public Edition)',
      Obrigatório: 'Sim',
      Exemplo: 'SAP Business One'
    },
    {
      Campo: 'company_name',
      Descrição: 'Nome da empresa no ERP',
      Obrigatório: 'Sim',
      Exemplo: 'Exemplo Empresa Ltda'
    },
    {
      Campo: 'service_layer_url',
      Descrição: 'URL do Service Layer do SAP',
      Obrigatório: 'Sim',
      Exemplo: 'https://servidor:50000/b1s/v1/'
    },
    {
      Campo: 'port',
      Descrição: 'Porta de conexão',
      Obrigatório: 'Sim',
      Exemplo: '50000'
    },
    {
      Campo: 'username',
      Descrição: 'Usuário de conexão SAP',
      Obrigatório: 'Sim',
      Exemplo: 'usuario_sap'
    },
    {
      Campo: 'password',
      Descrição: 'Senha de conexão SAP',
      Obrigatório: 'Sim',
      Exemplo: 'senha_sap'
    },
    {
      Campo: 'database',
      Descrição: 'Nome da base de dados',
      Obrigatório: 'Sim',
      Exemplo: 'EMPRESA_DB'
    },
    {
      Campo: 'cte_integration_type',
      Descrição: 'Tipo de integração CT-e (Manual, Automática)',
      Obrigatório: 'Não',
      Exemplo: 'Automática'
    },
    {
      Campo: 'cte_numeric_model_1',
      Descrição: 'Modelo numérico CT-e 1',
      Obrigatório: 'Não',
      Exemplo: '57'
    },
    {
      Campo: 'cte_numeric_model_2',
      Descrição: 'Modelo numérico CT-e 2',
      Obrigatório: 'Não',
      Exemplo: '67'
    },
    {
      Campo: 'cte_numeric_model_3',
      Descrição: 'Modelo numérico CT-e 3',
      Obrigatório: 'Não',
      Exemplo: ''
    },
    {
      Campo: 'billing_item_code',
      Descrição: 'Código do item de faturamento',
      Obrigatório: 'Não',
      Exemplo: 'FRETE001'
    },
    {
      Campo: 'billing_usage',
      Descrição: 'Utilização do faturamento',
      Obrigatório: 'Não',
      Exemplo: 'Frete Rodoviário'
    },
    {
      Campo: 'billing_control_account',
      Descrição: 'Conta de controle do faturamento',
      Obrigatório: 'Não',
      Exemplo: '3.1.01.001'
    },
    {
      Campo: 'nf_input_series',
      Descrição: 'Série NF de entrada',
      Obrigatório: 'Não',
      Exemplo: '1'
    },
    {
      Campo: 'nf_output_series',
      Descrição: 'Série NF de saída',
      Obrigatório: 'Não',
      Exemplo: '1'
    },
    {
      Campo: 'nf_input_account',
      Descrição: 'Conta NF de entrada',
      Obrigatório: 'Não',
      Exemplo: '1.1.03.001'
    },
    {
      Campo: 'nf_output_account',
      Descrição: 'Conta NF de saída',
      Obrigatório: 'Não',
      Exemplo: '1.1.01.001'
    },
    {
      Campo: 'xml_address',
      Descrição: 'Endereço para XMLs',
      Obrigatório: 'Não',
      Exemplo: '/xmls/importacao/'
    },
    {
      Campo: 'fiscal_module',
      Descrição: 'Módulo fiscal (Ativo, Inativo)',
      Obrigatório: 'Não',
      Exemplo: 'Ativo'
    },
    {
      Campo: 'integration_frequency',
      Descrição: 'Frequência de integração (Tempo Real, Horária, Diária)',
      Obrigatório: 'Não',
      Exemplo: 'Tempo Real'
    },
    {
      Campo: 'auto_sync',
      Descrição: 'Sincronização automática (true, false)',
      Obrigatório: 'Não',
      Exemplo: 'true'
    },
    {
      Campo: 'customer_mapping',
      Descrição: 'Mapeamento de clientes (Por CNPJ, Por Código)',
      Obrigatório: 'Não',
      Exemplo: 'Por CNPJ'
    },
    {
      Campo: 'supplier_mapping',
      Descrição: 'Mapeamento de fornecedores (Por CNPJ, Por Código)',
      Obrigatório: 'Não',
      Exemplo: 'Por CNPJ'
    },
    {
      Campo: 'product_mapping',
      Descrição: 'Mapeamento de produtos (Por Código, Por Descrição)',
      Obrigatório: 'Não',
      Exemplo: 'Por Código'
    },
    {
      Campo: 'validate_documents',
      Descrição: 'Validar documentos (true, false)',
      Obrigatório: 'Não',
      Exemplo: 'true'
    },
    {
      Campo: 'error_handling',
      Descrição: 'Tratamento de erros (Log, Log e Notificação, Parar Processo)',
      Obrigatório: 'Não',
      Exemplo: 'Log e Notificação'
    },
    {
      Campo: 'notification_email',
      Descrição: 'Email para notificações',
      Obrigatório: 'Não',
      Exemplo: 'admin@empresa.com'
    }
  ];
  
  const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
  wsInstructions['!cols'] = [
    { wch: 25 }, // Campo
    { wch: 50 }, // Descrição
    { wch: 15 }, // Obrigatório
    { wch: 30 }  // Exemplo
  ];
  
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');
  
  // Gerar arquivo e fazer download
  XLSX.writeFile(wb, 'Template_Integracao_ERP.xlsx');
};

export const processERPIntegrationFile = (file: File): Promise<ERPIntegrationTemplate[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Ler primeira aba (dados)
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ERPIntegrationTemplate[];

        resolve(jsonData);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsArrayBuffer(file);
  });
};

// ===== CARRIERS TEMPLATE =====

interface CarrierTemplate {
  codigo: string;
  razao_social: string;
  fantasia: string;
  cnpj: string;
  inscricao_estadual: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
  pais: string;
  email: string;
  telefone: string;
  tolerancia_valor_cte: number;
  tolerancia_percentual_cte: number;
  tolerancia_valor_fatura: number;
  tolerancia_percentual_fatura: number;
  modal_rodoviario: string;
  modal_aereo: string;
  modal_aquaviario: string;
  modal_ferroviario: string;
  status: string;
}

export const generateCarriersTemplate = (): void => {
  // Dados de exemplo para o template
  const templateData: CarrierTemplate[] = [
    {
      codigo: 'TRANSP001',
      razao_social: 'Transportadora Exemplo Ltda',
      fantasia: 'Exemplo Transportes',
      cnpj: '12.345.678/0001-90',
      inscricao_estadual: '123.456.789.012',
      logradouro: 'Rua das Flores',
      numero: '1000',
      complemento: 'Galpão 5',
      bairro: 'Centro',
      cep: '88000-000',
      cidade: 'Florianópolis',
      estado: 'SC',
      pais: 'Brasil',
      email: 'contato@transportadora.com.br',
      telefone: '(48) 3333-4444',
      tolerancia_valor_cte: 10.00,
      tolerancia_percentual_cte: 2.5,
      tolerancia_valor_fatura: 20.00,
      tolerancia_percentual_fatura: 3.0,
      modal_rodoviario: 'Sim',
      modal_aereo: 'Não',
      modal_aquaviario: 'Não',
      modal_ferroviario: 'Não',
      status: 'Ativo'
    },
    {
      codigo: 'TRANSP002',
      razao_social: 'Logística Rápida S.A.',
      fantasia: 'LR Express',
      cnpj: '98.765.432/0001-10',
      inscricao_estadual: '987.654.321.098',
      logradouro: 'Avenida Principal',
      numero: '5000',
      complemento: 'Bloco A',
      bairro: 'Industrial',
      cep: '89000-000',
      cidade: 'São José',
      estado: 'SC',
      pais: 'Brasil',
      email: 'operacional@lrexpress.com.br',
      telefone: '(48) 2222-1111',
      tolerancia_valor_cte: 15.00,
      tolerancia_percentual_cte: 3.0,
      tolerancia_valor_fatura: 25.00,
      tolerancia_percentual_fatura: 4.0,
      modal_rodoviario: 'Sim',
      modal_aereo: 'Sim',
      modal_aquaviario: 'Não',
      modal_ferroviario: 'Não',
      status: 'Ativo'
    }
  ];

  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Criar worksheet com os dados
  const ws = XLSX.utils.json_to_sheet(templateData);

  // Definir larguras das colunas
  const colWidths = [
    { wch: 12 },  // codigo
    { wch: 35 },  // razao_social
    { wch: 25 },  // fantasia
    { wch: 20 },  // cnpj
    { wch: 20 },  // inscricao_estadual
    { wch: 30 },  // logradouro
    { wch: 8 },   // numero
    { wch: 15 },  // complemento
    { wch: 20 },  // bairro
    { wch: 12 },  // cep
    { wch: 20 },  // cidade
    { wch: 8 },   // estado
    { wch: 10 },  // pais
    { wch: 30 },  // email
    { wch: 18 },  // telefone
    { wch: 20 },  // tolerancia_valor_cte
    { wch: 25 },  // tolerancia_percentual_cte
    { wch: 22 },  // tolerancia_valor_fatura
    { wch: 28 },  // tolerancia_percentual_fatura
    { wch: 18 },  // modal_rodoviario
    { wch: 15 },  // modal_aereo
    { wch: 18 },  // modal_aquaviario
    { wch: 20 },  // modal_ferroviario
    { wch: 10 }   // status
  ];

  ws['!cols'] = colWidths;

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Transportadoras');

  // Criar segunda aba com instruções
  const instructionsData = [
    {
      Campo: 'codigo',
      Descrição: 'Código único da transportadora',
      Obrigatório: 'Sim',
      Formato: 'Texto (máx. 20 caracteres)',
      Exemplo: 'TRANSP001'
    },
    {
      Campo: 'razao_social',
      Descrição: 'Razão social da transportadora',
      Obrigatório: 'Sim',
      Formato: 'Texto',
      Exemplo: 'Transportadora Exemplo Ltda'
    },
    {
      Campo: 'fantasia',
      Descrição: 'Nome fantasia da transportadora',
      Obrigatório: 'Não',
      Formato: 'Texto',
      Exemplo: 'Exemplo Transportes'
    },
    {
      Campo: 'cnpj',
      Descrição: 'CNPJ da transportadora',
      Obrigatório: 'Sim',
      Formato: 'XX.XXX.XXX/XXXX-XX',
      Exemplo: '12.345.678/0001-90'
    },
    {
      Campo: 'inscricao_estadual',
      Descrição: 'Inscrição estadual',
      Obrigatório: 'Não',
      Formato: 'Texto',
      Exemplo: '123.456.789.012'
    },
    {
      Campo: 'logradouro',
      Descrição: 'Endereço (rua, avenida, etc)',
      Obrigatório: 'Não',
      Formato: 'Texto',
      Exemplo: 'Rua das Flores'
    },
    {
      Campo: 'numero',
      Descrição: 'Número do endereço',
      Obrigatório: 'Não',
      Formato: 'Texto',
      Exemplo: '1000'
    },
    {
      Campo: 'complemento',
      Descrição: 'Complemento do endereço',
      Obrigatório: 'Não',
      Formato: 'Texto',
      Exemplo: 'Galpão 5'
    },
    {
      Campo: 'bairro',
      Descrição: 'Bairro',
      Obrigatório: 'Não',
      Formato: 'Texto',
      Exemplo: 'Centro'
    },
    {
      Campo: 'cep',
      Descrição: 'CEP do endereço',
      Obrigatório: 'Não',
      Formato: 'XXXXX-XXX',
      Exemplo: '88000-000'
    },
    {
      Campo: 'cidade',
      Descrição: 'Nome da cidade',
      Obrigatório: 'Não',
      Formato: 'Texto',
      Exemplo: 'Florianópolis'
    },
    {
      Campo: 'estado',
      Descrição: 'Sigla do estado (UF)',
      Obrigatório: 'Não',
      Formato: 'XX',
      Exemplo: 'SC'
    },
    {
      Campo: 'pais',
      Descrição: 'Nome do país',
      Obrigatório: 'Não',
      Formato: 'Texto',
      Exemplo: 'Brasil'
    },
    {
      Campo: 'email',
      Descrição: 'Email de contato',
      Obrigatório: 'Não',
      Formato: 'email@dominio.com',
      Exemplo: 'contato@transportadora.com.br'
    },
    {
      Campo: 'telefone',
      Descrição: 'Telefone de contato',
      Obrigatório: 'Não',
      Formato: '(XX) XXXX-XXXX',
      Exemplo: '(48) 3333-4444'
    },
    {
      Campo: 'tolerancia_valor_cte',
      Descrição: 'Tolerância em R$ para divergência em CT-e',
      Obrigatório: 'Não',
      Formato: 'Número (decimal)',
      Exemplo: '10.00'
    },
    {
      Campo: 'tolerancia_percentual_cte',
      Descrição: 'Tolerância em % para divergência em CT-e',
      Obrigatório: 'Não',
      Formato: 'Número (decimal)',
      Exemplo: '2.5'
    },
    {
      Campo: 'tolerancia_valor_fatura',
      Descrição: 'Tolerância em R$ para divergência em fatura',
      Obrigatório: 'Não',
      Formato: 'Número (decimal)',
      Exemplo: '20.00'
    },
    {
      Campo: 'tolerancia_percentual_fatura',
      Descrição: 'Tolerância em % para divergência em fatura',
      Obrigatório: 'Não',
      Formato: 'Número (decimal)',
      Exemplo: '3.0'
    },
    {
      Campo: 'modal_rodoviario',
      Descrição: 'Transportadora opera modal rodoviário',
      Obrigatório: 'Não',
      Formato: 'Sim ou Não',
      Exemplo: 'Sim'
    },
    {
      Campo: 'modal_aereo',
      Descrição: 'Transportadora opera modal aéreo',
      Obrigatório: 'Não',
      Formato: 'Sim ou Não',
      Exemplo: 'Não'
    },
    {
      Campo: 'modal_aquaviario',
      Descrição: 'Transportadora opera modal aquaviário',
      Obrigatório: 'Não',
      Formato: 'Sim ou Não',
      Exemplo: 'Não'
    },
    {
      Campo: 'modal_ferroviario',
      Descrição: 'Transportadora opera modal ferroviário',
      Obrigatório: 'Não',
      Formato: 'Sim ou Não',
      Exemplo: 'Não'
    },
    {
      Campo: 'status',
      Descrição: 'Status da transportadora no sistema',
      Obrigatório: 'Sim',
      Formato: 'Ativo ou Inativo',
      Exemplo: 'Ativo'
    }
  ];

  const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
  wsInstructions['!cols'] = [
    { wch: 28 }, // Campo
    { wch: 45 }, // Descrição
    { wch: 15 }, // Obrigatório
    { wch: 25 }, // Formato
    { wch: 30 }  // Exemplo
  ];

  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');

  // Gerar arquivo e fazer download
  XLSX.writeFile(wb, 'Template_Transportadoras.xlsx');
};

export const processCarriersFile = (file: File): Promise<CarrierTemplate[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Ler primeira aba (dados)
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as CarrierTemplate[];

        resolve(jsonData);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsArrayBuffer(file);
  });
};

// ===== FREIGHT RATES TEMPLATE (FLAT) =====

export interface FlatFreightRateTemplate {
  cnpj_transportador: string;
  nome_tabela: string;
  modal: string;
  validade_inicio: string;
  validade_fim: string;
  origem_uf: string;
  destino_uf: string;
  destino_cidade: string;
  prazo_entrega: number;
  pedagio_fracao: number;
  pedagio_valor: number;
  gris_percentual: number;
  taxa_despacho: number;
  frete_minimo: number;
  faixa_peso_ate: number | string;
  valor_faixa: number;
  tipo_calculo: string;
}

export const generateFreightRatesTemplate = (): void => {
  const wb = XLSX.utils.book_new();

  const tabelasData: FlatFreightRateTemplate[] = [
    {
      cnpj_transportador: '12.345.678/0001-90',
      nome_tabela: 'Tabela Nacional Flat 2026',
      modal: 'rodoviario',
      validade_inicio: '01/01/2026',
      validade_fim: '31/12/2026',
      origem_uf: 'SP',
      destino_uf: 'RJ',
      destino_cidade: 'Rio de Janeiro',
      prazo_entrega: 2,
      pedagio_fracao: 100,
      pedagio_valor: 5.50,
      gris_percentual: 0.3,
      taxa_despacho: 25.00,
      frete_minimo: 150.00,
      faixa_peso_ate: 10,
      valor_faixa: 55.00,
      tipo_calculo: 'Fixo'
    },
    {
      cnpj_transportador: '12.345.678/0001-90',
      nome_tabela: 'Tabela Nacional Flat 2026',
      modal: 'rodoviario',
      validade_inicio: '01/01/2026',
      validade_fim: '31/12/2026',
      origem_uf: 'SP',
      destino_uf: 'RJ',
      destino_cidade: 'Rio de Janeiro',
      prazo_entrega: 2,
      pedagio_fracao: 100,
      pedagio_valor: 5.50,
      gris_percentual: 0.3,
      taxa_despacho: 25.00,
      frete_minimo: 150.00,
      faixa_peso_ate: 30,
      valor_faixa: 110.00,
      tipo_calculo: 'Fixo'
    },
    {
      cnpj_transportador: '12.345.678/0001-90',
      nome_tabela: 'Tabela Nacional Flat 2026',
      modal: 'rodoviario',
      validade_inicio: '01/01/2026',
      validade_fim: '31/12/2026',
      origem_uf: 'SP',
      destino_uf: 'RJ',
      destino_cidade: 'Rio de Janeiro',
      prazo_entrega: 2,
      pedagio_fracao: 100,
      pedagio_valor: 5.50,
      gris_percentual: 0.3,
      taxa_despacho: 25.00,
      frete_minimo: 150.00,
      faixa_peso_ate: 99999,
      valor_faixa: 1.25,
      tipo_calculo: 'Excedente'
    }
  ];

  const wsTabelas = XLSX.utils.json_to_sheet(tabelasData);
  wsTabelas['!cols'] = [
    { wch: 22 },  // cnpj_transportador
    { wch: 35 },  // nome_tabela
    { wch: 15 },  // modal
    { wch: 20 },  // validade_inicio
    { wch: 20 },  // validade_fim
    { wch: 12 },  // origem_uf
    { wch: 12 },  // destino_uf
    { wch: 30 },  // destino_cidade
    { wch: 22 },  // prazo_entrega
    { wch: 20 },  // pedagio_fracao
    { wch: 18 },  // pedagio_valor
    { wch: 20 },  // gris_percentual
    { wch: 20 },  // taxa_despacho
    { wch: 22 },  // frete_minimo
    { wch: 23 },  // faixa_peso_ate
    { wch: 20 },  // valor_faixa
    { wch: 18 }   // tipo_calculo
  ];
  XLSX.utils.book_append_sheet(wb, wsTabelas, 'Tabela de Importação Base');

  // ABA 2: Instruções
  const instructionsData = [
    { Campo: 'cnpj_transportador', Descrição: 'CNPJ válido do transportador cadastrado', Obrigatório: 'Sim', Exemplo: '12.345.678/0001-90' },
    { Campo: 'nome_tabela', Descrição: 'Nome da tabela de frete', Obrigatório: 'Sim', Exemplo: 'Tabela Nacional Flat 2026' },
    { Campo: 'modal', Descrição: 'Modal da tabela (rodoviario, aereo, aquaviario, ferroviario)', Obrigatório: 'Sim', Exemplo: 'rodoviario' },
    { Campo: 'validade_inicio', Descrição: 'Data de início (DD/MM/YYYY)', Obrigatório: 'Sim', Exemplo: '01/01/2026' },
    { Campo: 'validade_fim', Descrição: 'Data de fim de vigência (DD/MM/YYYY)', Obrigatório: 'Sim', Exemplo: '31/12/2026' },
    { Campo: 'origem_uf', Descrição: 'Sigla do estado de origem (Ex: SP)', Obrigatório: 'Sim', Exemplo: 'SP' },
    { Campo: 'destino_uf', Descrição: 'Sigla do estado de destino (Ex: RJ)', Obrigatório: 'Sim', Exemplo: 'RJ' },
    { Campo: 'destino_cidade', Descrição: 'Nome exato do Município de destino. Deixe vazio para aplicar ao UF todo.', Obrigatório: 'Não', Exemplo: 'Rio de Janeiro' },
    { Campo: 'prazo_entrega', Descrição: 'Prazo estipulado em dias úteis', Obrigatório: 'Sim', Exemplo: '5' },
    { Campo: 'pedagio_fracao', Descrição: 'Fração em KG. Ex: 100 para "Pedágio a cada 100kg". Se não houver, 0.', Obrigatório: 'Não', Exemplo: '100' },
    { Campo: 'pedagio_valor', Descrição: 'Valor do Pedágio cobrado referente à fração', Obrigatório: 'Não', Exemplo: '5.50' },
    { Campo: 'gris_percentual', Descrição: 'Percentual do GRIS cobrado (já com ponto/virgula, Ex: 0.3 para 0,3%)', Obrigatório: 'Não', Exemplo: '0.3' },
    { Campo: 'taxa_despacho', Descrição: 'Taxa fixa de Despacho (R$)', Obrigatório: 'Não', Exemplo: '25.00' },
    { Campo: 'frete_minimo', Descrição: 'Valor mínimo cobrado na tarifa (R$)', Obrigatório: 'Não', Exemplo: '150.00' },
    { Campo: 'faixa_peso_ate', Descrição: 'Limite de peso em KG da faixa atual. Para peso Excedente infinito: 99999', Obrigatório: 'Sim', Exemplo: '10' },
    { Campo: 'valor_faixa', Descrição: 'Valor financeiro ou custo desta faixa', Obrigatório: 'Sim', Exemplo: '55.00' },
    { Campo: 'tipo_calculo', Descrição: 'Formato que o motor de cálculo vai aplicar nesta faixa', Obrigatório: 'Sim', Exemplo: 'Fixo ou Excedente' },
    { Campo: '---', Descrição: '---', Obrigatório: '---', Exemplo: '---' },
    { Campo: 'INSTRUÇÃO IMPORTANTE 1', Descrição: 'Não altere o nome das colunas da Aba 1.', Obrigatório: '', Exemplo: '' },
    { Campo: 'INSTRUÇÃO IMPORTANTE 2', Descrição: 'Para rotas com múltiplas faixas de peso, repita as mesmíssimas informações de Cabeçalho na nova linha, alterando apenas os detalhes de Faixa (Colunas 15 a 17)', Obrigatório: '', Exemplo: '' },
    { Campo: 'INSTRUÇÃO IMPORTANTE 3', Descrição: 'Exemplo: Se a Rota SP->RJ tem 3 faixas de peso (0 a 10, Até 30, e Excedente), serão 3 LINHAS idênticas até a coluna 14.', Obrigatório: '', Exemplo: '' }
  ];

  const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
  wsInstructions['!cols'] = [
    { wch: 30 }, // Campo
    { wch: 100 }, // Descrição
    { wch: 15 }, // Obrigatório
    { wch: 30 }  // Exemplo
  ];

  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');

  XLSX.writeFile(wb, 'Template_Tabelas_Frete_Embarcador.xlsx');
};

export const processFreightRatesFile = (file: File): Promise<FlatFreightRateTemplate[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          throw new Error('Aba principal nao encontrada na planilha.');
        }

        const flatData = XLSX.utils.sheet_to_json(worksheet) as FlatFreightRateTemplate[];
        resolve(flatData);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsArrayBuffer(file);
  });
};

// ===== FREIGHT RATE CITIES TEMPLATE =====

interface FreightRateCityTemplate {
  transportador_codigo: string;
  tabela_nome: string;
  tarifa_codigo: string;
  cidade_nome: string;
  estado_sigla: string;
  prazo_entrega_dias: number;
}

export const generateFreightRateCitiesTemplate = (): void => {
  try {
    const wb = XLSX.utils.book_new();

  // ABA 1: Cidades
  const cidadesData: FreightRateCityTemplate[] = [
    {
      transportador_codigo: 'TRANSP001',
      tabela_nome: 'Tabela Nacional 2025',
      tarifa_codigo: 'TAR001',
      cidade_nome: 'São Paulo',
      estado_sigla: 'SP',
      prazo_entrega_dias: 5
    },
    {
      transportador_codigo: 'TRANSP001',
      tabela_nome: 'Tabela Nacional 2025',
      tarifa_codigo: 'TAR001',
      cidade_nome: 'Campinas',
      estado_sigla: 'SP',
      prazo_entrega_dias: 5
    },
    {
      transportador_codigo: 'TRANSP001',
      tabela_nome: 'Tabela Nacional 2025',
      tarifa_codigo: 'TAR001',
      cidade_nome: 'Santos',
      estado_sigla: 'SP',
      prazo_entrega_dias: 6
    }
  ];

  const wsCidades = XLSX.utils.json_to_sheet(cidadesData);
  wsCidades['!cols'] = [
    { wch: 22 },  // transportador_codigo
    { wch: 30 },  // tabela_nome
    { wch: 15 },  // tarifa_codigo
    { wch: 30 },  // cidade_nome
    { wch: 15 },  // estado_sigla
    { wch: 20 }   // prazo_entrega_dias
  ];
  XLSX.utils.book_append_sheet(wb, wsCidades, 'Cidades');

  // ABA 2: Instruções
  const instructionsData = [
    { Campo: 'transportador_codigo', Descrição: 'Código da transportadora (deve existir no sistema)', Obrigatório: 'Sim', Formato: 'Texto', Exemplo: 'TRANSP001' },
    { Campo: 'tabela_nome', Descrição: 'Nome da tabela de frete (deve existir no sistema)', Obrigatório: 'Sim', Formato: 'Texto', Exemplo: 'Tabela Nacional 2025' },
    { Campo: 'tarifa_codigo', Descrição: 'Código da tarifa (deve existir na tabela)', Obrigatório: 'Sim', Formato: 'Texto', Exemplo: 'TAR001' },
    { Campo: 'cidade_nome', Descrição: 'Nome da cidade (deve existir no sistema)', Obrigatório: 'Sim', Formato: 'Texto', Exemplo: 'São Paulo' },
    { Campo: 'estado_sigla', Descrição: 'Sigla do estado (UF)', Obrigatório: 'Sim', Formato: 'XX', Exemplo: 'SP' },
    { Campo: 'prazo_entrega_dias', Descrição: 'Prazo de entrega em dias úteis', Obrigatório: 'Não', Formato: 'Número', Exemplo: '5' },
    { Campo: '', Descrição: '', Obrigatório: '', Formato: '', Exemplo: '' },
    { Campo: 'OBSERVAÇÕES', Descrição: 'Uma cidade só pode estar vinculada a UMA tarifa por tabela', Obrigatório: '', Formato: '', Exemplo: '' },
    { Campo: 'OBSERVAÇÕES', Descrição: 'O sistema validará se a cidade já está em uso na tabela', Obrigatório: '', Formato: '', Exemplo: '' },
    { Campo: 'OBSERVAÇÕES', Descrição: 'A cidade deve existir no cadastro de cidades do sistema', Obrigatório: '', Formato: '', Exemplo: '' }
  ];

  const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
  wsInstructions['!cols'] = [
    { wch: 25 },  // Campo
    { wch: 50 },  // Descrição
    { wch: 15 },  // Obrigatório
    { wch: 20 },  // Formato
    { wch: 30 }   // Exemplo
  ];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');

    // Gerar arquivo e fazer download
    XLSX.writeFile(wb, 'Template_Cidades_Tarifas.xlsx');
  } catch (error) {

    throw new Error('Não foi possível gerar o template de cidades. Verifique se o navegador permite downloads.');
  }
};

const processFreightRateCitiesFile = (file: File): Promise<FreightRateCityTemplate[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Ler aba Cidades
        const cidadesSheet = workbook.Sheets['Cidades'];
        const cidades = cidadesSheet ? XLSX.utils.sheet_to_json(cidadesSheet) as FreightRateCityTemplate[] : [];

        resolve(cidades);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsArrayBuffer(file);
  });
};

// ===== ADDITIONAL FEES TEMPLATE =====

interface AdditionalFeeTemplate {
  transportador_codigo: string;
  tabela_nome: string;
  tarifa_codigo: string;
  tipo_taxa: string;
  parceiro_negocio_documento: string;
  considerar_raiz_cnpj: string;
  estado_sigla: string;
  cidade_nome: string;
  valor_taxa: number;
  tipo_valor: string;
  valor_minimo: number;
}

export const generateAdditionalFeesTemplate = (): void => {
  try {
    const wb = XLSX.utils.book_new();

  // ABA 1: Taxas Adicionais
  const taxasData: AdditionalFeeTemplate[] = [
    {
      transportador_codigo: 'TRANSP001',
      tabela_nome: 'Tabela Nacional 2025',
      tarifa_codigo: 'TAR001',
      tipo_taxa: 'TDA',
      parceiro_negocio_documento: '',
      considerar_raiz_cnpj: 'Não',
      estado_sigla: 'SP',
      cidade_nome: 'São Paulo',
      valor_taxa: 50.00,
      tipo_valor: 'Fixo',
      valor_minimo: 0
    },
    {
      transportador_codigo: 'TRANSP001',
      tabela_nome: 'Tabela Nacional 2025',
      tarifa_codigo: 'TAR001',
      tipo_taxa: 'TDE',
      parceiro_negocio_documento: '',
      considerar_raiz_cnpj: 'Não',
      estado_sigla: 'RJ',
      cidade_nome: 'Rio de Janeiro',
      valor_taxa: 2.5,
      tipo_valor: 'Percentual sobre Peso',
      valor_minimo: 30.00
    }
  ];

  const wsTaxas = XLSX.utils.json_to_sheet(taxasData);
  wsTaxas['!cols'] = [
    { wch: 22 },  // transportador_codigo
    { wch: 30 },  // tabela_nome
    { wch: 15 },  // tarifa_codigo
    { wch: 12 },  // tipo_taxa
    { wch: 28 },  // parceiro_negocio_documento
    { wch: 22 },  // considerar_raiz_cnpj
    { wch: 15 },  // estado_sigla
    { wch: 30 },  // cidade_nome
    { wch: 15 },  // valor_taxa
    { wch: 28 },  // tipo_valor
    { wch: 15 }   // valor_minimo
  ];
  XLSX.utils.book_append_sheet(wb, wsTaxas, 'Taxas Adicionais');

  // ABA 2: Instruções
  const instructionsData = [
    { Campo: 'transportador_codigo', Descrição: 'Código da transportadora', Obrigatório: 'Sim', Formato: 'Texto', Exemplo: 'TRANSP001' },
    { Campo: 'tabela_nome', Descrição: 'Nome da tabela de frete', Obrigatório: 'Sim', Formato: 'Texto', Exemplo: 'Tabela Nacional 2025' },
    { Campo: 'tarifa_codigo', Descrição: 'Código da tarifa (deixe em branco para tabela toda)', Obrigatório: 'Não', Formato: 'Texto', Exemplo: 'TAR001' },
    { Campo: 'tipo_taxa', Descrição: 'Tipo da taxa adicional', Obrigatório: 'Sim', Formato: 'TDA, TDE ou TRT', Exemplo: 'TDA' },
    { Campo: 'parceiro_negocio_documento', Descrição: 'CNPJ do parceiro (deixe em branco para todos)', Obrigatório: 'Não', Formato: 'XX.XXX.XXX/XXXX-XX', Exemplo: '12.345.678/0001-90' },
    { Campo: 'considerar_raiz_cnpj', Descrição: 'Considerar raiz do CNPJ', Obrigatório: 'Não', Formato: 'Sim ou Não', Exemplo: 'Sim' },
    { Campo: 'estado_sigla', Descrição: 'Sigla do estado (deixe em branco para todos)', Obrigatório: 'Não', Formato: 'XX', Exemplo: 'SP' },
    { Campo: 'cidade_nome', Descrição: 'Nome da cidade (deixe em branco para todas)', Obrigatório: 'Não', Formato: 'Texto', Exemplo: 'São Paulo' },
    { Campo: 'valor_taxa', Descrição: 'Valor da taxa', Obrigatório: 'Sim', Formato: 'Número decimal', Exemplo: '50.00' },
    { Campo: 'tipo_valor', Descrição: 'Tipo de valor da taxa', Obrigatório: 'Sim', Formato: 'Ver tipos abaixo', Exemplo: 'Fixo' },
    { Campo: 'valor_minimo', Descrição: 'Valor mínimo da taxa', Obrigatório: 'Não', Formato: 'Número decimal', Exemplo: '30.00' },
    { Campo: '', Descrição: '', Obrigatório: '', Formato: '', Exemplo: '' },
    { Campo: 'TIPOS DE TAXA', Descrição: 'TDA = Taxa de Armazenagem', Obrigatório: '', Formato: '', Exemplo: '' },
    { Campo: 'TIPOS DE TAXA', Descrição: 'TDE = Taxa de Entrega', Obrigatório: '', Formato: '', Exemplo: '' },
    { Campo: 'TIPOS DE TAXA', Descrição: 'TRT = Taxa de Reentrega', Obrigatório: '', Formato: '', Exemplo: '' },
    { Campo: '', Descrição: '', Obrigatório: '', Formato: '', Exemplo: '' },
    { Campo: 'TIPOS DE VALOR', Descrição: 'Fixo', Obrigatório: '', Formato: '', Exemplo: '' },
    { Campo: 'TIPOS DE VALOR', Descrição: 'Percentual sobre Peso', Obrigatório: '', Formato: '', Exemplo: '' },
    { Campo: 'TIPOS DE VALOR', Descrição: 'Percentual sobre Valor', Obrigatório: '', Formato: '', Exemplo: '' },
    { Campo: 'TIPOS DE VALOR', Descrição: 'Percentual sobre Peso e Valor', Obrigatório: '', Formato: '', Exemplo: '' },
    { Campo: 'TIPOS DE VALOR', Descrição: 'Percentual sobre CT-e', Obrigatório: '', Formato: '', Exemplo: '' }
  ];

  const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
  wsInstructions['!cols'] = [
    { wch: 30 },  // Campo
    { wch: 50 },  // Descrição
    { wch: 15 },  // Obrigatório
    { wch: 25 },  // Formato
    { wch: 30 }   // Exemplo
  ];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');

    // Gerar arquivo e fazer download
    XLSX.writeFile(wb, 'Template_Taxas_Adicionais.xlsx');
  } catch (error) {

    throw new Error('Não foi possível gerar o template de taxas adicionais. Verifique se o navegador permite downloads.');
  }
};

const processAdditionalFeesFile = (file: File): Promise<AdditionalFeeTemplate[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Ler aba Taxas Adicionais
        const taxasSheet = workbook.Sheets['Taxas Adicionais'];
        const taxas = taxasSheet ? XLSX.utils.sheet_to_json(taxasSheet) as AdditionalFeeTemplate[] : [];

        resolve(taxas);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsArrayBuffer(file);
  });
};