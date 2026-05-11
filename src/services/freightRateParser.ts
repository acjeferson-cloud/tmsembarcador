import { supabase } from '../lib/supabase';
import { FlatFreightRateTemplate } from './templateService';
import { FreightRateTable, FreightRateDetail, FreightRate } from './freightRatesService';

export interface ParseResult {
  success: boolean;
  errors: string[];
  tables?: Omit<FreightRateTable, 'id'>[];
  rates?: Omit<FreightRate, 'id'>[];
  details?: Omit<FreightRateDetail, 'id'>[];
}

const parseNumber = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const cleanStr = val.replace(/\s/g, '').replace('R$', '').replace('%', '').replace(',', '.');
    const num = Number(cleanStr);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

export const parseBulkFreightRates = async (
  flatData: FlatFreightRateTemplate[],
  tenantContext: { organization_id: string; environment_id: string; establishment_id: string; created_by?: string }
): Promise<ParseResult> => {
  const errors: string[] = [];

  if (!flatData || flatData.length === 0) {
    return { success: false, errors: ['A planilha está vazia.'] };
  }

  // Normalizar keys para evitar problemas com trailing spaces do header do Excel
  const normalizedFlatData = flatData.map(row => {
    const newRow: any = {};
    for (const key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        const cleanKey = String(key).trim(); // Mantemos o case original, só tiramos espaços
        newRow[cleanKey] = (row as any)[key];
      }
    }
    return newRow as FlatFreightRateTemplate;
  });

  // Validar obrigatoriedade na primeira linha
  const baseHeaders = ['codigo_transportador', 'nome_tabela', 'modal', 'validade_inicio', 'validade_fim', 'origem_uf', 'destino_uf', 'prazo_entrega', 'faixa_peso_ate', 'valor_faixa', 'tipo_calculo'];
  
  const foundKeys = Object.keys(normalizedFlatData[0] || {});
  
  for (const header of baseHeaders) {
    if (normalizedFlatData[0][header as keyof FlatFreightRateTemplate] === undefined) {
      errors.push(`Coluna obrigatória ausente: ${header}. (Colunas encontradas: ${foundKeys.join(', ')})`);
    }
  }

  if (errors.length > 0) return { success: false, errors };

  // 1. Traduzir Codigo transportador => UUIDs no business_partners
  const uniqueRawCodes = [...new Set(normalizedFlatData.map(r => r.codigo_transportador).filter(Boolean))];
  const uniqueCodes = uniqueRawCodes.map(c => String(c).padStart(4, '0'));

  const { data: partnersData, error: partnersError } = await supabase
    .from('carriers')
    .select('id, codigo')
    .in('codigo', uniqueCodes)
    .eq('organization_id', tenantContext.organization_id);

  if (partnersError) {
    return { success: false, errors: ['Erro ao validar Transportadores no banco de dados.'] };
  }

  const codeMap = new Map<string, string>();
  partnersData?.forEach(p => {
    codeMap.set(p.codigo, p.id);
  });

  // Validar se todos os transportadores existem
  const missingCarriers = new Set<string>();
  uniqueRawCodes.forEach(rawCode => {
    const padded = String(rawCode).padStart(4, '0');
    if (!codeMap.has(padded)) missingCarriers.add(String(rawCode));
  });

  if (missingCarriers.size > 0) {
    errors.push(`Não encontramos Transportadores com os seguintes Códigos: ${Array.from(missingCarriers).join(', ')}`);
    return { success: false, errors };
  }

  // Agrupamento hierárquico
  const defaultStatus = 'ativo';

  const tablesMap = new Map<string, any>(); // key: nome_tabela + cnpj
  const ratesMap = new Map<string, any>();  // key: tableKey + origem + destino
  const detailsList: any[] = [];

  normalizedFlatData.forEach((row, index) => {
    const rowNum = index + 2; // +1 pro array 0, +1 pro header
    
    // Tratamento de datas
    const [dIn, mIn, yIn] = String(row.validade_inicio || '').split('/');
    const dateInicio = new Date(`${yIn}-${mIn}-${dIn}T00:00:00Z`).toISOString();
    const [dFim, mFim, yFim] = String(row.validade_fim || '').split('/');
    const dateFim = new Date(`${yFim}-${mFim}-${dFim}T23:59:59Z`).toISOString();

    const carrierId = codeMap.get(String(row.codigo_transportador).padStart(4, '0'));

    // 1. Capa
    const tableKey = `${row.nome_tabela}_${carrierId}`;
    if (!tablesMap.has(tableKey)) {
      const tablePayload: any = {
        nome: row.nome_tabela,
        transportador_id: carrierId,
        modal: row.modal,
        data_inicio: dateInicio,
        data_fim: dateFim,
        status: defaultStatus,
        table_type: 'Saída', // Assumido default
        organization_id: tenantContext.organization_id,
        environment_id: tenantContext.environment_id,
        establishment_id: tenantContext.establishment_id
      };

      if (tenantContext.created_by) {
        tablePayload.created_by = tenantContext.created_by;
      }

      tablesMap.set(tableKey, tablePayload);
    }

    // 2. Tarifa (Rate)
    const rateKey = `${tableKey}_${row.origem_uf}_${row.destino_uf}_${row.destino_cidade || ''}`;
    if (!ratesMap.has(rateKey)) {
      const nextRateNumber = ratesMap.size + 1;
      ratesMap.set(rateKey, {
        _tableKey: tableKey,
        _rateKey: rateKey,
        codigo: `TAR${String(nextRateNumber).padStart(4, '0')}`,
        descricao: `${row.origem_uf} para ${row.destino_cidade || row.destino_uf}`,
        tipo_aplicacao: row.destino_cidade ? 'cidade' : 'estado',
        data_inicio: dateInicio,
        data_fim: dateFim,
        prazo_entrega: parseNumber(row.prazo_entrega),
        
        pedagio_minimo: parseNumber(row.pedagio_minimo),
        pedagio_por_kg: parseNumber(row.pedagio_por_kg),
        pedagio_a_cada_kg: parseNumber(row.pedagio_a_cada_kg),
        pedagio_tipo_kg: row.pedagio_tipo_kg || 'peso_calculo',
        
        icms_embutido_tabela: row.icms_embutido_tabela || 'nao_embutido',
        aliquota_icms: parseNumber(row.aliquota_icms),
        
        fator_m3: parseNumber(row.fator_m3),
        fator_m3_apartir_kg: parseNumber(row.fator_m3_apartir_kg),
        fator_m3_apartir_m3: parseNumber(row.fator_m3_apartir_m3),
        fator_m3_apartir_valor: parseNumber(row.fator_m3_apartir_valor),
        
        percentual_gris: parseNumber(row.percentual_gris),
        gris_minimo: parseNumber(row.gris_minimo),
        seccat: parseNumber(row.seccat),
        despacho: parseNumber(row.despacho),
        itr: parseNumber(row.itr),
        taxa_adicional: parseNumber(row.taxa_adicional),
        taxa_coleta: parseNumber(row.taxa_coleta),
        taxa_entrega: parseNumber(row.taxa_entrega),
        tde_trt: parseNumber(row.tde_trt),
        tas: parseNumber(row.tas),
        taxa_suframa: parseNumber(row.taxa_suframa),
        
        valor_outros_percent: parseNumber(row.valor_outros_percent),
        valor_outros_minimo: parseNumber(row.valor_outros_minimo),
        taxa_outros_valor: parseNumber(row.taxa_outros_valor),
        taxa_outros_tipo_valor: row.taxa_outros_tipo_valor || 'valor',
        taxa_apartir_de: parseNumber(row.taxa_apartir_de),
        taxa_apartir_de_tipo: row.taxa_apartir_de_tipo || 'sem_apartir',
        taxa_outros_a_cada: parseNumber(row.taxa_outros_a_cada),
        taxa_outros_minima: parseNumber(row.taxa_outros_minima),
        
        frete_peso_minimo: parseNumber(row.frete_peso_minimo),
        frete_valor_minimo: parseNumber(row.frete_valor_minimo),
        frete_tonelada_minima: parseNumber(row.frete_tonelada_minima),
        frete_percentual_minimo: parseNumber(row.frete_percentual_minimo),
        frete_m3_minimo: parseNumber(row.frete_m3_minimo),
        valor_total_minimo: parseNumber(row.valor_total_minimo),

        _origem: row.origem_uf,
        _destino: row.destino_uf,
        _destino_cidade: row.destino_cidade,
        organization_id: tenantContext.organization_id,
        environment_id: tenantContext.environment_id,
        establishment_id: tenantContext.establishment_id
      });
    }

    // 3. Faixas (Details)
    let peso_ate = parseNumber(row.faixa_peso_ate);
    if (isNaN(peso_ate) || peso_ate > 99000 || peso_ate === 0) peso_ate = 999999;
    
    let fracao_base = row.fracao_base ? parseNumber(row.fracao_base) : null;
    if (fracao_base !== null && (isNaN(fracao_base) || fracao_base === 0)) fracao_base = null;

    detailsList.push({
      _rateKey: rateKey,
      ordem: parseNumber(row.detalhe_ordem) || detailsList.filter(d => d._rateKey === rateKey).length + 1,
      peso_ate: peso_ate,
      m3_ate: parseNumber(row.faixa_m3_ate),
      volume_ate: parseNumber(row.faixa_volume_ate),
      valor_ate: parseNumber(row.faixa_valor_ate),
      valor_faixa: parseNumber(row.valor_faixa),
      fracao_base: fracao_base,
      tipo_calculo: row.tipo_calculo || 'valor_faixa',
      tipo_frete: row.tipo_frete || 'normal',
      frete_valor: parseNumber(row.frete_valor),
      frete_minimo: parseNumber(row.frete_minimo_faixa),
      tipo_taxa: row.tipo_taxa || 'com_taxas',
      taxa_minima: parseNumber(row.taxa_minima)
    });
  });

  return {
    success: true,
    errors: [],
    tables: Array.from(tablesMap.values()),
    rates: Array.from(ratesMap.values()),
    details: detailsList
  };
};
