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
        prazo_entrega: Number(row.prazo_entrega) || 0,
        
        pedagio_minimo: Number(row.pedagio_minimo) || 0,
        pedagio_por_kg: Number(row.pedagio_por_kg) || 0,
        pedagio_a_cada_kg: Number(row.pedagio_a_cada_kg) || 0,
        pedagio_tipo_kg: row.pedagio_tipo_kg || 'peso_calculo',
        
        icms_embutido_tabela: row.icms_embutido_tabela || 'nao_embutido',
        aliquota_icms: Number(row.aliquota_icms) || 0,
        
        fator_m3: Number(row.fator_m3) || 0,
        fator_m3_apartir_kg: Number(row.fator_m3_apartir_kg) || 0,
        fator_m3_apartir_m3: Number(row.fator_m3_apartir_m3) || 0,
        fator_m3_apartir_valor: Number(row.fator_m3_apartir_valor) || 0,
        
        percentual_gris: Number(row.percentual_gris) || 0,
        gris_minimo: Number(row.gris_minimo) || 0,
        seccat: Number(row.seccat) || 0,
        despacho: Number(row.despacho) || 0,
        itr: Number(row.itr) || 0,
        taxa_adicional: Number(row.taxa_adicional) || 0,
        coleta_entrega: Number(row.coleta_entrega) || 0,
        tde_trt: Number(row.tde_trt) || 0,
        tas: Number(row.tas) || 0,
        taxa_suframa: Number(row.taxa_suframa) || 0,
        
        valor_outros_percent: Number(row.valor_outros_percent) || 0,
        valor_outros_minimo: Number(row.valor_outros_minimo) || 0,
        taxa_outros_valor: Number(row.taxa_outros_valor) || 0,
        taxa_outros_tipo_valor: row.taxa_outros_tipo_valor || 'valor',
        taxa_apartir_de: Number(row.taxa_apartir_de) || 0,
        taxa_apartir_de_tipo: row.taxa_apartir_de_tipo || 'sem_apartir',
        taxa_outros_a_cada: Number(row.taxa_outros_a_cada) || 0,
        taxa_outros_minima: Number(row.taxa_outros_minima) || 0,
        
        frete_peso_minimo: Number(row.frete_peso_minimo) || 0,
        frete_valor_minimo: Number(row.frete_valor_minimo) || 0,
        frete_tonelada_minima: Number(row.frete_tonelada_minima) || 0,
        frete_percentual_minimo: Number(row.frete_percentual_minimo) || 0,
        frete_m3_minimo: Number(row.frete_m3_minimo) || 0,
        valor_total_minimo: Number(row.valor_total_minimo) || 0,

        _origem: row.origem_uf,
        _destino: row.destino_uf,
        _destino_cidade: row.destino_cidade,
        organization_id: tenantContext.organization_id,
        environment_id: tenantContext.environment_id,
        establishment_id: tenantContext.establishment_id
      });
    }

    // 3. Faixas (Details)
    let peso_ate = Number(row.faixa_peso_ate);
    if (isNaN(peso_ate) || peso_ate > 99000) peso_ate = 999999;
    
    let fracao_base = row.fracao_base ? Number(row.fracao_base) : null;
    if (fracao_base !== null && isNaN(fracao_base)) fracao_base = null;

    detailsList.push({
      _rateKey: rateKey,
      ordem: Number(row.detalhe_ordem) || detailsList.filter(d => d._rateKey === rateKey).length + 1,
      peso_ate: peso_ate,
      m3_ate: Number(row.faixa_m3_ate) || 0,
      volume_ate: Number(row.faixa_volume_ate) || 0,
      valor_ate: Number(row.faixa_valor_ate) || 0,
      valor_faixa: Number(row.valor_faixa) || 0,
      fracao_base: fracao_base,
      tipo_calculo: row.tipo_calculo || 'valor_faixa',
      tipo_frete: row.tipo_frete || 'normal',
      frete_valor: Number(row.frete_valor) || 0,
      frete_minimo: Number(row.frete_minimo_faixa) || 0,
      tipo_taxa: row.tipo_taxa || 'com_taxas',
      taxa_minima: Number(row.taxa_minima) || 0
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
