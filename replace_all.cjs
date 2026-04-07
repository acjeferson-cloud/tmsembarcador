const fs = require('fs');

let content = fs.readFileSync('c:\\\\desenvolvimento\\\\tmsembarcador\\\\src\\\\services\\\\templateService.ts', 'utf-8');

const startMarker = '// ===== FREIGHT RATES TEMPLATE =====';
const endMarker = '// ===== FREIGHT RATE CITIES TEMPLATE =====';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) + `// ===== FREIGHT RATES TEMPLATE (FLAT) =====

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

` + content.substring(endIndex);

  fs.writeFileSync('c:\\\\desenvolvimento\\\\tmsembarcador\\\\src\\\\services\\\\templateService.ts', newContent);
  console.log("Substituido limpo e perfeito!");
} else {
  console.log("Indices nao encontrados", startIndex, endIndex);
}
